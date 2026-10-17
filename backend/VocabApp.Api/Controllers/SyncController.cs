using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocabApp.Api.Dtos;
using VocabApp.Api.Services;

namespace VocabApp.Api.Controllers;

[Authorize]
[Route("api/sync")]
[ApiController]
public class SyncController : ControllerBase
{
    private readonly ISyncService SyncService;

    public SyncController(ISyncService syncService)
    {
        SyncService = syncService;
    }

    [HttpPost]
    public async Task<SyncResponseDto> Sync(SyncRequestDto syncRequestDto)
    {
        var response = await SyncService.SyncAsync(syncRequestDto);
        return response;
    }
}
