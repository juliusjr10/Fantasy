using System.Text.Json;
using FantasyBasketball.Data;
using FantasyBasketball.Models;
using Microsoft.EntityFrameworkCore;

namespace FantasyBasketball.Services
{
    public class ImportService
    {
        private readonly AppDbContext _context;
        private readonly HttpClient _http;
        private const string ApiKey = "90be27c313msh18bf2336c873576p19bbf5jsnd7e51b156820";
        private const string ApiHost = "api-nba-v1.p.rapidapi.com";
        private Dictionary<int, string> _nbaTeams = new();

        public ImportService(AppDbContext context)
        {
            _context = context;
            _http = new HttpClient();
            _http.DefaultRequestHeaders.Add("x-rapidapi-key", ApiKey);
            _http.DefaultRequestHeaders.Add("x-rapidapi-host", ApiHost);
        }

        public async Task ImportPlayersAsync()
        {
            await LoadNbaTeamsAsync();

            var existingPlayers = await _context.Players
                .Select(p => new
                {
                    FirstName = p.FirstName.Trim().ToLower(),
                    LastName = p.LastName.Trim().ToLower()
                })
                .ToListAsync();

            foreach (var team in _nbaTeams)
            {
                int teamId = team.Key;
                string teamName = team.Value;

                var players = await GetPlayersByTeamAsync(teamId, teamName);

                foreach (var player in players)
                {
                    string firstName = player.FirstName?.Trim().ToLower() ?? "";
                    string lastName = player.LastName?.Trim().ToLower() ?? "";

                    bool exists = existingPlayers.Any(p =>
                        p.FirstName == firstName &&
                        p.LastName == lastName);

                    if (!exists)
                    {
                        player.FirstName = player.FirstName?.Trim();
                        player.LastName = player.LastName?.Trim();
                        _context.Players.Add(player);
                        existingPlayers.Add(new
                        {
                            FirstName = firstName,
                            LastName = lastName
                        });
                    }
                }
            }

            await _context.SaveChangesAsync();
        }



        private async Task LoadNbaTeamsAsync()
        {
            var response = await _http.GetAsync("https://api-nba-v1.p.rapidapi.com/teams");
            var content = await response.Content.ReadAsStringAsync();

            using var json = JsonDocument.Parse(content);
            var root = json.RootElement.GetProperty("response");

            foreach (var team in root.EnumerateArray())
            {
                if (team.TryGetProperty("nbaFranchise", out var nbaFlag) && nbaFlag.GetBoolean())
                {
                    if (team.TryGetProperty("id", out var idProp) &&
                        team.TryGetProperty("name", out var nameProp))
                    {
                        int teamId = idProp.GetInt32();
                        string teamName = nameProp.GetString() ?? $"Team {teamId}";

                        if (!_nbaTeams.ContainsKey(teamId))
                        {
                            _nbaTeams[teamId] = teamName;
                        }
                    }
                }
            }
        }


        private async Task<List<Player>> GetPlayersByTeamAsync(int teamId, string teamName)
        {
            var players = new List<Player>();

            try
            {
                var response = await _http.GetAsync($"https://api-nba-v1.p.rapidapi.com/players?team={teamId}&season=2024");
                var content = await response.Content.ReadAsStringAsync();

                using var json = JsonDocument.Parse(content);
                var root = json.RootElement.GetProperty("response");

                foreach (var item in root.EnumerateArray())
                {
                    try
                    {
                        if (!item.TryGetProperty("leagues", out var leagues)) continue;
                        if (!leagues.TryGetProperty("standard", out var standard)) continue;
                        if (standard.TryGetProperty("active", out var activeProp) && !activeProp.GetBoolean())
                            continue;

                        string firstName = item.TryGetProperty("firstname", out var fn) ? fn.GetString() ?? "" : "";
                        string lastName = item.TryGetProperty("lastname", out var ln) ? ln.GetString() ?? "" : "";
                        string position = standard.TryGetProperty("pos", out var pos) ? pos.GetString() ?? "" : "";

                        int apiId = item.TryGetProperty("id", out var idProp) && int.TryParse(idProp.GetRawText(), out var idVal)
                            ? idVal
                            : 0;

                        if (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName) || apiId == 0)
                            continue;

                        var player = new Player
                        {
                            Id = apiId,
                            FirstName = firstName,
                            LastName = lastName,
                            Position = position,
                            Team = teamName
                        };

                        players.Add(player);
                    }
                    catch (Exception innerEx)
                    {
                        Console.WriteLine($"Skipped player (parse error): {innerEx.Message}");
                        continue;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching players for team {teamId}: {ex.Message}");
            }

            return players;
        }

        public async Task ImportPlayerStatsAsync()
        {
            var preseasonGameIds = await FetchPreseasonGameIdsAsync();
            var postseasonGameIds = await FetchPostseasonGameIdsAsync();
            var players = await _context.Players.ToListAsync();

            foreach (var player in players)
            {
                try
                {
                    var response = await _http.GetAsync($"https://api-nba-v1.p.rapidapi.com/players/statistics?id={player.Id}&season=2024");
                    var content = await response.Content.ReadAsStringAsync();

                    using var json = JsonDocument.Parse(content);
                    var root = json.RootElement.GetProperty("response");

                    foreach (var game in root.EnumerateArray())
                    {
                        try
                        {
                            int gameId = game.TryGetProperty("game", out var gameObj) &&
                                         gameObj.TryGetProperty("id", out var gameIdProp)
                                         ? gameIdProp.GetInt32()
                                         : 0;

                            if (gameId == 0) continue;

                            if (preseasonGameIds.Contains(gameId)) continue;
                            if (postseasonGameIds.Contains(gameId)) continue;
                            bool statExists = await _context.PlayerStats.AnyAsync(s =>
                                s.PlayerId == player.Id && s.GameId == gameId);

                            if (statExists) continue;

                            var stat = new PlayerStat
                            {
                                PlayerId = player.Id,
                                GameId = gameId,
                                Points = game.GetProperty("points").GetInt32(),
                                Rebounds = game.GetProperty("totReb").GetInt32(),
                                Assists = game.GetProperty("assists").GetInt32(),
                                Steals = game.GetProperty("steals").GetInt32(),
                                Blocks = game.GetProperty("blocks").GetInt32(),
                                Turnovers = game.GetProperty("turnovers").GetInt32(),
                                MinutesPlayed = int.TryParse(game.GetProperty("min").GetString(), out int mins) ? mins : 0,
                                FGM = game.GetProperty("fgm").GetInt32(),
                                FGA = game.GetProperty("fga").GetInt32(),
                                FTM = game.GetProperty("ftm").GetInt32(),
                                FTA = game.GetProperty("fta").GetInt32(),
                                Fouls = game.GetProperty("pFouls").GetInt32()
                            };

                            _context.PlayerStats.Add(stat);
                        }
                        catch (Exception statEx)
                        {
                            Console.WriteLine($"Error parsing stat for player {player.Id}: {statEx.Message}");
                        }
                    }

                    await _context.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to import stats for {player.FirstName} {player.LastName}: {ex.Message}");
                }
            }
        }

        public async Task<List<int>> FetchPreseasonGameIdsAsync()
        {
            var preseasonGameIds = new List<int>();
            var startDate = new DateTime(2024, 10, 4);
            var endDate = new DateTime(2024, 10, 21);

            for (var date = startDate; date <= endDate; date = date.AddDays(1))
            {
                var dateStr = date.ToString("yyyy-MM-dd");

                try
                {
                    var response = await _http.GetAsync($"https://api-nba-v1.p.rapidapi.com/games?date={dateStr}");
                    var content = await response.Content.ReadAsStringAsync();

                    using var json = JsonDocument.Parse(content);
                    var root = json.RootElement.GetProperty("response");

                    foreach (var game in root.EnumerateArray())
                    {
                        if (game.TryGetProperty("id", out var idProp) && idProp.TryGetInt32(out int gameId))
                        {
                            preseasonGameIds.Add(gameId);
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to fetch games for {dateStr}: {ex.Message}");
                }
            }

            Console.WriteLine($"Found {preseasonGameIds.Count} preseason games.");
            return preseasonGameIds;
        }
        public async Task<List<int>> FetchPostseasonGameIdsAsync()
        {
            var preseasonGameIds = new List<int>();
            var startDate = new DateTime(2025, 4, 14);
            var endDate =  DateTime.Today;

            for (var date = startDate; date <= endDate; date = date.AddDays(1))
            {
                var dateStr = date.ToString("yyyy-MM-dd");
                Console.WriteLine($"Checking games on {dateStr}...");

                try
                {
                    var response = await _http.GetAsync($"https://api-nba-v1.p.rapidapi.com/games?date={dateStr}");
                    var content = await response.Content.ReadAsStringAsync();

                    using var json = JsonDocument.Parse(content);
                    var root = json.RootElement.GetProperty("response");

                    foreach (var game in root.EnumerateArray())
                    {
                        if (game.TryGetProperty("id", out var idProp) && idProp.TryGetInt32(out int gameId))
                        {
                            preseasonGameIds.Add(gameId);
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to fetch games for {dateStr}: {ex.Message}");
                }
            }

            Console.WriteLine($"Found {preseasonGameIds.Count} preseason games.");
            return preseasonGameIds;
        }
        public async Task UpdateGamesFromApiAsync()
        {

            var response = await _http.GetAsync("https://api-nba-v1.p.rapidapi.com/games?season=2024");
            var content = await response.Content.ReadAsStringAsync();

            try
            {
                using var json = JsonDocument.Parse(content);
                var root = json.RootElement.GetProperty("response");

                Console.WriteLine($"API returned {root.GetArrayLength()} games.");

                var existingGameIds = await _context.Games.Select(g => g.Id).ToListAsync();
                Console.WriteLine($"Database contains {existingGameIds.Count} Game IDs.");

                var gamesToUpdate = new List<Game>();

                foreach (var item in root.EnumerateArray())
                {
                    try
                    {
                        if (!item.TryGetProperty("id", out var idProp) || !idProp.TryGetInt32(out int gameId))
                        {
                            Console.WriteLine("Could not parse game ID from API item.");
                            continue;
                        }

                        Console.WriteLine($"Checking Game ID: {gameId}");

                        if (!existingGameIds.Contains(gameId))
                        {
                            Console.WriteLine($"Game ID {gameId} not found in DB, skipping.");
                            continue;
                        }

                        var homeTeam = item.GetProperty("teams").GetProperty("home").GetProperty("name").GetString() ?? "";
                        var awayTeam = item.GetProperty("teams").GetProperty("visitors").GetProperty("name").GetString() ?? "";

                        var homeScore = item.GetProperty("scores").GetProperty("home").GetProperty("points").GetInt32();
                        var awayScore = item.GetProperty("scores").GetProperty("visitors").GetProperty("points").GetInt32();

                        var dateStr = item.GetProperty("date").GetProperty("start").GetString();
                        var gameDate = DateTime.TryParse(dateStr, out var parsedDate)
                            ? DateTime.SpecifyKind(parsedDate, DateTimeKind.Utc)
                            : DateTime.UtcNow;

                        var game = await _context.Games.FirstOrDefaultAsync(g => g.Id == gameId);
                        if (game != null)
                        {
                            Console.WriteLine($"Found Game ID {gameId} in DB. Updating values...");

                            game.HomeTeam = homeTeam;
                            game.AwayTeam = awayTeam;
                            game.HomeScore = homeScore;
                            game.AwayScore = awayScore;
                            game.Date = gameDate;

                            gamesToUpdate.Add(game);
                        }
                        else
                        {
                            Console.WriteLine($"Game ID {gameId} was in list but not found by EF query.");
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Failed to update a game item: {ex.Message}");
                    }
                }

                await _context.SaveChangesAsync();
                Console.WriteLine($"Done. Updated {gamesToUpdate.Count} game(s).");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error parsing game API response: {ex.Message}");
            }
        }



    }
}
