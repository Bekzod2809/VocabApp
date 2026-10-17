namespace VocabApp.Api.Dtos;

public class LoginResponseDto
{
    public string AccessToken { get; set; }
    public string TokenType { get; set; }
    // Daqiqalarda
    public int Expires { get; set; }
}
