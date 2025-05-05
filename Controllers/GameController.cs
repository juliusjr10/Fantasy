using FantasyBasketball.Models;
using FantasyBasketball.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FantasyBasketball.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GameController : ControllerBase
    {
        private readonly IGameService _gameService;

        public GameController(IGameService gameService)
        {
            _gameService = gameService;
        }

        [HttpPost("update-calculated-games")]
        public async Task<IActionResult> MarkGamesAsCalculated([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            var message = await _gameService.MarkGamesAsCalculated(startDate, endDate);
            return Ok(message);
        }

        [HttpPost("undo-calculated-games")]
        public async Task<IActionResult> UnmarkGamesAsCalculated([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            var message = await _gameService.UnmarkGamesAsCalculated(startDate, endDate);
            return Ok(message);
        }

        [HttpGet("by-player/{playerId}")]
        public async Task<IActionResult> GetGamesByPlayerId(int playerId)
        {
            var games = await _gameService.GetGamesByPlayerId(playerId);
            if (!games.Any())
                return NotFound($"No games found for player ID {playerId}.");

            return Ok(games);
        }

        [HttpGet("calculated-games")]
        public async Task<IActionResult> GetCalculatedGames()
        {
            var games = await _gameService.GetCalculatedGames();
            if (!games.Any())
                return NotFound("No calculated games found.");

            return Ok(games);
        }

        [HttpGet("games/by-date")]
        public async Task<IActionResult> GetGamesByDate([FromQuery] DateTime startDate, [FromQuery] DateTime? endDate = null)
        {
            var games = await _gameService.GetGamesByDate(startDate, endDate);
            if (!games.Any())
                return NotFound("No games found in the specified date range.");

            return Ok(games);
        }

        [HttpGet("{gameId}/data")]
        public async Task<IActionResult> GetGameData(int gameId)
        {
            var data = await _gameService.GetGameData(gameId);
            if (data == null)
                return NotFound($"No game found with ID {gameId}.");

            return Ok(data);
        }
    }
}
