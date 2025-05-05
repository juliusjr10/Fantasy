using FantasyBasketball.DTOs.FantasyBasketball.Dtos;
using FantasyBasketball.Dtos;
using System.Security.Claims;
using FantasyBasketball.DTOs;

namespace FantasyBasketball.Services
{
    public interface ITeamService
    {
        Task<(bool Success, string Message, object Result)> CreateTeamAsync(CreateTeamDto dto);
        Task<IEnumerable<object>> GetMyTeamsAsync(ClaimsPrincipal user);
        Task<(bool Success, string Message, object Result)> AddPlayerToTeamAsync(AddPlayerToTeamDto dto);
        Task<(bool Success, string Message)> SetPlayerRoleAsync(SetPlayerRoleDto dto);
        Task<IEnumerable<object>> GetPlayersByTeamIdAsync(int teamId);
        Task<IEnumerable<object>> RecalculateTotalTeamPointsAsync(DateTime startDate, DateTime endDate);
        Task<object> GetTeamByIdAsync(int teamId);
        Task<(bool Success, string Message, object Result)> TakeFreeAgentAsync(TakePlayerDto dto);
        Task<(bool Success, string Message)> DeleteTeamAsync(int teamId, ClaimsPrincipal user);
        Task<(bool Success, string Message)> ApplyCustomBoostToTeamAsync(int teamId, int userId, int coinsToSpend);
        Task<(bool Success, string Message)> UpdateStarterLimitsAsync(UpdateStarterLimitsDto dto);
    }
}
