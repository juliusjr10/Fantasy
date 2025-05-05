using FantasyBasketball.Dtos;
using FantasyBasketball.DTOs;
using FantasyBasketball.Models;

namespace FantasyBasketball.Services
{
    public interface ILeagueService
    {
        Task<(bool Success, string Message, object Result)> CreateLeagueAsync(CreateLeagueDto dto);
        Task<(bool Success, string Message, object Result)> JoinLeagueAsync(JoinLeagueDto dto, int userId);
        Task<(bool Success, string Message, object Result)> VerifyLeagueCodeAsync(VerifyLeagueCodeDto dto);
        Task<object> GetTeamsInLeagueAsync(int leagueId);
        Task<object> GetLeagueByIdAsync(int id);
        Task<object> GetDraftPicksByLeagueAsync(int leagueId);
        Task<(bool Success, string Message)> EditLeagueLimitsAsync(EditLeagueLimitsDto dto);
        Task<(bool Success, string Message)> DeleteLeagueByIdAsync(int leagueId, int userId);
        Task<IEnumerable<object>> GetAllLeaguesAsync();

    }
}
