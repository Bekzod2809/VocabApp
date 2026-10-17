using FluentValidation;
using Microsoft.EntityFrameworkCore;
using VocabApp.Api.Configurations.Settings;
using VocabApp.Api.Dtos;
using VocabApp.Api.Entities;
using VocabApp.Api.Exceptions;
using VocabApp.Api.Repositories;
using VocabApp.Api.Validators;

namespace VocabApp.Api.Services;

public class AuthService : IAuthService
{
    private readonly IBaseRepository<User> UserRepository;
    private readonly ITokenService TokenService;
    private readonly JwtSettings JwtSettings;
    private readonly IValidator<SetupDto> SetupDtoValidator;
    private readonly IValidator<LoginDto> LoginDtoValidator;

    public AuthService(
        IBaseRepository<User> userRepository,
        ITokenService tokenService,
        JwtSettings jwtSettings,
        IValidator<SetupDto> setupDtoValidator,
        IValidator<LoginDto> loginDtoValidator)
    {
        UserRepository = userRepository;
        TokenService = tokenService;
        JwtSettings = jwtSettings;
        SetupDtoValidator = setupDtoValidator;
        LoginDtoValidator = loginDtoValidator;
    }

    public async Task<SetupStatusDto> GetSetupStatusAsync()
    {
        var isSetupDone = await UserRepository.GetAllQuery().AnyAsync();

        return new SetupStatusDto { IsSetupDone = isSetupDone };
    }

    // Ilova faqat bitta foydalanuvchi uchun: u bir marta yaratiladi, keyin bu endpoint yopiladi
    public async Task<LoginResponseDto> SetupAsync(SetupDto setupDto)
    {
        SetupDtoValidator.ValidateOrThrow(setupDto);

        if (await UserRepository.GetAllQuery().AnyAsync())
        {
            throw new ConflictException("User already exists. Use login instead.");
        }

        var (hash, salt) = PasswordHasher.Hasher(setupDto.Password);

        var user = new User
        {
            UserName = setupDto.UserName.Trim(),
            PasswordHash = hash,
            Salt = salt,
            CreatedAt = DateTime.UtcNow
        };

        await UserRepository.AddAsync(user);
        await UserRepository.SaveChangesAsync();

        return CreateLoginResponse(user);
    }

    public async Task<LoginResponseDto> LoginAsync(LoginDto loginDto)
    {
        LoginDtoValidator.ValidateOrThrow(loginDto);

        var user = await UserRepository
                    .GetAllQuery()
                    .FirstOrDefaultAsync(u => u.UserName == loginDto.UserName.Trim());

        if (user == null || !PasswordHasher.Verify(loginDto.Password, user.PasswordHash, user.Salt))
        {
            throw new UnauthorizedException("Invalid username or password.");
        }

        return CreateLoginResponse(user);
    }

    private LoginResponseDto CreateLoginResponse(User user)
    {
        return new LoginResponseDto
        {
            AccessToken = TokenService.GetToken(user),
            TokenType = "Bearer",
            Expires = JwtSettings.Lifetime
        };
    }
}
