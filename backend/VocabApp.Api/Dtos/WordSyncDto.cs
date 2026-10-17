namespace VocabApp.Api.Dtos;

public class WordSyncDto
{
    public Guid Id { get; set; }
    public Guid GroupId { get; set; }
    public string Term { get; set; }
    public string Translation { get; set; }
    public string? Example { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
}
