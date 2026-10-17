namespace VocabApp.Api.Dtos;

public class SyncRequestDto
{
    // Telefon oxirgi marta olgan versiya (birinchi marta 0)
    public long LastVersion { get; set; }
    // Telefonda o'zgargan, hali serverga yuborilmagan yozuvlar
    public List<GroupSyncDto> Groups { get; set; } = new();
    public List<WordSyncDto> Words { get; set; } = new();
    public List<WordProgressSyncDto> Progress { get; set; } = new();
}
