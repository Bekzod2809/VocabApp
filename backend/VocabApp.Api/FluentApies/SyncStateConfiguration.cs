using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VocabApp.Api.Entities;

namespace VocabApp.Api.FluentApies;

public class SyncStateConfiguration : IEntityTypeConfiguration<SyncState>
{
    public void Configure(EntityTypeBuilder<SyncState> builder)
    {
        builder.ToTable("SyncStates");

        builder.HasKey(x => x.SyncStateId);

        builder.Property(x => x.SyncStateId)
            .ValueGeneratedNever();

        builder.Property(x => x.CurrentVersion)
            .IsRequired();

        builder.HasData(new SyncState { SyncStateId = 1, CurrentVersion = 0 });
    }
}
