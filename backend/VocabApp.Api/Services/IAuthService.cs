using VocabApp.Api.Dtos;

namespace VocabApp.Api.Services;

public interface IAuthService
{
    Task<SetupStatusDto> GetSetupStatusAsync();
    Task<LoginResponseDto> SetupAsync(SetupDto setupDto);
    Task<LoginResponseDto> LoginAsync(LoginDto loginDto);
}
