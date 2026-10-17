using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using VocabApp.Api.Configurations.Settings;
using VocabApp.Api.Entities;

namespace VocabApp.Api.Services;

public class TokenService : ITokenService
{
    private readonly JwtSettings JwtSettings;

    public TokenService(JwtSettings jwtSettings)
    {
        JwtSettings = jwtSettings;
    }

    public string GetToken(User user)
    {
        var identityClaims = new Claim[]
        {
            new Claim("UserId", user.UserId.ToString()),
            new Claim("UserName", user.UserName)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(JwtSettings.SecretKey));
        var keyCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: JwtSettings.Issuer,
            audience: JwtSettings.Audience,
            claims: identityClaims,
            expires: DateTime.UtcNow.AddMinutes(JwtSettings.Lifetime),
            signingCredentials: keyCredentials
            );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
