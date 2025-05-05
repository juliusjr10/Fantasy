namespace FantasyBasketball.Models
{
    public class Question
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string[] Answers { get; set; }
        public int? CorrectAnswerIndex { get; set; }
        public DateTime Deadline { get; set; }
        public bool IsActive { get; set; } = true;
        public int GameId { get; set; }
        public Game Game { get; set; }
        public int PlayerId { get; set; }
        public string Category { get; set; }
        public double Threshold { get; set; }
    }
}
