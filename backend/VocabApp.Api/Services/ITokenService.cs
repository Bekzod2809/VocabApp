using VocabApp.Api.Entities;

namespace VocabApp.Api.Services;

public interface ITokenService
{
    string GetToken(User user);
}
