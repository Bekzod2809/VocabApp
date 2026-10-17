namespace VocabApp.Api.Entities;

public class WordProgress
{
    public Guid WordId { get; set; }

    // Leitner qutisi: 1 - yangi/qiyin, 5 - yaxshi yodlangan
    public int Box { get; set; }

    public DateTime NextReviewAt { get; set; }

    public int CorrectCount { get; set; }

    public int WrongCount { get; set; }

    public DateTime UpdatedAt { get; set; }

    public long Version { get; set; }

    // Navigation Properties
    public Word Word { get; set; }
}
