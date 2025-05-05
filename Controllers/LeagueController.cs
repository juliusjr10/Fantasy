using FantasyBasketball.Services;
using FantasyBasketball.Dtos;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using FantasyBasketball.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace FantasyBasketball.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LeagueController : ControllerBase
    {
        private readonly ILeagueService _leagueService;

        public LeagueController(ILeagueService leagueService)
        {
            _leagueService = leagueService;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateLeague(CreateLeagueDto dto)
        {
            var (success, message, result) = await _leagueService.CreateLeagueAsync(dto);
            if (!success)
                return BadRequest(message);

            return Ok(result);
        }

        [Authorize]
        [HttpPost("join")]
        public async Task<IActionResult> JoinLeague([FromBody] JoinLeagueDto dto)
        {
            var userIdClaim = User.FindFirst("id") ?? User.FindFirst(ClaimTypes.NameIdentifier);

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                return Forbid("Missing or invalid user ID claim");

            var (success, message, result) = await _leagueService.JoinLeagueAsync(dto, userId);
            if (!success)
                return BadRequest(message);

            return Ok(result);
        }


        [HttpPost("verify")]
        public async Task<IActionResult> VerifyLeagueCode([FromBody] VerifyLeagueCodeDto dto)
        {
            var (success, message, result) = await _leagueService.VerifyLeagueCodeAsync(dto);
            if (!success)
                return BadRequest(message);

            return Ok(result);
        }

        [HttpGet("{leagueId}/teams")]
        public async Task<IActionResult> GetTeamsInLeague(int leagueId)
        {
            var result = await _leagueService.GetTeamsInLeagueAsync(leagueId);
            if (result == null)
                return NotFound("League not found");

            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetLeagueById(int id)
        {
            var result = await _leagueService.GetLeagueByIdAsync(id);
            if (result == null)
                return NotFound("League not found");

            return Ok(result);
        }

        [HttpGet("{leagueId}/draft-picks")]
        public async Task<IActionResult> GetDraftPicksByLeague(int leagueId)
        {
            var result = await _leagueService.GetDraftPicksByLeagueAsync(leagueId);
            return Ok(result);
        }
        [HttpPut("limits")]
        public async Task<IActionResult> EditLimits(EditLeagueLimitsDto dto)
        {
            var result = await _leagueService.EditLeagueLimitsAsync(dto);
            if (!result.Success)
                return BadRequest(result.Message);

            return Ok(result.Message);
        }
        [HttpDelete("{leagueId}")]
        public async Task<IActionResult> DeleteLeague(int leagueId)
        {
            var userIdClaim = User.FindFirst("id") ?? User.FindFirst(ClaimTypes.NameIdentifier);

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                return Forbid("Missing or invalid user ID claim");
            var result = await _leagueService.DeleteLeagueByIdAsync(leagueId, userId);

            if (!result.Success)
                return BadRequest(result.Message);

            return Ok(result.Message);
        }
        [HttpGet("all")]
        public async Task<IActionResult> GetAllLeagues()
        {
            var leagues = await _leagueService.GetAllLeaguesAsync();
            return Ok(leagues);
        }

    }
}
