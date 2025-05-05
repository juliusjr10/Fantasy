namespace FantasyBasketball.DTOs
{
    public class CreateTradeDTO
    {
        public int OfferingTeamId { get; set; }
        public List<int> OfferingPlayerIds { get; set; }
        public int ReceivingTeamId { get; set; }
        public List<int> ReceivingPlayerIds { get; set; }
    }
}
