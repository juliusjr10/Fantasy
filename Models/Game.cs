using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FantasyBasketball.Models
{
    public class Game
    {
        public int Id { get; set; }
        public string HomeTeam { get; set; }
        public string AwayTeam { get; set; }
        public int HomeScore { get; set; }
        public int AwayScore { get; set; }
        public DateTime Date { get; set; }
        public bool Calculated { get; set; } = false;

        public ICollection<PlayerStat> PlayerStats { get; set; } = new List<PlayerStat>();
    }
}
