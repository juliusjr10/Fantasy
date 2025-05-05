using FantasyBasketball.Data;
using FantasyBasketball.DTOs;
using FantasyBasketball.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FantasyBasketball.Hubs
{
    [Authorize]
    public class DraftHub : Hub
    {
        private readonly AppDbContext _context;
        private readonly IDbContextFactory<AppDbContext> _contextFactory;
        private readonly IHubContext<DraftHub> _hubContext;

        public DraftHub(AppDbContext context, IDbContextFactory<AppDbContext> contextFactory, IHubContext<DraftHub> hubContext)
        {
            _context = context;
            _contextFactory = contextFactory;
            _hubContext = hubContext;
        }

        private static readonly Dictionary<string, SemaphoreSlim> _leagueLocks = new();
        private static readonly Dictionary<string, HashSet<string>> _groupMembers = new();
        private static readonly Dictionary<string, List<PickDto>> _draftState = new();
        private static readonly Dictionary<string, bool> _draftStarted = new();
        private static readonly Dictionary<string, DateTime> _pickStartTimes = new();
        private static readonly Dictionary<string, CancellationTokenSource> _autoPickCancellations = new();
        private readonly TimeSpan _pickDuration = TimeSpan.FromSeconds(60);

        private static SemaphoreSlim GetLeagueLock(string leagueId)
        {
            lock (_leagueLocks)
            {
                if (!_leagueLocks.ContainsKey(leagueId))
                    _leagueLocks[leagueId] = new SemaphoreSlim(1, 1);

                return _leagueLocks[leagueId];
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            foreach (var groupId in _groupMembers.Keys)
            {
                _groupMembers[groupId].Remove(Context.ConnectionId);
            }

            await base.OnDisconnectedAsync(exception);
        }

        public async Task JoinLeague(string leagueId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, leagueId);

            if (!_groupMembers.ContainsKey(leagueId))
                _groupMembers[leagueId] = new HashSet<string>();

            if (_groupMembers[leagueId].Add(Context.ConnectionId))
            {
                Console.WriteLine($"User joined league group: {leagueId}");
            }
        }

        public async Task LeaveLeague(string leagueId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, leagueId);
            Console.WriteLine($"User left league group: {leagueId}");
        }
        private async Task<Dictionary<string, int>> GetPositionLimitsForLeague(string leagueId)
        {
            using var context = _contextFactory.CreateDbContext();

            var league = await context.Leagues.FirstOrDefaultAsync(l => l.Id == int.Parse(leagueId));
            if (league == null) return new Dictionary<string, int>();

            return new Dictionary<string, int>
           {
                { "G", league.GuardLimit },
                { "F", league.ForwardLimit },
                { "C", league.CenterLimit }
           };
        }

        public async Task StartDraft(string leagueId)
        {
            Console.WriteLine($"Draft started in league {leagueId}");
            _draftStarted[leagueId] = true;
            _draftState[leagueId] = new List<PickDto>();
            _pickStartTimes[leagueId] = DateTime.UtcNow;
            await Clients.Group(leagueId).SendAsync("DraftStarted", DateTime.UtcNow);

            var allTeams = await _context.Teams
                .Where(t => t.LeagueId == int.Parse(leagueId))
                .OrderBy(t => t.Id)
                .ToListAsync();

            if (allTeams.Any())
            {
                var firstTeam = allTeams.First();
                ScheduleAutoPick(leagueId, firstTeam.Id, nextPickNumber: 1);
                Console.WriteLine($"🟢 Scheduled first auto-pick for Team {firstTeam.Id}");
            }
        }


        public async Task MakePick(string leagueId, PickDto pick, bool isAutoPick = false)
        {
            var semaphore = GetLeagueLock(leagueId);
            await semaphore.WaitAsync();

            try
            {
                Console.WriteLine($"Received pick: TeamId={pick.TeamId}, PlayerId={pick.PlayerId}, PickNumber={pick.PickNumber}");

                Team? team;

                if (!isAutoPick)
                {
                    var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                              ?? Context.User?.FindFirst("id")?.Value;

                    if (!int.TryParse(userId, out var parsedUserId))
                    {
                        Console.WriteLine("Error: Could not parse userId from claims.");
                        return;
                    }

                    team = await _context.Teams
                        .Include(t => t.TeamPlayers)
                        .FirstOrDefaultAsync(t => t.Id == pick.TeamId);

                    if (team == null)
                    {
                        Console.WriteLine("Error: Team not found.");
                        return;
                    }

                    if (team.UserId != parsedUserId)
                    {
                        Console.WriteLine($"Error: User {parsedUserId} does not own team {pick.TeamId} (owned by {team.UserId}).");
                        return;
                    }
                }
                else
                {
                    team = await _context.Teams
                        .Include(t => t.TeamPlayers)
                        .FirstOrDefaultAsync(t => t.Id == pick.TeamId);

                    if (team == null)
                    {
                        Console.WriteLine("Error: AutoPick - Team not found.");
                        return;
                    }
                }

                var player = await _context.Players.FindAsync(pick.PlayerId);
                if (player == null)
                {
                    Console.WriteLine("Error: Player not found.");
                    return;
                }

                var alreadyPicked = await _context.DraftPicks
                    .AnyAsync(dp => dp.LeagueId == int.Parse(leagueId) && dp.PlayerId == pick.PlayerId);

                if (alreadyPicked)
                {
                    Console.WriteLine("Error: Player already picked.");
                    return;
                }

                team.TeamPlayers.Add(new TeamPlayer
                {
                    TeamId = team.Id,
                    PlayerId = player.Id,
                    Role = PlayerRole.Bench
                });


                _context.DraftPicks.Add(new DraftPick
                {
                    LeagueId = int.Parse(leagueId),
                    TeamId = team.Id,
                    PlayerId = player.Id,
                    PickNumber = pick.PickNumber,
                    TimePicked = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();

                if (!_draftState.ContainsKey(leagueId))
                    _draftState[leagueId] = new List<PickDto>();

                _draftState[leagueId].Add(pick);

                Console.WriteLine("✅ Player saved & draft pick recorded.");
                await Clients.Group(leagueId).SendAsync("PlayerPicked", pick);
                _pickStartTimes[leagueId] = DateTime.UtcNow;

                var allTeams = await _context.Teams
                    .Where(t => t.LeagueId == int.Parse(leagueId))
                    .OrderBy(t => t.Id)
                    .ToListAsync();

                int totalTeams = allTeams.Count;

                if (totalTeams > 0)
                {
                    int nextPickNumber = pick.PickNumber + 1;
                    int round = (nextPickNumber - 1) / totalTeams;
                    int indexInRound = (nextPickNumber - 1) % totalTeams;
                    int nextIndex = round % 2 == 0 ? indexInRound : totalTeams - 1 - indexInRound;

                    if (nextIndex < allTeams.Count)
                    {
                        var nextTeam = allTeams[nextIndex];
                        ScheduleAutoPick(leagueId, nextTeam.Id, nextPickNumber);
                    }
                }

                var league = await _context.Leagues
                    .Include(l => l.Teams)
                    .ThenInclude(t => t.TeamPlayers)
                    .FirstOrDefaultAsync(l => l.Id == int.Parse(leagueId));

                if (league != null)
                {
                    bool allTeamsFull = league.Teams.All(t => t.TeamPlayers.Count >= 12);
                    if (allTeamsFull)
                    {
                        await EndDraft(leagueId);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error in MakePick: {ex.Message}");
            }
            finally
            {
                semaphore.Release();
            }
        }

        public async Task SyncDraft(string leagueId)
        {
            var picks = await _context.DraftPicks
                .Where(p => p.LeagueId == int.Parse(leagueId))
                .OrderBy(p => p.PickNumber)
                .Select(p => new PickDto
                {
                    PickNumber = p.PickNumber,
                    PlayerId = p.PlayerId,
                    TeamId = p.TeamId
                })
                .ToListAsync();

            var started = _draftStarted.TryGetValue(leagueId, out var active) && active;
            int timeLeft = 60;

            if (_pickStartTimes.TryGetValue(leagueId, out var pickStart))
            {
                var elapsed = (int)(DateTime.UtcNow - pickStart).TotalSeconds;
                timeLeft = Math.Max(0, 60 - elapsed);
            }

            await Clients.Caller.SendAsync("SyncDraft", new
            {
                DraftStarted = started,
                Picks = picks,
                TimeLeft = timeLeft
            });
        }

        private async void ScheduleAutoPick(string leagueId, int nextTeamId, int nextPickNumber)
        {
            if (_autoPickCancellations.ContainsKey(leagueId))
                _autoPickCancellations[leagueId].Cancel();

            var cts = new CancellationTokenSource();
            _autoPickCancellations[leagueId] = cts;

            _ = Task.Run(async () =>
            {
                try
                {
                    await Task.Delay(_pickDuration, cts.Token);
                    if (cts.Token.IsCancellationRequested) return;

                    using var context = _contextFactory.CreateDbContext();

                    var allAvailablePlayers = await context.Players
                        .Where(p => !context.DraftPicks.Any(dp => dp.LeagueId == int.Parse(leagueId) && dp.PlayerId == p.Id))
                        .ToListAsync();

                    var team = await context.Teams
                        .Include(t => t.TeamPlayers)
                        .FirstOrDefaultAsync(t => t.Id == nextTeamId);

                    if (team == null) return;

                    var teamRoster = await context.Players
                        .Where(p => team.TeamPlayers.Select(tp => tp.PlayerId).Contains(p.Id))
                        .ToListAsync();

                    var positionCounts = teamRoster
                        .GroupBy(p => p.Position)
                        .ToDictionary(g => g.Key, g => g.Count());

                    var positionLimits = await GetPositionLimitsForLeague(leagueId);

                    var eligiblePlayers = allAvailablePlayers.Where(p =>
                    {
                        if (!positionLimits.TryGetValue(p.Position, out var limit)) return true;
                        positionCounts.TryGetValue(p.Position, out int current);
                        return current < limit;
                    }).ToList();

                    if (eligiblePlayers.Any())
                    {
                        var random = new Random();
                        var randomPlayer = eligiblePlayers[random.Next(eligiblePlayers.Count)];

                        var pick = new PickDto
                        {
                            TeamId = nextTeamId,
                            PlayerId = randomPlayer.Id,
                            PickNumber = nextPickNumber
                        };

                        await MakePickWithContext(context, leagueId, pick);
                        Console.WriteLine($"✅ Auto-picked player {randomPlayer.Id} for team {nextTeamId}");
                    }
                    else
                    {
                        Console.WriteLine($"⚠️ No eligible players left for auto-pick for team {nextTeamId} (position limits reached).");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ Error in auto-pick task: {ex}");
                }
            });
        }



        public async Task MakePickWithContext(AppDbContext context, string leagueId, PickDto pick)
        {
            var team = await context.Teams.Include(t => t.TeamPlayers).FirstOrDefaultAsync(t => t.Id == pick.TeamId);
            if (team == null) return;

            var player = await context.Players.FindAsync(pick.PlayerId);
            if (player == null) return;

            var alreadyPicked = await context.DraftPicks
                .AnyAsync(dp => dp.LeagueId == int.Parse(leagueId) && dp.PlayerId == player.Id);
            if (alreadyPicked) return;

            team.TeamPlayers.Add(new TeamPlayer
            {
                TeamId = team.Id,
                PlayerId = player.Id,
                Role = PlayerRole.Bench
            });

            context.DraftPicks.Add(new DraftPick
            {
                LeagueId = int.Parse(leagueId),
                TeamId = team.Id,
                PlayerId = player.Id,
                PickNumber = pick.PickNumber,
                TimePicked = DateTime.UtcNow
            });

            await context.SaveChangesAsync();

            await _hubContext.Clients.Group(leagueId).SendAsync("PlayerPicked", pick);
            _pickStartTimes[leagueId] = DateTime.UtcNow;



            var allTeams = await context.Teams
                .Where(t => t.LeagueId == int.Parse(leagueId))
                .OrderBy(t => t.Id)
                .ToListAsync();

            int totalTeams = allTeams.Count;
            if (totalTeams > 0)
            {
                int nextPickNumber = pick.PickNumber + 1;
                int round = (nextPickNumber - 1) / totalTeams;
                int indexInRound = (nextPickNumber - 1) % totalTeams;
                int nextIndex = round % 2 == 0 ? indexInRound : totalTeams - 1 - indexInRound;

                if (nextIndex < allTeams.Count)
                {
                    var nextTeam = allTeams[nextIndex];
                    ScheduleAutoPick(leagueId, nextTeam.Id, nextPickNumber);
                }
            }

            var league = await context.Leagues
                .Include(l => l.Teams)
                .ThenInclude(t => t.TeamPlayers)
                .FirstOrDefaultAsync(l => l.Id == int.Parse(leagueId));

            if (league != null && league.Teams.All(t => t.TeamPlayers.Count >= 12))
            {
                league.Drafted = true;
                await context.SaveChangesAsync();
                await _hubContext.Clients.Group(leagueId).SendAsync("DraftEnded");
            }
        }
        public async Task EndDraft(string leagueId)
        {
            var league = await _context.Leagues.FirstOrDefaultAsync(l => l.Id == int.Parse(leagueId));
            if (league != null)
            {
                league.Drafted = true;
                await _context.SaveChangesAsync();
            }

            Console.WriteLine($"Draft ended in league {leagueId}");
            _draftStarted[leagueId] = false;

            if (_autoPickCancellations.TryGetValue(leagueId, out var cts))
            {
                cts.Cancel();
                _autoPickCancellations.Remove(leagueId);
            }

            await Clients.Group(leagueId).SendAsync("DraftEnded");
        }
    }
}
