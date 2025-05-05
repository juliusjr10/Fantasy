namespace FantasyBasketball.DTOs
{
    public class ThresholdQuestionDto
    {
        public int PlayerId { get; set; }
        public string Category { get; set; }
        public double Threshold { get; set; }
        public int GameId { get; set; }
        public DateTime Deadline { get; set; }
    }
}
