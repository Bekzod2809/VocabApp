using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using VocabApp.Api.Data;
using VocabApp.Api.Entities;

namespace VocabApp.Api.Repositories;

public class SyncStateRepository : ISyncStateRepository
{
    // pg_advisory_xact_lock uchun ixtiyoriy, lekin o'zgarmas raqam
    private const long SyncLockKey = 7_001;

    private readonly AppDbContext DbContext;

    public SyncStateRepository(AppDbContext dbContext)
    {
        DbContext = dbContext;
    }

    public async Task<SyncState> GetAsync()
    {
        return await DbContext.SyncStates.FirstAsync(x => x.SyncStateId == 1);
    }

    // Ikki qurilma bir vaqtda sinx qilsa, ular navbat bilan bajariladi.
    // Aks holda versiya raqamlari aralashib, o'zgarish yo'qolib qolishi mumkin.
    public async Task<IDbContextTransaction> BeginLockedTransactionAsync()
    {
        var transaction = await DbContext.Database.BeginTransactionAsync();
        await DbContext.Database.ExecuteSqlAsync($"SELECT pg_advisory_xact_lock({SyncLockKey})");
        return transaction;
    }

    public async Task SaveChangesAsync()
    {
        await DbContext.SaveChangesAsync();
    }
}
