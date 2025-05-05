using FantasyBasketball.Dtos;
using FantasyBasketball.Models;
using FantasyBasketball.Services;
using Microsoft.AspNetCore.Mvc;

namespace FantasyBasketball.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlayersController : ControllerBase
    {
        private readonly IPlayerService _playerService;

        public PlayersController(IPlayerService playerService)
        {
            _playerService = playerService;
        }

        [HttpGet]
        public async Task<IActionResult> GetPlayers()
        {
            var players = await _playerService.GetPlayersAsync();
            return Ok(players);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPlayerById(int id)
        {
            var player = await _playerService.GetPlayerByIdAsync(id);
            if (player == null)
                return NotFound();

            return Ok(player);
        }

        [HttpGet("team/{teamName}")]
        public async Task<IActionResult> GetPlayersByTeam(string teamName)
        {
            var players = await _playerService.GetPlayersByTeamAsync(teamName);
            return Ok(players);
        }

        [HttpGet("league/{leagueId}/free-agents")]
        public async Task<IActionResult> GetFreeAgentsInLeague(int leagueId)
        {
            var players = await _playerService.GetFreeAgentsInLeagueAsync(leagueId);
            return Ok(players);
        }

        [HttpGet("position/{position}")]
        public async Task<IActionResult> GetPlayersByPosition(string position)
        {
            var players = await _playerService.GetPlayersByPositionAsync(position);
            return Ok(players);
        }

        [HttpGet("{id}/stats")]
        public async Task<IActionResult> GetStatsByPlayerId(int id)
        {
            var stats = await _playerService.GetStatsByPlayerIdAsync(id);
            return Ok(stats);
        }

        [HttpGet("{id}/averages")]
        public async Task<IActionResult> GetPlayerAverages(int id)
        {
            var averages = await _playerService.GetPlayerAveragesAsync(id);
            return Ok(averages);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePlayer(int id, [FromBody] PlayerUpdateDto dto)
        {
            var success = await _playerService.UpdatePlayerAsync(id, dto);
            if (!success)
                return NotFound();

            return Ok(dto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePlayer(int id)
        {
            var success = await _playerService.DeletePlayerAsync(id);
            if (!success)
                return NotFound();

            return Ok(new { message = "Player deleted successfully." });
        }

        [HttpPost("calculate-fantasy-points")]
        public async Task<IActionResult> CalculateFantasyPointsForAllStats()
        {
            var result = await _playerService.CalculateFantasyPointsForAllStatsAsync();
            return Ok(result);
        }

        [HttpGet("game/{gameId}")]
        public async Task<IActionResult> GetPlayerStatsByGame(int gameId)
        {
            var stats = await _playerService.GetPlayerStatsByGameAsync(gameId);
            if (!stats.Any())
                return NotFound($"No stats found for Game ID {gameId}");

            return Ok(stats);
        }

        [HttpPost("update-prices")]
        public async Task<IActionResult> UpdatePlayerPrices()
        {
            var result = await _playerService.UpdatePlayerPricesAsync();
            return Ok(result);
        }
    }
}
