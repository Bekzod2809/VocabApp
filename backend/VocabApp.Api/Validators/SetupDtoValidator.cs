using FluentValidation;
using VocabApp.Api.Dtos;

namespace VocabApp.Api.Validators;

public class SetupDtoValidator : AbstractValidator<SetupDto>
{
    public SetupDtoValidator()
    {
        RuleFor(x => x.UserName)
            .NotEmpty().WithMessage("UserName is required.")
            .MinimumLength(3).WithMessage("UserName must be at least 3 characters.")
            .MaximumLength(50).WithMessage("UserName must not exceed 50 characters.");
        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
            .MaximumLength(64).WithMessage("Password must not exceed 64 characters.");
    }
}
