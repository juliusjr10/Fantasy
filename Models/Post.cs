using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FantasyBasketball.Models
{
    public class Post
    {
        public int Id { get; set; }

        [Required]
        public string Title { get; set; }

        [Required]
        public string Content { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int LeagueId { get; set; }
        public League League { get; set; }

        public int TeamId { get; set; }
        public Team Team { get; set; }

        public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    }
}
