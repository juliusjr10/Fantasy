using System;

namespace FantasyBasketball.DTOs
{
    public class PostDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public DateTime CreatedAt { get; set; }
        public int TeamId { get; set; }
        public string TeamName { get; set; }
    }
}
