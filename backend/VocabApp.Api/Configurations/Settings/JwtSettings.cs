namespace VocabApp.Api.Configurations.Settings;

public class JwtSettings
{
    public string Issuer { get; set; }
    public string Audience { get; set; }
    public string SecretKey { get; set; }
    // Daqiqalarda
    public int Lifetime { get; set; }
}
