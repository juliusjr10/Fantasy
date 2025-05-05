namespace FantasyBasketball.DTOs
{
    public class PlayerStatDto
    {
        public int PlayerId { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Team { get; set; }
        public int Points { get; set; }
        public int Rebounds { get; set; }
        public int Assists { get; set; }
        public int Steals { get; set; }
        public int Blocks { get; set; }
        public int Turnovers { get; set; }
        public int Fouls { get; set; }
        public int MinutesPlayed { get; set; }
        public int FGA { get; set; }
        public int FGM { get; set; }
        public int FTA { get; set; }
        public int FTM { get; set; }
        public double FantasyPoints { get; set; }
    }
}
