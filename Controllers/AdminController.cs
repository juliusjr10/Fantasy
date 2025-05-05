using FantasyBasketball.Services;
using Microsoft.AspNetCore.Mvc;

namespace FantasyBasketball.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly ImportService _importService;

        public AdminController(ImportService importService)
        {
            _importService = importService;
        }

        [HttpPost("import-nba-players")]
        public async Task<IActionResult> ImportNbaPlayers()
        {
            await _importService.ImportPlayersAsync();
            return Ok("NBA players imported successfully.");
        }
        [HttpPost("import-stats")]
        public async Task<IActionResult> ImportStats()
        {
            await _importService.ImportPlayerStatsAsync();
            return Ok("Player stats imported.");
        }
        [HttpPost("update-games")]
        public async Task<IActionResult> UpdateGames()
        {
            await _importService.UpdateGamesFromApiAsync();
            return Ok("Games updated with scores and teams.");
        }

    }
}
