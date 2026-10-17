namespace VocabApp.Api.Entities;

public class User
{
    public long UserId { get; set; }

    public string UserName { get; set; }

    public string PasswordHash { get; set; }

    public string Salt { get; set; }

    public DateTime CreatedAt { get; set; }
}
