using Microsoft.EntityFrameworkCore.Storage;
using VocabApp.Api.Entities;

namespace VocabApp.Api.Repositories;

public interface ISyncStateRepository
{
    Task<SyncState> GetAsync();
    Task<IDbContextTransaction> BeginLockedTransactionAsync();
    Task SaveChangesAsync();
}
