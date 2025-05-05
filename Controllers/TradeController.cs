using FantasyBasketball.DTOs;
using FantasyBasketball.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FantasyBasketball.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TradeController : ControllerBase
    {
        private readonly ITradeService _tradeService;

        public TradeController(ITradeService tradeService)
        {
            _tradeService = tradeService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateTrade([FromBody] CreateTradeDTO dto)
        {
            var result = await _tradeService.CreateTradeAsync(dto);
            if (!result.Success)
                return BadRequest(result.Message);

            return Ok(result.Result);
        }

        [HttpGet("team/{teamId}")]
        public async Task<IActionResult> GetTradesByTeamId(int teamId)
        {
            var trades = await _tradeService.GetTradesByTeamIdAsync(teamId);
            return Ok(trades);
        }

        [Authorize]
        [HttpPatch("{tradeId}/cancel")]
        public async Task<IActionResult> CancelTrade(int tradeId)
        {
            var result = await _tradeService.CancelTradeAsync(tradeId);
            if (!result.Success)
                return BadRequest(result.Message);

            return Ok(new { result.Message });
        }

        [HttpPatch("{tradeId}/accept")]
        public async Task<IActionResult> AcceptTrade(int tradeId)
        {
            var result = await _tradeService.AcceptTradeAsync(tradeId);
            if (!result.Success)
                return BadRequest(result.Message);

            return Ok(new { result.Message });
        }

        [Authorize]
        [HttpPatch("{tradeId}/decline")]
        public async Task<IActionResult> DeclineTrade(int tradeId)
        {
            var result = await _tradeService.DeclineTradeAsync(tradeId);
            if (!result.Success)
                return BadRequest(result.Message);

            return Ok(new { result.Message });
        }
    }
}
