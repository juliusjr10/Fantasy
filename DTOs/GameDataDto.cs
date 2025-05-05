namespace FantasyBasketball.DTOs
{
    public class GameDataDto
    {
        public int Id { get; set; }
        public string HomeTeam { get; set; }
        public string AwayTeam { get; set; }
        public int? HomeScore { get; set; }
        public int? AwayScore { get; set; }
        public DateTime Date { get; set; }
        public List<PlayerStatDto> Players { get; set; }
    }
}
