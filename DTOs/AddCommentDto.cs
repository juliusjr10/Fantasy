namespace FantasyBasketball.DTOs
{
    public class AddCommentDto
    {
        public int PostId { get; set; }
        public int TeamId { get; set; }
        public string Content { get; set; } = string.Empty;
    }
}
