using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VocabApp.Api.Entities;

namespace VocabApp.Api.FluentApies;

public class WordProgressConfiguration : IEntityTypeConfiguration<WordProgress>
{
    public void Configure(EntityTypeBuilder<WordProgress> builder)
    {
        builder.ToTable("WordProgresses");

        builder.HasKey(x => x.WordId);

        builder.Property(x => x.WordId)
            .ValueGeneratedNever();

        builder.Property(x => x.Box)
            .IsRequired();

        builder.Property(x => x.NextReviewAt)
            .IsRequired();

        builder.Property(x => x.CorrectCount)
            .IsRequired();

        builder.Property(x => x.WrongCount)
            .IsRequired();

        builder.Property(x => x.UpdatedAt)
            .IsRequired();

        builder.Property(x => x.Version)
            .IsRequired();

        builder.HasIndex(x => x.Version);
    }
}
