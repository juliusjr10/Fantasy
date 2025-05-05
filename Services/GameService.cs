using FantasyBasketball.Data;
using FantasyBasketball.Models;
using Microsoft.EntityFrameworkCore;
using FantasyBasketball.DTOs;
namespace FantasyBasketball.Services
{
    public class GameService : IGameService
    {
        private readonly AppDbContext _context;
        private readonly IQuestionService _questionService;

        public GameService(AppDbContext context, IQuestionService questionService)
        {
            _context = context;
            _questionService = questionService;
        }

        public async Task<string> MarkGamesAsCalculated(DateTime startDate, DateTime endDate)
        {
            startDate = DateTime.SpecifyKind(startDate.Date, DateTimeKind.Utc);
            endDate = DateTime.SpecifyKind(endDate.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

            var gamesToUpdate = await _context.Games
                .Where(g => g.Date >= startDate && g.Date <= endDate && !g.Calculated)
                .ToListAsync();

            if (!gamesToUpdate.Any())
                return "No games found in the given date range.";

            var gameIds = gamesToUpdate.Select(g => g.Id).ToList();

            var relatedQuestions = await _context.Questions
                .Where(q => gameIds.Contains(q.GameId))
                .ToListAsync();

            foreach (var question in relatedQuestions)
            {
                await _questionService.SetCorrectAnswerForQuestion(question);
            }

            foreach (var game in gamesToUpdate)
            {
                game.Calculated = true;
            }

            await _context.SaveChangesAsync();

            return $"{gamesToUpdate.Count} game(s) marked as calculated and {relatedQuestions.Count} question(s) updated.";
        }


        public async Task<string> UnmarkGamesAsCalculated(DateTime startDate, DateTime endDate)
        {
            startDate = DateTime.SpecifyKind(startDate.Date, DateTimeKind.Utc);
            endDate = DateTime.SpecifyKind(endDate.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

            var gamesToUpdate = await _context.Games
                .Where(g => g.Date >= startDate && g.Date <= endDate && g.Calculated)
                .ToListAsync();

            if (!gamesToUpdate.Any())
                return "No calculated games found in the given date range.";

            foreach (var game in gamesToUpdate)
                game.Calculated = false;

            await _context.SaveChangesAsync();
            return $"{gamesToUpdate.Count} game(s) marked as uncalculated.";
        }

        public async Task<List<Game>> GetGamesByPlayerId(int playerId)
        {
            return await _context.PlayerStats
                .Where(ps => ps.PlayerId == playerId)
                .Include(ps => ps.Game)
                .Select(ps => ps.Game)
                .Distinct()
                .OrderByDescending(g => g.Date)
                .ToListAsync();
        }

        public async Task<List<Game>> GetCalculatedGames()
        {
            return await _context.Games
                .Where(g => g.Calculated)
                .OrderByDescending(g => g.Date)
                .ToListAsync();
        }

        public async Task<List<object>> GetGamesByDate(DateTime startDate, DateTime? endDate = null)
        {
            var utcStart = DateTime.SpecifyKind(startDate.Date, DateTimeKind.Utc);
            var utcEnd = DateTime.SpecifyKind((endDate ?? startDate).Date.AddDays(1), DateTimeKind.Utc);

            var games = await _context.Games
                .Where(g => g.Date >= utcStart && g.Date < utcEnd)
                .OrderByDescending(g => g.Date)
                .ToListAsync();

            var result = new List<object>();

            foreach (var g in games)
            {
                dynamic obj = new System.Dynamic.ExpandoObject();
                obj.Id = g.Id;
                obj.Date = g.Date;
                obj.HomeTeam = g.HomeTeam;
                obj.AwayTeam = g.AwayTeam;
                obj.HomeScore = g.HomeScore;
                obj.AwayScore = g.AwayScore;
                obj.Calculated = g.Calculated;

                result.Add(obj);
            }

            return result;
        }


        public async Task<GameDataDto> GetGameData(int gameId)
        {
            var game = await _context.Games
                .Include(g => g.PlayerStats)
                    .ThenInclude(ps => ps.Player)
                .FirstOrDefaultAsync(g => g.Id == gameId);

            if (game == null)
                return null;

            return new GameDataDto
            {
                Id = game.Id,
                HomeTeam = game.HomeTeam,
                AwayTeam = game.AwayTeam,
                HomeScore = game.HomeScore,
                AwayScore = game.AwayScore,
                Date = game.Date,
                Players = game.PlayerStats.Select(ps => new PlayerStatDto
                {
                    PlayerId = ps.PlayerId,
                    FirstName = ps.Player.FirstName,
                    LastName = ps.Player.LastName,
                    Team = ps.Player.Team,
                    Points = ps.Points,
                    Rebounds = ps.Rebounds,
                    Assists = ps.Assists,
                    Steals = ps.Steals,
                    Blocks = ps.Blocks,
                    Turnovers = ps.Turnovers,
                    Fouls = ps.Fouls,
                    MinutesPlayed = ps.MinutesPlayed,
                    FGA = ps.FGA,
                    FGM = ps.FGM,
                    FTA = ps.FTA,
                    FTM = ps.FTM,
                    FantasyPoints = ps.FantasyPoints
                }).ToList()
            };
        }


    }
}
