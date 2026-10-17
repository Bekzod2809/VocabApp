using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VocabApp.Api.Dtos;
using VocabApp.Api.Entities;
using VocabApp.Api.Exceptions;
using VocabApp.Api.Mappings;
using VocabApp.Api.Repositories;
using VocabApp.Api.Validators;

namespace VocabApp.Api.Services;

// Sinx qoidalari:
// 1. Telefon o'zgargan yozuvlarni yuboradi (push), server esa LastVersion'dan keyingi o'zgarishlarni qaytaradi (pull).
// 2. To'qnashuvda UpdatedAt kattaroq bo'lgan yozuv yutadi (last write wins).
// 3. Yutqazgan yozuvning serverdagi holati javobda qaytariladi, telefon uni o'ziga yozib qo'yadi.
public class SyncService : ISyncService
{
    private readonly IBaseRepository<Group> GroupRepository;
    private readonly IBaseRepository<Word> WordRepository;
    private readonly IBaseRepository<WordProgress> WordProgressRepository;
    private readonly ISyncStateRepository SyncStateRepository;
    private readonly IValidator<SyncRequestDto> SyncRequestDtoValidator;

    public SyncService(
        IBaseRepository<Group> groupRepository,
        IBaseRepository<Word> wordRepository,
        IBaseRepository<WordProgress> wordProgressRepository,
        ISyncStateRepository syncStateRepository,
        IValidator<SyncRequestDto> syncRequestDtoValidator)
    {
        GroupRepository = groupRepository;
        WordRepository = wordRepository;
        WordProgressRepository = wordProgressRepository;
        SyncStateRepository = syncStateRepository;
        SyncRequestDtoValidator = syncRequestDtoValidator;
    }

    public async Task<SyncResponseDto> SyncAsync(SyncRequestDto syncRequestDto)
    {
        SyncRequestDtoValidator.ValidateOrThrow(syncRequestDto);

        await using var transaction = await SyncStateRepository.BeginLockedTransactionAsync();

        var syncState = await SyncStateRepository.GetAsync();

        if (syncRequestDto.LastVersion > syncState.CurrentVersion)
        {
            throw new BadRequestException("LastVersion is ahead of the server. Reset local data and sync again.");
        }

        // Shu sinxda o'zgargan hamma yozuvlar bitta yangi versiya oladi
        var newVersion = syncState.CurrentVersion + 1;

        var rejectedGroupIds = new List<Guid>();
        var rejectedWordIds = new List<Guid>();
        var rejectedProgressIds = new List<Guid>();

        var hasChanges = await PushGroupsAsync(syncRequestDto.Groups, newVersion, rejectedGroupIds);
        hasChanges |= await PushWordsAsync(syncRequestDto.Words, syncRequestDto.Groups, newVersion, rejectedWordIds);
        hasChanges |= await PushProgressAsync(syncRequestDto.Progress, syncRequestDto.Words, newVersion, rejectedProgressIds);

        await WordRepository.SaveChangesAsync();

        var cascadeDeletedWordIds = await DeleteWordsOfDeletedGroupsAsync(newVersion);
        hasChanges |= cascadeDeletedWordIds.Count > 0;

        if (hasChanges)
        {
            syncState.CurrentVersion = newVersion;
        }

        await SyncStateRepository.SaveChangesAsync();

        // Telefon o'zi yuborgan va qabul qilingan yozuvlarni unga qaytarib yuborishning keragi yo'q
        var echoGroupIds = syncRequestDto.Groups
                            .Select(g => g.Id)
                            .Except(rejectedGroupIds)
                            .ToList();
        var echoWordIds = syncRequestDto.Words
                            .Select(w => w.Id)
                            .Except(rejectedWordIds)
                            .Except(cascadeDeletedWordIds)
                            .ToList();
        var echoProgressIds = syncRequestDto.Progress
                            .Select(p => p.WordId)
                            .Except(rejectedProgressIds)
                            .ToList();

        var response = await PullAsync(
            syncRequestDto.LastVersion,
            new PullFilter(rejectedGroupIds, echoGroupIds),
            new PullFilter(rejectedWordIds, echoWordIds),
            new PullFilter(rejectedProgressIds, echoProgressIds));

        response.CurrentVersion = syncState.CurrentVersion;

        await transaction.CommitAsync();

        return response;
    }

    private async Task<bool> PushGroupsAsync(List<GroupSyncDto> groupDtos, long newVersion, List<Guid> rejectedIds)
    {
        if (groupDtos.Count == 0)
        {
            return false;
        }

        var ids = groupDtos.Select(g => g.Id).ToList();

        var existingGroups = await GroupRepository
                                .GetAllQuery()
                                .Where(g => ids.Contains(g.GroupId))
                                .ToDictionaryAsync(g => g.GroupId);

        var hasChanges = false;

        foreach (var dto in groupDtos)
        {
            if (!existingGroups.TryGetValue(dto.Id, out var group))
            {
                await GroupRepository.AddAsync(dto.ToEntity(newVersion));
                hasChanges = true;
            }
            else if (dto.UpdatedAt.ToUtc() > group.UpdatedAt)
            {
                dto.ToUpdateEntity(group, newVersion);
                hasChanges = true;
            }
            else if (dto.UpdatedAt.ToUtc() < group.UpdatedAt)
            {
                rejectedIds.Add(group.GroupId);
            }
        }

        return hasChanges;
    }

    private async Task<bool> PushWordsAsync(List<WordSyncDto> wordDtos, List<GroupSyncDto> groupDtos, long newVersion, List<Guid> rejectedIds)
    {
        if (wordDtos.Count == 0)
        {
            return false;
        }

        await EnsureGroupsExistAsync(wordDtos, groupDtos);

        var ids = wordDtos.Select(w => w.Id).ToList();

        var existingWords = await WordRepository
                                .GetAllQuery()
                                .Where(w => ids.Contains(w.WordId))
                                .ToDictionaryAsync(w => w.WordId);

        var hasChanges = false;

        foreach (var dto in wordDtos)
        {
            if (!existingWords.TryGetValue(dto.Id, out var word))
            {
                await WordRepository.AddAsync(dto.ToEntity(newVersion));
                hasChanges = true;
            }
            else if (dto.UpdatedAt.ToUtc() > word.UpdatedAt)
            {
                dto.ToUpdateEntity(word, newVersion);
                hasChanges = true;
            }
            else if (dto.UpdatedAt.ToUtc() < word.UpdatedAt)
            {
                rejectedIds.Add(word.WordId);
            }
        }

        return hasChanges;
    }

    private async Task<bool> PushProgressAsync(List<WordProgressSyncDto> progressDtos, List<WordSyncDto> wordDtos, long newVersion, List<Guid> rejectedIds)
    {
        if (progressDtos.Count == 0)
        {
            return false;
        }

        await EnsureWordsExistAsync(progressDtos, wordDtos);

        var ids = progressDtos.Select(p => p.WordId).ToList();

        var existingProgress = await WordProgressRepository
                                .GetAllQuery()
                                .Where(p => ids.Contains(p.WordId))
                                .ToDictionaryAsync(p => p.WordId);

        var hasChanges = false;

        foreach (var dto in progressDtos)
        {
            if (!existingProgress.TryGetValue(dto.WordId, out var progress))
            {
                await WordProgressRepository.AddAsync(dto.ToEntity(newVersion));
                hasChanges = true;
            }
            else if (dto.UpdatedAt.ToUtc() > progress.UpdatedAt)
            {
                dto.ToUpdateEntity(progress, newVersion);
                hasChanges = true;
            }
            else if (dto.UpdatedAt.ToUtc() < progress.UpdatedAt)
            {
                rejectedIds.Add(progress.WordId);
            }
        }

        return hasChanges;
    }

    // Guruh o'chirilsa, uning ichidagi so'zlar ham o'chirilgan deb belgilanadi
    private async Task<List<Guid>> DeleteWordsOfDeletedGroupsAsync(long newVersion)
    {
        var orphanWords = await WordRepository
                            .GetAllQuery()
                            .Where(w => !w.IsDeleted && w.Group.IsDeleted)
                            .ToListAsync();

        if (orphanWords.Count == 0)
        {
            return new List<Guid>();
        }

        var now = DateTime.UtcNow;

        foreach (var word in orphanWords)
        {
            word.IsDeleted = true;
            word.UpdatedAt = now;
            word.Version = newVersion;
        }

        return orphanWords.Select(w => w.WordId).ToList();
    }

    private async Task EnsureGroupsExistAsync(List<WordSyncDto> wordDtos, List<GroupSyncDto> groupDtos)
    {
        var groupIds = wordDtos
                        .Select(w => w.GroupId)
                        .Except(groupDtos.Select(g => g.Id))
                        .Distinct()
                        .ToList();

        var foundCount = await GroupRepository
                            .GetAllQuery()
                            .CountAsync(g => groupIds.Contains(g.GroupId));

        if (foundCount != groupIds.Count)
        {
            throw new BadRequestException("Some words reference groups that do not exist.");
        }
    }

    private async Task EnsureWordsExistAsync(List<WordProgressSyncDto> progressDtos, List<WordSyncDto> wordDtos)
    {
        var wordIds = progressDtos
                        .Select(p => p.WordId)
                        .Except(wordDtos.Select(w => w.Id))
                        .ToList();

        var foundCount = await WordRepository
                            .GetAllQuery()
                            .CountAsync(w => wordIds.Contains(w.WordId));

        if (foundCount != wordIds.Count)
        {
            throw new BadRequestException("Some progress items reference words that do not exist.");
        }
    }

    // Rejected: albatta qaytariladi (telefondagi nusxa eskirgan).
    // Echo: telefon o'zi yuborgan, unda allaqachon bor - qaytarilmaydi.
    private record PullFilter(List<Guid> Rejected, List<Guid> Echo);

    private async Task<SyncResponseDto> PullAsync(
        long lastVersion,
        PullFilter groupFilter,
        PullFilter wordFilter,
        PullFilter progressFilter)
    {
        // Birinchi sinxda o'chirilgan yozuvlarni yuborishning keragi yo'q
        var isFirstSync = lastVersion == 0;

        var groups = await GroupRepository
                        .GetAllQuery()
                        .AsNoTracking()
                        .Where(g => (g.Version > lastVersion
                                        && (!isFirstSync || !g.IsDeleted)
                                        && !groupFilter.Echo.Contains(g.GroupId))
                                    || groupFilter.Rejected.Contains(g.GroupId))
                        .ToListAsync();

        var words = await WordRepository
                        .GetAllQuery()
                        .AsNoTracking()
                        .Where(w => (w.Version > lastVersion
                                        && (!isFirstSync || !w.IsDeleted)
                                        && !wordFilter.Echo.Contains(w.WordId))
                                    || wordFilter.Rejected.Contains(w.WordId))
                        .ToListAsync();

        var progress = await WordProgressRepository
                        .GetAllQuery()
                        .AsNoTracking()
                        .Where(p => (p.Version > lastVersion
                                        && (!isFirstSync || !p.Word.IsDeleted)
                                        && !progressFilter.Echo.Contains(p.WordId))
                                    || progressFilter.Rejected.Contains(p.WordId))
                        .ToListAsync();

        return new SyncResponseDto
        {
            Groups = groups.Select(g => g.ToSyncDto()).ToList(),
            Words = words.Select(w => w.ToSyncDto()).ToList(),
            Progress = progress.Select(p => p.ToSyncDto()).ToList()
        };
    }
}
