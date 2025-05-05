namespace FantasyBasketball.DTOs
{
    public class CommentDto
    {
        public int Id { get; set; }
        public int PostId { get; set; }
        public int TeamId { get; set; }
        public string TeamName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
