using FluentValidation;

namespace VocabApp.Api.Validators;

public static class ValidatorExtensions
{
    public static void ValidateOrThrow<T>(this IValidator<T> validator, T instance)
    {
        var result = validator.Validate(instance);

        if (!result.IsValid)
        {
            var errors = result.Errors
                .GroupBy(x => x.PropertyName)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(x => x.ErrorMessage).ToArray());

            throw new VocabApp.Api.Exceptions.ValidationException(errors);
        }
    }
}
