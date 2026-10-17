namespace VocabApp.Api.Entities;

// Bitta qatorli jadval: serverdagi eng oxirgi versiya raqami
public class SyncState
{
    public int SyncStateId { get; set; }

    public long CurrentVersion { get; set; }
}
