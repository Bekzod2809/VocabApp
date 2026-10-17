using VocabApp.Api.Configurations.Settings;

namespace VocabApp.Api.Configurations;

public static class JwtConfigurations
{
    public static void ConfigureJwt(this WebApplicationBuilder builder)
    {
        var secretKey = builder.Configuration["Jwt:SecurityKey"];

        // HmacSha256 uchun kalit kamida 32 bayt bo'lishi kerak
        if (string.IsNullOrWhiteSpace(secretKey) || secretKey.Length < 32)
        {
            throw new InvalidOperationException("Jwt:SecurityKey is missing or shorter than 32 characters.");
        }

        var jwtSettings = new JwtSettings
        {
            Issuer = builder.Configuration["Jwt:Issuer"]!,
            Audience = builder.Configuration["Jwt:Audience"]!,
            SecretKey = secretKey,
            Lifetime = int.Parse(builder.Configuration["Jwt:Lifetime"]!)
        };

        builder.Services.AddSingleton(jwtSettings);
    }
}
