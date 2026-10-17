using Microsoft.EntityFrameworkCore;
using VocabApp.Api.Entities;

namespace VocabApp.Api.Data;

public class AppDbContext : DbContext
{
    public DbSet<Group> Groups { get; set; }
    public DbSet<Word> Words { get; set; }
    public DbSet<WordProgress> WordProgresses { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<SyncState> SyncStates { get; set; }


    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(AppDbContext).Assembly);

        base.OnModelCreating(modelBuilder);
    }
}
