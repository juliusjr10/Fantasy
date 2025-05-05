using FantasyBasketball.Dtos;
using FantasyBasketball.Models;

namespace FantasyBasketball.Services
{
    public interface IPlayerService
    {
        Task<IEnumerable<Player>> GetPlayersAsync();
        Task<Player> GetPlayerByIdAsync(int id);
        Task<IEnumerable<Player>> GetPlayersByTeamAsync(string teamName);
        Task<IEnumerable<Player>> GetFreeAgentsInLeagueAsync(int leagueId);
        Task<IEnumerable<Player>> GetPlayersByPositionAsync(string position);
        Task<IEnumerable<PlayerStat>> GetStatsByPlayerIdAsync(int id);
        Task<PlayerStatAveragesDto> GetPlayerAveragesAsync(int id);
        Task<bool> UpdatePlayerAsync(int id, PlayerUpdateDto dto);
        Task<bool> DeletePlayerAsync(int id);
        Task<string> CalculateFantasyPointsForAllStatsAsync();
        Task<IEnumerable<PlayerStat>> GetPlayerStatsByGameAsync(int gameId);
        Task<string> UpdatePlayerPricesAsync();
    }
}
