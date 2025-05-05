namespace FantasyBasketball.Models
{
    public class DraftPick
    {
        public int Id { get; set; }

        public int LeagueId { get; set; } 
        public int TeamId { get; set; }
        public int PlayerId { get; set; }

        public int PickNumber { get; set; }    
        public DateTime TimePicked { get; set; }
        public Team Team { get; set; }
        public Player Player { get; set; }
    }

}
