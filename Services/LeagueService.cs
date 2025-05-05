using FantasyBasketball.Data;
using FantasyBasketball.Dtos;
using Microsoft.EntityFrameworkCore;
using FantasyBasketball.Models;
using FantasyBasketball.DTOs;

namespace FantasyBasketball.Services
{
    public class LeagueService : ILeagueService
    {
        private readonly AppDbContext _context;

        public LeagueService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<(bool Success, string Message, object Result)> CreateLeagueAsync(CreateLeagueDto dto)
        {
            if (dto == null)
                return (false, "Request is null.", null);

            if (string.IsNullOrWhiteSpace(dto.Name))
                return (false, "League name is required.", null);

            if (dto.CommissionerId <= 0)
                return (false, "Invalid commissioner ID.", null);

            var commissionerExists = await _context.Users.AnyAsync(u => u.Id == dto.CommissionerId);
            if (!commissionerExists)
                return (false, "Commissioner not found.", null);

            var duplicate = await _context.Leagues
                .AnyAsync(l => l.Name == dto.Name && l.CommissionerId == dto.CommissionerId);

            if (duplicate)
                return (false, "A league with this name already exists for this commissioner.", null);

            var league = new League
            {
                Name = dto.Name,
                Description = dto.Description,
                Password = dto.Password,
                DraftDateTime = dto.DraftDateTime,
                CommissionerId = dto.CommissionerId,
                Visibility = dto.Visibility,
                GuardLimit = dto.GuardLimit,
                ForwardLimit = dto.ForwardLimit,
                CenterLimit = dto.CenterLimit
            };

            _context.Leagues.Add(league);
            await _context.SaveChangesAsync();

            return (true, "League created successfully.", new { league.Id, league.Name });
        }


        public async Task<(bool Success, string Message, object Result)> JoinLeagueAsync(JoinLeagueDto dto, int userId)
        {
            var league = await _context.Leagues
                .Include(l => l.Teams)
                .FirstOrDefaultAsync(l => l.Name == dto.LeagueName && l.Password == dto.Password);

            if (league == null)
                return (false, "Invalid league name or password.", null);

            if (league.Drafted)
                return (false, "Draft already started. Cannot join.", null);

            if (league.Teams.Any(t => t.UserId == userId))
                return (false, "You already have a team in this league.", null);

            var team = new Team
            {
                Name = dto.TeamName,
                UserId = userId,
                LeagueId = league.Id
            };

            _context.Teams.Add(team);
            await _context.SaveChangesAsync();

            return (true, "Joined league successfully.", new { team.Id, team.Name, leagueId = league.Id });
        }

        public async Task<(bool Success, string Message, object Result)> VerifyLeagueCodeAsync(VerifyLeagueCodeDto dto)
        {
            var league = await _context.Leagues.FirstOrDefaultAsync(l => l.Password == dto.Password);

            if (league == null)
                return (false, "Invalid league code.", null);

            return (true, "League verified.", new { league.Id, league.Name });
        }

        public async Task<object> GetTeamsInLeagueAsync(int leagueId)
        {
            var league = await _context.Leagues
                .Include(l => l.Teams)
                    .ThenInclude(t => t.TeamPlayers)
                        .ThenInclude(tp => tp.Player)
                .Include(l => l.Teams)
                    .ThenInclude(t => t.User)
                .FirstOrDefaultAsync(l => l.Id == leagueId);

            if (league == null)
                return null;

            return new
            {
                leagueId = league.Id,
                leagueName = league.Name,
                draftDateTime = league.DraftDateTime,
                teams = league.Teams.Select(t => new
                {
                    t.Id,
                    t.Name,
                    t.TotalPoints,
                    UserName = t.User.Username,
                    t.StarterG,
                    t.StarterF,
                    t.StarterC,
                    teamPlayers = t.TeamPlayers.Select(tp => new
                    {
                        tp.Player.Id,
                        tp.Player.FirstName,
                        tp.Player.LastName,
                        tp.Player.Team,
                        tp.Player.Position,
                        tp.Player.Price,
                    }).ToList()
                }).ToList()
            };
        }


        public async Task<object> GetLeagueByIdAsync(int id)
        {
            var league = await _context.Leagues
                .Include(l => l.Commissioner)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (league == null)
                return null;

            return new
            {
                league.Id,
                league.Name,
                league.Description,
                league.Visibility,
                league.DraftDateTime,
                league.Drafted,
                league.GuardLimit,
                league.ForwardLimit,
                league.CenterLimit,
                Commissioner = new
                {
                    league.Commissioner.Id,
                    league.Commissioner.Username,
                    league.Commissioner.Email
                }
            };
        }

        public async Task<object> GetDraftPicksByLeagueAsync(int leagueId)
        {
            var picks = await _context.DraftPicks
                .Where(dp => dp.LeagueId == leagueId)
                .OrderBy(dp => dp.PickNumber)
                .Include(dp => dp.Player)
                .Include(dp => dp.Team)
                .Select(dp => new
                {
                    dp.PickNumber,
                    dp.TeamId,
                    TeamName = dp.Team.Name,
                    dp.PlayerId,
                    PlayerFirstName = dp.Player.FirstName,
                    PlayerLastName = dp.Player.LastName,
                    PlayerPosition = dp.Player.Position,
                    PlayerTeam = dp.Player.Team,
                    dp.TimePicked
                })
                .ToListAsync();

            return picks;
        }
        public async Task<(bool Success, string Message)> EditLeagueLimitsAsync(EditLeagueLimitsDto dto)
        {
            var league = await _context.Leagues.FirstOrDefaultAsync(l => l.Id == dto.LeagueId);

            if (league == null)
                return (false, "League not found.");

            if (league.Drafted)
                return (false, "Cannot change limits after draft has started.");

            if (dto.GuardLimit < 0 || dto.ForwardLimit < 0 || dto.CenterLimit < 0)
                return (false, "Position limits must be non-negative.");

            league.GuardLimit = dto.GuardLimit;
            league.ForwardLimit = dto.ForwardLimit;
            league.CenterLimit = dto.CenterLimit;

            await _context.SaveChangesAsync();

            return (true, "League limits updated successfully.");
        }
        public async Task<(bool Success, string Message)> DeleteLeagueByIdAsync(int leagueId, int userId)
        {
            var league = await _context.Leagues
                .Include(l => l.Teams)
                .FirstOrDefaultAsync(l => l.Id == leagueId);

            if (league == null)
                return (false, "League not found.");

            if (league.CommissionerId != userId)
                return (false, "Only the commissioner can delete this league.");

            _context.Leagues.Remove(league);

            await _context.SaveChangesAsync();
            return (true, "League deleted successfully.");
        }
        public async Task<IEnumerable<object>> GetAllLeaguesAsync()
        {
            var leagues = await _context.Leagues
                .Include(l => l.Commissioner)
                .OrderByDescending(l => l.DraftDateTime)
                .ToListAsync();

            return leagues.Select(l => new
            {
                l.Id,
                l.Name,
                l.Description,
                l.Visibility,
                l.DraftDateTime,
                l.GuardLimit,
                l.ForwardLimit,
                l.CenterLimit,
                l.Drafted,
                Commissioner = new
                {
                    l.Commissioner.Id,
                    l.Commissioner.Username
                }
            });
        }

    }
}
