using FantasyBasketball.DTOs;
using FantasyBasketball.Models;

namespace FantasyBasketball.Services
{
    public interface ITradeService
    {
        Task<(bool Success, string Message, object Result)> CreateTradeAsync(CreateTradeDTO dto);
        Task<IEnumerable<Trade>> GetTradesByTeamIdAsync(int teamId);
        Task<(bool Success, string Message)> CancelTradeAsync(int tradeId);
        Task<(bool Success, string Message)> AcceptTradeAsync(int tradeId);
        Task<(bool Success, string Message)> DeclineTradeAsync(int tradeId);
    }
}
