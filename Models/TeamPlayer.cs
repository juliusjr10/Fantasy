namespace FantasyBasketball.Models
{
    public enum PlayerRole
    {
        Starter,
        Bench,
        Captain
    }

    public class TeamPlayer
    {
        public int TeamId { get; set; }
        public Team Team { get; set; }
        public int PlayerId { get; set; }
        public Player Player { get; set; }
        public PlayerRole Role { get; set; } = PlayerRole.Bench;
    }

}
