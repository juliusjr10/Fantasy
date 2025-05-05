using System.ComponentModel.DataAnnotations;

namespace FantasyBasketball.DTOs
{
    public class AddPostDto
    {
        public int LeagueId { get; set; }
        public int TeamId { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
    }
}
