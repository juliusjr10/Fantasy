/*using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using FantasyBasketball.Data;
using FantasyBasketball.Models;
using System.Collections.Generic;

namespace FantasyBasketball.Services
{
    public class DailyStatsImportService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly HttpClient _httpClient;
        private const string ApiKey = "90be27c313msh18bf2336c873576p19bbf5jsnd7e51b156820";
        private const string ApiHost = "api-nba-v1.p.rapidapi.com";

        public DailyStatsImportService(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;

            _httpClient = new HttpClient();
            _httpClient.DefaultRequestHeaders.Add("x-rapidapi-key", ApiKey);
            _httpClient.DefaultRequestHeaders.Add("x-rapidapi-host", ApiHost);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    Console.WriteLine($"{DateTime.UtcNow}] Starting ImportDailyPlayerStatsAsync...");
                    await ImportDailyPlayerStatsAsync(stoppingToken);
                    Console.WriteLine($"{DateTime.UtcNow}] Finished ImportDailyPlayerStatsAsync.");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"An exception occurred during import: {ex.Message}");
                }

                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }

        private async Task ImportDailyPlayerStatsAsync(CancellationToken stoppingToken)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var today = DateTime.UtcNow.Date;
            var yesterday = today.AddDays(-1);

            var datesToCheck = new List<string>
            {
                yesterday.ToString("yyyy-MM-dd"),
                today.ToString("yyyy-MM-dd")
            };

            Console.WriteLine($"Checking games for dates: {string.Join(", ", datesToCheck)}");

            foreach (var date in datesToCheck)
            {
                try
                {
                    var response = await _httpClient.GetAsync($"https://api-nba-v1.p.rapidapi.com/games?date={date}", stoppingToken);
                    await Task.Delay(6000, stoppingToken);
                    response.EnsureSuccessStatusCode();
                    var content = await response.Content.ReadAsStringAsync(stoppingToken);

                    using var json = JsonDocument.Parse(content);
                    var root = json.RootElement.GetProperty("response");

                    var gameIds = root.EnumerateArray()
                        .Where(game =>
                            game.TryGetProperty("status", out var statusProp) &&
                            statusProp.GetProperty("long").GetString() == "Finished" &&
                            game.TryGetProperty("id", out var idProp) &&
                            idProp.TryGetInt32(out var _))
                        .Select(game => game.GetProperty("id").GetInt32())
                        .ToList();

                    Console.WriteLine($"Found {gameIds.Count} finished games for date {date}.");

                    foreach (var gameId in gameIds)
                    {
                        try
                        {
                            var existingGame = await context.Games.FindAsync(new object[] { gameId }, stoppingToken);
                            if (existingGame == null)
                            {
                                var gameDetailsResponse = await _httpClient.GetAsync($"https://api-nba-v1.p.rapidapi.com/games?id={gameId}", stoppingToken);
                                await Task.Delay(7000, stoppingToken);
                                gameDetailsResponse.EnsureSuccessStatusCode();
                                var gameDetailsContent = await gameDetailsResponse.Content.ReadAsStringAsync(stoppingToken);

                                using var gameJson = JsonDocument.Parse(gameDetailsContent);
                                var gameRoot = gameJson.RootElement.GetProperty("response");

                                if (gameRoot.GetArrayLength() > 0)
                                {
                                    var gameItem = gameRoot[0];

                                    var homeTeam = gameItem.GetProperty("teams").GetProperty("home").GetProperty("name").GetString() ?? "";
                                    var awayTeam = gameItem.GetProperty("teams").GetProperty("visitors").GetProperty("name").GetString() ?? "";
                                    var homeScore = gameItem.GetProperty("scores").GetProperty("home").GetProperty("points").GetInt32();
                                    var awayScore = gameItem.GetProperty("scores").GetProperty("visitors").GetProperty("points").GetInt32();

                                    var dateStr = gameItem.GetProperty("date").GetProperty("start").GetString();
                                    var gameDate = DateTime.TryParse(dateStr, out var parsedDate)
                                        ? DateTime.SpecifyKind(parsedDate, DateTimeKind.Utc)
                                        : DateTime.UtcNow;

                                    var newGame = new Game
                                    {
                                        Id = gameId,
                                        HomeTeam = homeTeam,
                                        AwayTeam = awayTeam,
                                        HomeScore = homeScore,
                                        AwayScore = awayScore,
                                        Date = gameDate,
                                        Calculated = false
                                    };

                                    context.Games.Add(newGame);
                                    await context.SaveChangesAsync(stoppingToken);
                                }
                                else
                                {
                                    continue;
                                }
                            }

                            var statsResponse = await _httpClient.GetAsync($"https://api-nba-v1.p.rapidapi.com/players/statistics?game={gameId}", stoppingToken);
                            await Task.Delay(6000, stoppingToken);
                            statsResponse.EnsureSuccessStatusCode();
                            var statsContent = await statsResponse.Content.ReadAsStringAsync(stoppingToken);

                            using var statsJson = JsonDocument.Parse(statsContent);
                            var statsRoot = statsJson.RootElement.GetProperty("response");

                            foreach (var playerStat in statsRoot.EnumerateArray())
                            {
                                try
                                {
                                    int playerId = playerStat.GetProperty("player").GetProperty("id").GetInt32();

                                    bool statExists = await context.PlayerStats.AnyAsync(
                                        s => s.PlayerId == playerId && s.GameId == gameId, stoppingToken);

                                    if (statExists) continue;

                                    var stat = new PlayerStat
                                    {
                                        PlayerId = playerId,
                                        GameId = gameId,
                                        Points = playerStat.GetProperty("points").GetInt32(),
                                        Rebounds = playerStat.GetProperty("totReb").GetInt32(),
                                        Assists = playerStat.GetProperty("assists").GetInt32(),
                                        Steals = playerStat.GetProperty("steals").GetInt32(),
                                        Blocks = playerStat.GetProperty("blocks").GetInt32(),
                                        Turnovers = playerStat.GetProperty("turnovers").GetInt32(),
                                        MinutesPlayed = int.TryParse(playerStat.GetProperty("min").GetString(), out var mins) ? mins : 0,
                                        FGM = playerStat.GetProperty("fgm").GetInt32(),
                                        FGA = playerStat.GetProperty("fga").GetInt32(),
                                        FTM = playerStat.GetProperty("ftm").GetInt32(),
                                        FTA = playerStat.GetProperty("fta").GetInt32(),
                                        Fouls = playerStat.GetProperty("pFouls").GetInt32()
                                    };

                                    context.PlayerStats.Add(stat);
                                }
                                catch
                                {
                                    continue;
                                }
                            }

                            await context.SaveChangesAsync(stoppingToken);
                        }
                        catch
                        {
                            continue;
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to fetch games for {date}: {ex.Message}");
                }
            }
        }
    }
}*/
