namespace FantasyBasketball.Models
{
    public class Trade
    {
        public int Id { get; set; }
        public int OfferingTeamId { get; set; }
        public List<int> OfferingPlayerIds { get; set; } = new();
        public int ReceivingTeamId { get; set; }
        public List<int> ReceivingPlayerIds { get; set; } = new();
        public TradeStatus Status { get; set; } = TradeStatus.Pending;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
    }
    public enum TradeStatus
    {
        Pending,
        Accepted,
        Rejected,
        Canceled
    }
}
