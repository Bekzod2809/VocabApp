namespace VocabApp.Api.Entities;

public class Group
{
    public Guid GroupId { get; set; }

    public string Name { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }

    // Sinxronlash uchun: har o'zgarishda server yangi versiya beradi
    public long Version { get; set; }

    // Navigation Properties
    public ICollection<Word> Words { get; set; }
}
