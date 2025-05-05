namespace FantasyBasketball.Dtos
{
    public class EditLeagueLimitsDto
    {
        public int LeagueId { get; set; }
        public int GuardLimit { get; set; }
        public int ForwardLimit { get; set; }
        public int CenterLimit { get; set; }
    }
}
