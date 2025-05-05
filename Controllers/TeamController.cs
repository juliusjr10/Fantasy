using FantasyBasketball.DTOs.FantasyBasketball.Dtos;
using FantasyBasketball.Dtos;
using FantasyBasketball.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FantasyBasketball.DTOs;
using Microsoft.EntityFrameworkCore;

namespace FantasyBasketball.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TeamController : ControllerBase
    {
        private readonly ITeamService _teamService;

        public TeamController(ITeamService teamService)
        {
            _teamService = teamService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateTeam([FromBody] CreateTeamDto dto)
        {
            var result = await _teamService.CreateTeamAsync(dto);
            if (!result.Success)
                return BadRequest(result.Message);

            return Ok(result.Result);
        }

        [Authorize]
        [HttpGet("my")]
        public async Task<IActionResult> GetMyTeams()
        {
            var teams = await _teamService.GetMyTeamsAsync(User);
            return Ok(teams);
        }

        [HttpPost("add-player")]
        public async Task<IActionResult> AddPlayerToTeam([FromBody] AddPlayerToTeamDto dto)
        {
            var result = await _teamService.AddPlayerToTeamAsync(dto);
            if (!result.Success)
                return BadRequest(result.Message);

            return Ok(result.Result);
        }

        [HttpPost("set-role")]
        public async Task<IActionResult> SetPlayerRole([FromBody] SetPlayerRoleDto dto)
        {
            var result = await _teamService.SetPlayerRoleAsync(dto);
            if (!result.Success)
                return BadRequest(result.Message);

            return Ok(new { result.Message });
        }

        [HttpGet("{teamId}/players")]
        public async Task<IActionResult> GetPlayersByTeamId(int teamId)
        {
            var players = await _teamService.GetPlayersByTeamIdAsync(teamId);
            return Ok(players);
        }

        [HttpPost("add-total-points")]
        public async Task<IActionResult> RecalculateTotalTeamPoints([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            var result = await _teamService.RecalculateTotalTeamPointsAsync(startDate, endDate);
            return Ok(result);
        }

        [HttpGet("{teamId}")]
        public async Task<IActionResult> GetTeamById(int teamId)
        {
            var team = await _teamService.GetTeamByIdAsync(teamId);
            if (team == null)
                return NotFound("Team not found");

            return Ok(team);
        }

        [HttpPost("take-free-agent")]
        public async Task<IActionResult> TakeFreeAgent([FromBody] TakePlayerDto dto)
        {
            var result = await _teamService.TakeFreeAgentAsync(dto);
            if (!result.Success)
                return BadRequest(result.Message);

            return Ok(result.Result);
        }

        [Authorize]
        [HttpDelete("{teamId}")]
        public async Task<IActionResult> DeleteTeam(int teamId)
        {
            var result = await _teamService.DeleteTeamAsync(teamId, User);
            if (!result.Success)
                return NotFound(result.Message);

            return Ok(new { result.Message });
        }
        [Authorize]
        [HttpPost("boost")]
        public async Task<IActionResult> BoostTeamWithCoins([FromBody] BoostTeamDto dto)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                return Unauthorized("Invalid user ID.");

            var result = await _teamService.ApplyCustomBoostToTeamAsync(dto.TeamId, userId, dto.CoinsToSpend);

            if (!result.Success)
                return BadRequest(result.Message);

            return Ok(new { result.Message });
        }
        [HttpPost("update-starter-limits")]
        public async Task<IActionResult> UpdateStarterLimits([FromBody] UpdateStarterLimitsDto dto)
        {
            var result = await _teamService.UpdateStarterLimitsAsync(dto);
            if (!result.Success)
                return BadRequest(result.Message);

            return Ok(new { result.Message });
        }

    }
}
