using VocabApp.Api.Dtos;

namespace VocabApp.Api.Services;

public interface ISyncService
{
    Task<SyncResponseDto> SyncAsync(SyncRequestDto syncRequestDto);
}
