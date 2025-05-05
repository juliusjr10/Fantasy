namespace FantasyBasketball.Models
{
    public class Team
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int UserId { get; set; }
        public User User { get; set; }
        public int LeagueId { get; set; }
        public League League { get; set; }
        public ICollection<TeamPlayer> TeamPlayers { get; set; } = new List<TeamPlayer>();
        public int TotalPoints { get; set; } = 0;
        public double Budget { get; set; } = 500;
        public int StarterG { get; set; } = 2;
        public int StarterF { get; set; } = 2;
        public int StarterC { get; set; } = 1;
    }
}
