using FantasyBasketball.Data;
using FantasyBasketball.DTOs.FantasyBasketball.Dtos;
using FantasyBasketball.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using FantasyBasketball.Dtos;
using FantasyBasketball.DTOs;
namespace FantasyBasketball.Services
{
    public class TeamService : ITeamService
    {
        private readonly AppDbContext _context;

        public TeamService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<(bool Success, string Message, object Result)> CreateTeamAsync(CreateTeamDto dto)
        {
            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null)
                return (false, "User not found", null);

            var league = await _context.Leagues.Include(l => l.Teams).FirstOrDefaultAsync(l => l.Id == dto.LeagueId);
            if (league == null)
                return (false, "League not found", null);

            if (league.Teams.Any(t => t.UserId == dto.UserId))
                return (false, "User already has a team in this league", null);

            var team = new Team
            {
                Name = dto.Name,
                UserId = dto.UserId,
                LeagueId = dto.LeagueId
            };

            _context.Teams.Add(team);
            await _context.SaveChangesAsync();

            return (true, "Team created successfully", new { team.Id });
        }

        public async Task<IEnumerable<object>> GetMyTeamsAsync(ClaimsPrincipal user)
        {
            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier) ?? user.FindFirst("id");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                return new List<object>();

            return await _context.Teams
                .Where(t => t.UserId == userId)
                .Select(t => new
                {
                    t.Id,
                    t.Name,
                    t.LeagueId,
                    t.Budget,
                    t.StarterG,
                    t.StarterF,
                    t.StarterC
                }).ToListAsync();
        }


        public async Task<(bool Success, string Message, object Result)> AddPlayerToTeamAsync(AddPlayerToTeamDto dto)
        {
            var team = await _context.Teams
                .Include(t => t.TeamPlayers)
                .Include(t => t.League)
                .FirstOrDefaultAsync(t => t.Id == dto.TeamId);

            if (team == null)
                return (false, "Team not found", null);

            var player = await _context.Players.FindAsync(dto.PlayerId);
            if (player == null)
                return (false, "Player not found", null);

            if (team.TeamPlayers.Any(tp => tp.PlayerId == dto.PlayerId))
                return (false, "Player already in team", null);

            if (team.LeagueId == 9999 && team.Budget < player.Price)
                return (false, "Not enough budget", null);

            if (team.LeagueId == 9999)
                team.Budget -= player.Price;

            team.TeamPlayers.Add(new TeamPlayer
            {
                TeamId = team.Id,
                PlayerId = player.Id,
                Role = PlayerRole.Bench
            });

            await _context.SaveChangesAsync();

            return (true, "Player added", new { TeamId = team.Id, PlayerId = player.Id, team.Budget });
        }

        public async Task<(bool Success, string Message)> SetPlayerRoleAsync(SetPlayerRoleDto dto)
        {
            var teamPlayer = await _context.TeamPlayers
                .FirstOrDefaultAsync(tp => tp.TeamId == dto.TeamId && tp.PlayerId == dto.PlayerId);

            if (teamPlayer == null)
                return (false, "Player not found");

            if (!Enum.TryParse<PlayerRole>(dto.Role, true, out var role))
                return (false, "Invalid role");

            teamPlayer.Role = role;
            await _context.SaveChangesAsync();

            return (true, "Role updated");
        }

        public async Task<IEnumerable<object>> GetPlayersByTeamIdAsync(int teamId)
        {
            return await _context.TeamPlayers
                .Where(tp => tp.TeamId == teamId)
                .Include(tp => tp.Player)
                .ThenInclude(p => p.Stats)
                .Select(tp => new
                {
                    tp.Player.Id,
                    tp.Player.FirstName,
                    tp.Player.LastName,
                    tp.Player.Position,
                    tp.Player.Team,
                    tp.Player.Stats,
                    tp.Player.Price,
                    Role = tp.Role.ToString()
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<object>> RecalculateTotalTeamPointsAsync(DateTime startDate, DateTime endDate)
        {
            startDate = DateTime.SpecifyKind(startDate.Date, DateTimeKind.Utc);
            endDate = DateTime.SpecifyKind(endDate.Date.AddDays(1), DateTimeKind.Utc);

            var teams = await _context.Teams
                .Include(t => t.TeamPlayers)
                    .ThenInclude(tp => tp.Player)
                        .ThenInclude(p => p.Stats)
                            .ThenInclude(s => s.Game)
                .ToListAsync();

            var results = new List<object>();

            foreach (var team in teams)
            {
                double additionalPoints = 0;

                foreach (var tp in team.TeamPlayers)
                {
                    var validStats = tp.Player.Stats
                        .Where(s => s.Game != null && s.Game.Calculated && s.Game.Date >= startDate && s.Game.Date < endDate)
                        .ToList();

                    double multiplier = tp.Role switch
                    {
                        PlayerRole.Captain => 2.0,
                        PlayerRole.Starter => 1.0,
                        PlayerRole.Bench => 0.5,
                        _ => 1.0
                    };

                    double playerPoints = validStats.Sum(s => s.FantasyPoints) * multiplier;
                    additionalPoints += playerPoints;
                }

                int roundedPoints = (int)Math.Round(additionalPoints);
                team.TotalPoints += roundedPoints;

                results.Add(new
                {
                    team.Id,
                    team.Name,
                    PointsAdded = roundedPoints,
                    team.TotalPoints
                });
            }

            await _context.SaveChangesAsync();
            return results;
        }

        public async Task<object> GetTeamByIdAsync(int teamId)
        {
            var team = await _context.Teams
                .Include(t => t.User)
                .Include(t => t.League)
                .FirstOrDefaultAsync(t => t.Id == teamId);

            if (team == null)
                return null;

            return new
            {
                team.Id,
                team.Name,
                LeagueName = team.League.Name,
                team.TotalPoints,
                team.StarterG,
                team.StarterF,
                team.StarterC
            };
        }

        public async Task<(bool Success, string Message, object Result)> TakeFreeAgentAsync(TakePlayerDto dto)
        {
            var team = await _context.Teams
                .Include(t => t.TeamPlayers)
                .FirstOrDefaultAsync(t => t.Id == dto.TeamId);

            if (team == null)
                return (false, "Team not found", null);

            var playerOut = team.TeamPlayers.FirstOrDefault(tp => tp.PlayerId == dto.PlayerOutId);
            if (playerOut == null)
                return (false, "Player to remove not found", null);

            var playerIn = await _context.Players.FindAsync(dto.PlayerInId);
            if (playerIn == null)
                return (false, "Free agent not found", null);
            if (team.LeagueId != 9999)
            {
                if (await _context.TeamPlayers.AnyAsync(tp => tp.PlayerId == dto.PlayerInId && tp.Team.LeagueId == team.LeagueId))
                    return (false, "This player is already taken in the league", null);
            }
            if (team.LeagueId == 9999)
            {
                var playerOutEntity = await _context.Players.FindAsync(dto.PlayerOutId);
                if (playerOutEntity == null)
                    return (false, "Outgoing player not found", null);

                var newBudget = team.Budget + playerOutEntity.Price - playerIn.Price;
                if (newBudget < 0)
                    return (false, "Not enough budget", null);

                team.Budget = newBudget;
            }

            _context.TeamPlayers.Remove(playerOut);
            team.TeamPlayers.Add(new TeamPlayer
            {
                TeamId = team.Id,
                PlayerId = dto.PlayerInId,
                Role = playerOut.Role
            });

            await _context.SaveChangesAsync();

            return (true, "Free agent swapped", new { team.Id, dto.PlayerOutId, dto.PlayerInId });
        }

        public async Task<(bool Success, string Message)> DeleteTeamAsync(int teamId, ClaimsPrincipal user)
        {
            var team = await _context.Teams
                .Include(t => t.TeamPlayers)
                .FirstOrDefaultAsync(t => t.Id == teamId);

            if (team == null)
                return (false, "Team not found");

            _context.Teams.Remove(team);
            await _context.SaveChangesAsync();

            return (true, "Team deleted successfully");
        }
        public async Task<(bool Success, string Message)> ApplyCustomBoostToTeamAsync(int teamId, int userId, int coinsToSpend)
        {
            if (coinsToSpend <= 0)
                return (false, "You must spend at least 1 coin");

            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return (false, "User not found");

            if (user.Coins < coinsToSpend)
                return (false, "Not enough coins");

            var team = await _context.Teams.FirstOrDefaultAsync(t => t.Id == teamId && t.UserId == userId);
            if (team == null)
                return (false, "Team not found or doesn't belong to user");

            int pointsToAdd = coinsToSpend * 2;
            if (pointsToAdd <= 0)
                return (false, "Spend at least 10 coins to get 1 point");

            user.Coins -= coinsToSpend;
            team.TotalPoints += pointsToAdd;

            await _context.SaveChangesAsync();

            return (true, $"Boost applied! +{pointsToAdd} points for {coinsToSpend} coins.");
        }
        public async Task<(bool Success, string Message)> UpdateStarterLimitsAsync(UpdateStarterLimitsDto dto)
        {
            var team = await _context.Teams.FindAsync(dto.TeamId);
            if (team == null)
                return (false, "Team not found");

            team.StarterG = dto.StarterG;
            team.StarterF = dto.StarterF;
            team.StarterC = dto.StarterC;

            await _context.SaveChangesAsync();

            return (true, "Starter limits updated");
        }

    }
}
