namespace VocabApp.Api.Dtos;

public class WordProgressSyncDto
{
    public Guid WordId { get; set; }
    public int Box { get; set; }
    public DateTime NextReviewAt { get; set; }
    public int CorrectCount { get; set; }
    public int WrongCount { get; set; }
    public DateTime UpdatedAt { get; set; }
}
