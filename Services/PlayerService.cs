using FantasyBasketball.Data;
using FantasyBasketball.Dtos;
using FantasyBasketball.Models;
using Microsoft.EntityFrameworkCore;

namespace FantasyBasketball.Services
{
    public class PlayerService : IPlayerService
    {
        private readonly AppDbContext _context;

        public PlayerService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Player>> GetPlayersAsync()
        {
            return await _context.Players.ToListAsync();
        }

        public async Task<Player> GetPlayerByIdAsync(int id)
        {
            return await _context.Players.FindAsync(id);
        }

        public async Task<IEnumerable<Player>> GetPlayersByTeamAsync(string teamName)
        {
            return await _context.Players
                .Where(p => p.Team.ToLower().Contains(teamName.ToLower()))
                .ToListAsync();
        }

        public async Task<IEnumerable<Player>> GetFreeAgentsInLeagueAsync(int leagueId)
        {
            var takenPlayerIds = await _context.TeamPlayers
                .Where(tp => tp.Team.LeagueId == leagueId)
                .Select(tp => tp.PlayerId)
                .Distinct()
                .ToListAsync();

            return await _context.Players
                .Where(p => !takenPlayerIds.Contains(p.Id))
                .ToListAsync();
        }

        public async Task<IEnumerable<Player>> GetPlayersByPositionAsync(string position)
        {
            return await _context.Players
                .Where(p => p.Position.ToLower().Contains(position.ToLower()))
                .ToListAsync();
        }

        public async Task<IEnumerable<PlayerStat>> GetStatsByPlayerIdAsync(int id)
        {
            var stats = await _context.PlayerStats
                .Where(s => s.PlayerId == id && s.Game.Calculated)
                .ToListAsync();

            if (stats == null || stats.Count == 0)
            {
                return new List<PlayerStat>
                {
            new PlayerStat
            {
                PlayerId = id,
                Points = 0,
                Rebounds = 0,
                Assists = 0,
                Steals = 0,
                Blocks = 0,
                Turnovers = 0,
                Fouls = 0,
                MinutesPlayed = 0,
                FGA = 0,
                FGM = 0,
                FTA = 0,
                FTM = 0,
                FantasyPoints = 0,
            }
                };
            }

            return stats;
        }


        public async Task<PlayerStatAveragesDto> GetPlayerAveragesAsync(int id)
        {
            var stats = await _context.PlayerStats
                .Where(s => s.PlayerId == id && s.Game.Calculated)
                .ToListAsync();

            if (!stats.Any())
            {
                return new PlayerStatAveragesDto();
            }

            return new PlayerStatAveragesDto
            {
                Points = stats.Average(s => s.Points),
                Rebounds = stats.Average(s => s.Rebounds),
                Assists = stats.Average(s => s.Assists),
                Steals = stats.Average(s => s.Steals),
                Blocks = stats.Average(s => s.Blocks),
                Turnovers = stats.Average(s => s.Turnovers),
                Fouls = stats.Average(s => s.Fouls),
                Minutes = stats.Average(s => s.MinutesPlayed),
                FieldGoalPercentage = stats.Sum(s => s.FGA) > 0
                    ? (double)stats.Sum(s => s.FGM) / stats.Sum(s => s.FGA) * 100
                    : 0,
                FreeThrowPercentage = stats.Sum(s => s.FTA) > 0
                    ? (double)stats.Sum(s => s.FTM) / stats.Sum(s => s.FTA) * 100
                    : 0,
                FantasyPoints = stats.Average(s => s.FantasyPoints)
            };
        }

        public async Task<bool> UpdatePlayerAsync(int id, PlayerUpdateDto dto)
        {
            var player = await _context.Players.FindAsync(id);
            if (player == null)
                return false;

            player.FirstName = dto.FirstName;
            player.LastName = dto.LastName;
            player.Team = dto.Team;
            player.Position = dto.Position;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeletePlayerAsync(int id)
        {
            var player = await _context.Players.FindAsync(id);
            if (player == null)
                return false;

            _context.Players.Remove(player);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<string> CalculateFantasyPointsForAllStatsAsync()
        {
            var stats = await _context.PlayerStats.ToListAsync();

            foreach (var stat in stats)
            {
                int countDoubleDouble = 0;

                if (stat.Points >= 10) countDoubleDouble++;
                if (stat.Rebounds >= 10) countDoubleDouble++;
                if (stat.Assists >= 10) countDoubleDouble++;
                if (stat.Blocks >= 10) countDoubleDouble++;
                if (stat.Steals >= 10) countDoubleDouble++;

                bool isDoubleDouble = countDoubleDouble >= 2;
                bool isTripleDouble = countDoubleDouble >= 3;

                double fantasyPoints =
                    stat.Points * 1.15 +
                    stat.Rebounds * 1.2 +
                    stat.Assists * 1.5 +
                    stat.Blocks * 2.0 +
                    stat.Steals * 2.0 +
                    stat.Turnovers * -1.0 +
                    (stat.FGA - stat.FGM) * -1.0 +
                    (stat.FTA - stat.FTM) * -1.0 +
                    stat.Fouls * -1.0;

                if (isTripleDouble)
                    fantasyPoints += 30;
                else if (isDoubleDouble)
                    fantasyPoints += 10;

                stat.FantasyPoints = fantasyPoints;
            }

            await _context.SaveChangesAsync();
            return "Fantasy points calculated and updated for all stat lines.";
        }

        public async Task<IEnumerable<PlayerStat>> GetPlayerStatsByGameAsync(int gameId)
        {
            return await _context.PlayerStats
                .Include(s => s.Player)
                .Where(s => s.GameId == gameId)
                .ToListAsync();
        }

        public async Task<string> UpdatePlayerPricesAsync()
        {
            var players = await _context.Players.ToListAsync();
            double maxFpts = 70;

            foreach (var player in players)
            {
                var stats = await _context.PlayerStats
                    .Where(s => s.PlayerId == player.Id && s.Game.Calculated)
                    .ToListAsync();

                double avgFpts = stats.Any()
                    ? stats.Average(s => s.FantasyPoints)
                    : 0;

                double normalized = (avgFpts / maxFpts) * 100;
                normalized = Math.Round(Math.Max(0, Math.Min(100, normalized)), 2);

                player.Price = normalized;
            }

            await _context.SaveChangesAsync();
            return "Player prices updated successfully.";
        }
    }
}
