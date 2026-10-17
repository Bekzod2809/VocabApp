using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VocabApp.Api.Entities;

namespace VocabApp.Api.FluentApies;

public class WordConfiguration : IEntityTypeConfiguration<Word>
{
    public void Configure(EntityTypeBuilder<Word> builder)
    {
        builder.ToTable("Words");

        builder.HasKey(x => x.WordId);

        builder.Property(x => x.WordId)
            .ValueGeneratedNever();

        builder.Property(x => x.Term)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.Translation)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(x => x.Example)
            .HasMaxLength(1000);

        builder.Property(x => x.CreatedAt)
            .IsRequired();

        builder.Property(x => x.UpdatedAt)
            .IsRequired();

        builder.Property(x => x.IsDeleted)
            .IsRequired();

        builder.Property(x => x.Version)
            .IsRequired();

        builder.HasIndex(x => x.Version);

        builder.HasOne(x => x.Progress)
            .WithOne(x => x.Word)
            .HasForeignKey<WordProgress>(x => x.WordId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
