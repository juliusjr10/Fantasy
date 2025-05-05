﻿namespace FantasyBasketball.Models
{
public class UserAnswer
{
    public int Id { get; set; }
    public int QuestionId { get; set; }
    public int UserId { get; set; }
    public int SelectedAnswerIndex { get; set; }
    public bool IsCorrect { get; set; }
    public Question Question { get; set; }
    public User User { get; set; }
}
}