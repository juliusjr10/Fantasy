using System;
using System.ComponentModel.DataAnnotations;

namespace FantasyBasketball.Models
{
    public class Comment
    {
        public int Id { get; set; }

        [Required]
        public string Content { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int PostId { get; set; }
        public Post Post { get; set; }

        public int TeamId { get; set; }
        public Team Team { get; set; }
    }
}