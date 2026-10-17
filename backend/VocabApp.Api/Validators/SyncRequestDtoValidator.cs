using FluentValidation;
using VocabApp.Api.Dtos;

namespace VocabApp.Api.Validators;

public class SyncRequestDtoValidator : AbstractValidator<SyncRequestDto>
{
    private const int MaxItemsPerSync = 10_000;

    public SyncRequestDtoValidator()
    {
        RuleFor(x => x.LastVersion)
            .GreaterThanOrEqualTo(0).WithMessage("LastVersion must be a non-negative value.");

        RuleFor(x => x.Groups)
            .Cascade(CascadeMode.Stop)
            .NotNull()
            .Must(x => x.Count <= MaxItemsPerSync).WithMessage($"Groups must not exceed {MaxItemsPerSync} items.")
            .Must(x => x.Select(g => g.Id).Distinct().Count() == x.Count).WithMessage("Groups contain duplicate Ids.");
        RuleForEach(x => x.Groups).ChildRules(group =>
        {
            group.RuleFor(g => g.Id).NotEmpty().WithMessage("Group Id is required.");
            group.RuleFor(g => g.Name)
                .NotEmpty().WithMessage("Group Name is required.")
                .MaximumLength(100).WithMessage("Group Name must not exceed 100 characters.");
        });

        RuleFor(x => x.Words)
            .Cascade(CascadeMode.Stop)
            .NotNull()
            .Must(x => x.Count <= MaxItemsPerSync).WithMessage($"Words must not exceed {MaxItemsPerSync} items.")
            .Must(x => x.Select(w => w.Id).Distinct().Count() == x.Count).WithMessage("Words contain duplicate Ids.");
        RuleForEach(x => x.Words).ChildRules(word =>
        {
            word.RuleFor(w => w.Id).NotEmpty().WithMessage("Word Id is required.");
            word.RuleFor(w => w.GroupId).NotEmpty().WithMessage("Word GroupId is required.");
            word.RuleFor(w => w.Term)
                .NotEmpty().WithMessage("Term is required.")
                .MaximumLength(200).WithMessage("Term must not exceed 200 characters.");
            word.RuleFor(w => w.Translation)
                .NotEmpty().WithMessage("Translation is required.")
                .MaximumLength(500).WithMessage("Translation must not exceed 500 characters.");
            word.RuleFor(w => w.Example)
                .MaximumLength(1000).WithMessage("Example must not exceed 1000 characters.");
        });

        RuleFor(x => x.Progress)
            .Cascade(CascadeMode.Stop)
            .NotNull()
            .Must(x => x.Count <= MaxItemsPerSync).WithMessage($"Progress must not exceed {MaxItemsPerSync} items.")
            .Must(x => x.Select(p => p.WordId).Distinct().Count() == x.Count).WithMessage("Progress contains duplicate WordIds.");
        RuleForEach(x => x.Progress).ChildRules(progress =>
        {
            progress.RuleFor(p => p.WordId).NotEmpty().WithMessage("Progress WordId is required.");
            progress.RuleFor(p => p.Box)
                .InclusiveBetween(1, 5).WithMessage("Box must be between 1 and 5.");
            progress.RuleFor(p => p.CorrectCount)
                .GreaterThanOrEqualTo(0).WithMessage("CorrectCount must be a non-negative value.");
            progress.RuleFor(p => p.WrongCount)
                .GreaterThanOrEqualTo(0).WithMessage("WrongCount must be a non-negative value.");
        });
    }
}
