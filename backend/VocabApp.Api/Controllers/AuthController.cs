using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using VocabApp.Api.Configurations;
using VocabApp.Api.Dtos;
using VocabApp.Api.Services;

namespace VocabApp.Api.Controllers;

[Route("api/auth")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IAuthService AuthService;

    public AuthController(IAuthService authService)
    {
        AuthService = authService;
    }

    [HttpGet("setup-status")]
    public async Task<SetupStatusDto> GetSetupStatus()
    {
        var status = await AuthService.GetSetupStatusAsync();
        return status;
    }

    [EnableRateLimiting(RateLimitConfigurations.AuthPolicy)]
    [HttpPost("setup")]
    public async Task<LoginResponseDto> Setup(SetupDto setupDto)
    {
        var token = await AuthService.SetupAsync(setupDto);
        return token;
    }

    [EnableRateLimiting(RateLimitConfigurations.AuthPolicy)]
    [HttpPost("login")]
    public async Task<LoginResponseDto> Login(LoginDto loginDto)
    {
        var token = await AuthService.LoginAsync(loginDto);
        return token;
    }
}
