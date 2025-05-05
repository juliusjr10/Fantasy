using FantasyBasketball.Data;
using FantasyBasketball.DTOs;
using FantasyBasketball.Models;
using Microsoft.EntityFrameworkCore;

namespace FantasyBasketball.Services
{
    public class TradeService : ITradeService
    {
        private readonly AppDbContext _context;

        public TradeService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<(bool Success, string Message, object Result)> CreateTradeAsync(CreateTradeDTO dto)
        {
            if (dto.OfferingTeamId == dto.ReceivingTeamId)
                return (false, "Cannot trade with yourself.", null);

            if (dto.OfferingPlayerIds == null || dto.ReceivingPlayerIds == null)
                return (false, "Player lists cannot be empty.", null);

            var offeringTeam = await _context.Teams.FindAsync(dto.OfferingTeamId);
            var receivingTeam = await _context.Teams.FindAsync(dto.ReceivingTeamId);
            if (offeringTeam == null || receivingTeam == null)
                return (false, "One or both teams not found.", null);

            var offeringPlayers = await _context.TeamPlayers
                .Where(tp => dto.OfferingPlayerIds.Contains(tp.PlayerId) && tp.TeamId == dto.OfferingTeamId)
                .ToListAsync();
            if (offeringPlayers.Count != dto.OfferingPlayerIds.Count)
                return (false, "One or more offered players are invalid or locked.", null);

            var receivingPlayers = await _context.TeamPlayers
                .Where(tp => dto.ReceivingPlayerIds.Contains(tp.PlayerId) && tp.TeamId == dto.ReceivingTeamId)
                .ToListAsync();
            if (receivingPlayers.Count != dto.ReceivingPlayerIds.Count)
                return (false, "One or more requested players are invalid or locked.", null);

            var trade = new Trade
            {
                OfferingTeamId = dto.OfferingTeamId,
                OfferingPlayerIds = dto.OfferingPlayerIds,
                ReceivingTeamId = dto.ReceivingTeamId,
                ReceivingPlayerIds = dto.ReceivingPlayerIds,
                Status = TradeStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.Trades.Add(trade);
            await _context.SaveChangesAsync();

            return (true, "Trade created successfully.", trade);
        }

        public async Task<IEnumerable<Trade>> GetTradesByTeamIdAsync(int teamId)
        {
            return await _context.Trades
                .Where(t => t.OfferingTeamId == teamId || t.ReceivingTeamId == teamId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<(bool Success, string Message)> CancelTradeAsync(int tradeId)
        {
            var trade = await _context.Trades.FindAsync(tradeId);
            if (trade == null)
                return (false, "Trade not found.");

            if (trade.Status != TradeStatus.Pending)
                return (false, "Only pending trades can be canceled.");

            trade.Status = TradeStatus.Canceled;
            trade.CompletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return (true, "Trade canceled successfully.");
        }

        public async Task<(bool Success, string Message)> AcceptTradeAsync(int tradeId)
        {
            var trade = await _context.Trades.FirstOrDefaultAsync(t => t.Id == tradeId && t.Status == TradeStatus.Pending);
            if (trade == null)
                return (false, "Trade not found or already processed.");

            var offeringTeam = await _context.Teams.Include(t => t.TeamPlayers).FirstOrDefaultAsync(t => t.Id == trade.OfferingTeamId);
            var receivingTeam = await _context.Teams.Include(t => t.TeamPlayers).FirstOrDefaultAsync(t => t.Id == trade.ReceivingTeamId);
            if (offeringTeam == null || receivingTeam == null)
                return (false, "One of the teams not found.");

            foreach (var playerId in trade.OfferingPlayerIds)
            {
                var player = offeringTeam.TeamPlayers.FirstOrDefault(tp => tp.PlayerId == playerId);
                if (player != null)
                {
                    _context.TeamPlayers.Remove(player);
                    receivingTeam.TeamPlayers.Add(new TeamPlayer
                    {
                        TeamId = receivingTeam.Id,
                        PlayerId = playerId,
                        Role = PlayerRole.Bench
                    });
                }
            }

            foreach (var playerId in trade.ReceivingPlayerIds)
            {
                var player = receivingTeam.TeamPlayers.FirstOrDefault(tp => tp.PlayerId == playerId);
                if (player != null)
                {
                    _context.TeamPlayers.Remove(player);
                    offeringTeam.TeamPlayers.Add(new TeamPlayer
                    {
                        TeamId = offeringTeam.Id,
                        PlayerId = playerId,
                        Role = PlayerRole.Bench
                    });
                }
            }

            trade.Status = TradeStatus.Accepted;
            trade.CompletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return (true, "Trade accepted successfully.");
        }

        public async Task<(bool Success, string Message)> DeclineTradeAsync(int tradeId)
        {
            var trade = await _context.Trades.FindAsync(tradeId);
            if (trade == null)
                return (false, "Trade not found.");

            if (trade.Status != TradeStatus.Pending)
                return (false, "Only pending trades can be declined.");

            trade.Status = TradeStatus.Canceled;
            trade.CompletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return (true, "Trade declined successfully.");
        }
    }
}
