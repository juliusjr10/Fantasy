using FantasyBasketball.DTOs;
using FantasyBasketball.Models;

namespace FantasyBasketball.Services
{
    public interface IGameService
    {
        Task<string> MarkGamesAsCalculated(DateTime startDate, DateTime endDate);
        Task<string> UnmarkGamesAsCalculated(DateTime startDate, DateTime endDate);
        Task<List<Game>> GetGamesByPlayerId(int playerId);
        Task<List<Game>> GetCalculatedGames();
        Task<List<object>> GetGamesByDate(DateTime startDate, DateTime? endDate = null);
        Task<GameDataDto> GetGameData(int gameId);

    }
}
