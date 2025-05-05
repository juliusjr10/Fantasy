using System.ComponentModel.DataAnnotations;

namespace FantasyBasketball.Models
{
    public class Player
    {
        public int Id { get; set; }
        [Required]
        public string FirstName { get; set; }
        [Required]
        public string LastName { get; set; }
        public string Team { get; set; }
        public string Position { get; set; }
        public double Price { get; set; }
        public ICollection<PlayerStat> Stats { get; set; }
        public ICollection<TeamPlayer> TeamPlayers { get; set; } = new List<TeamPlayer>();
    }
}
