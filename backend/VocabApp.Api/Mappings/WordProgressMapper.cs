using VocabApp.Api.Dtos;
using VocabApp.Api.Entities;

namespace VocabApp.Api.Mappings;

public static class WordProgressMapper
{
    public static WordProgress ToEntity(this WordProgressSyncDto dto, long version)
    {
        return new WordProgress
        {
            WordId = dto.WordId,
            Box = dto.Box,
            NextReviewAt = dto.NextReviewAt.ToUtc(),
            CorrectCount = dto.CorrectCount,
            WrongCount = dto.WrongCount,
            UpdatedAt = dto.UpdatedAt.ToUtc(),
            Version = version
        };
    }

    public static WordProgressSyncDto ToSyncDto(this WordProgress progress)
    {
        return new WordProgressSyncDto
        {
            WordId = progress.WordId,
            Box = progress.Box,
            NextReviewAt = progress.NextReviewAt,
            CorrectCount = progress.CorrectCount,
            WrongCount = progress.WrongCount,
            UpdatedAt = progress.UpdatedAt
        };
    }

    public static void ToUpdateEntity(this WordProgressSyncDto dto, WordProgress progress, long version)
    {
        progress.Box = dto.Box;
        progress.NextReviewAt = dto.NextReviewAt.ToUtc();
        progress.CorrectCount = dto.CorrectCount;
        progress.WrongCount = dto.WrongCount;
        progress.UpdatedAt = dto.UpdatedAt.ToUtc();
        progress.Version = version;
    }
}
