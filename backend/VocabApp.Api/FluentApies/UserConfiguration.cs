using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VocabApp.Api.Entities;

namespace VocabApp.Api.FluentApies;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");

        builder.HasKey(x => x.UserId);

        builder.Property(x => x.UserId)
            .ValueGeneratedOnAdd();

        builder.Property(x => x.UserName)
            .IsRequired()
            .HasMaxLength(50);

        builder.HasIndex(x => x.UserName)
            .IsUnique();

        builder.Property(x => x.PasswordHash)
            .IsRequired();

        builder.Property(x => x.Salt)
            .IsRequired();

        builder.Property(x => x.CreatedAt)
            .IsRequired();
    }
}
