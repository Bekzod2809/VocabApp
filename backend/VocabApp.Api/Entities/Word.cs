namespace VocabApp.Api.Entities;

public class Word
{
    public Guid WordId { get; set; }

    public Guid GroupId { get; set; }

    public string Term { get; set; }

    public string Translation { get; set; }

    public string? Example { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public long Version { get; set; }

    // Navigation Properties
    public Group Group { get; set; }

    public WordProgress? Progress { get; set; }
}
