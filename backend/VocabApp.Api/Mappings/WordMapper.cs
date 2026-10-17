using VocabApp.Api.Dtos;
using VocabApp.Api.Entities;

namespace VocabApp.Api.Mappings;

public static class WordMapper
{
    public static Word ToEntity(this WordSyncDto dto, long version)
    {
        return new Word
        {
            WordId = dto.Id,
            GroupId = dto.GroupId,
            Term = dto.Term.Trim(),
            Translation = dto.Translation.Trim(),
            Example = string.IsNullOrWhiteSpace(dto.Example) ? null : dto.Example.Trim(),
            CreatedAt = dto.CreatedAt.ToUtc(),
            UpdatedAt = dto.UpdatedAt.ToUtc(),
            IsDeleted = dto.IsDeleted,
            Version = version
        };
    }

    public static WordSyncDto ToSyncDto(this Word word)
    {
        return new WordSyncDto
        {
            Id = word.WordId,
            GroupId = word.GroupId,
            Term = word.Term,
            Translation = word.Translation,
            Example = word.Example,
            CreatedAt = word.CreatedAt,
            UpdatedAt = word.UpdatedAt,
            IsDeleted = word.IsDeleted
        };
    }

    public static void ToUpdateEntity(this WordSyncDto dto, Word word, long version)
    {
        word.GroupId = dto.GroupId;
        word.Term = dto.Term.Trim();
        word.Translation = dto.Translation.Trim();
        word.Example = string.IsNullOrWhiteSpace(dto.Example) ? null : dto.Example.Trim();
        word.UpdatedAt = dto.UpdatedAt.ToUtc();
        word.IsDeleted = dto.IsDeleted;
        word.Version = version;
    }
}
