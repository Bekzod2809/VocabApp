namespace VocabApp.Api.Dtos;

public class SyncResponseDto
{
    // Telefon buni saqlab, keyingi sinxda LastVersion qilib yuboradi
    public long CurrentVersion { get; set; }
    // LastVersion'dan keyin serverda o'zgargan yozuvlar
    public List<GroupSyncDto> Groups { get; set; } = new();
    public List<WordSyncDto> Words { get; set; } = new();
    public List<WordProgressSyncDto> Progress { get; set; } = new();
}
