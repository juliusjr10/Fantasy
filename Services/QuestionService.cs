using FantasyBasketball.Data;
using FantasyBasketball.DTOs;
using FantasyBasketball.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FantasyBasketball.Services
{
    public class QuestionService : IQuestionService
    {
        private readonly AppDbContext _context;

        public QuestionService(AppDbContext context)
        {
            _context = context;
        }
        public async Task<Question> CreateThresholdQuestionAsync(ThresholdQuestionDto dto)
        {
            if (dto == null || dto.Threshold <= 0 || string.IsNullOrWhiteSpace(dto.Category))
                return null;

            string playerName = await GetPlayerNameAsync(dto.PlayerId);
            if (string.IsNullOrEmpty(playerName))
                return null;

            string title = $"{playerName} to get more than {dto.Threshold} {dto.Category}?";

            var question = new Question
            {
                Title = title,
                Answers = new[] { "Yes", "No" },
                Deadline = dto.Deadline.ToUniversalTime(),
                IsActive = true,
                GameId = dto.GameId,
                PlayerId = dto.PlayerId,
                Category = dto.Category,
                Threshold = dto.Threshold
            };

            _context.Questions.Add(question);
            await _context.SaveChangesAsync();

            return question;
        }


        public async Task<string> GetPlayerNameAsync(int playerId)
        {
            var player = await _context.Players.FindAsync(playerId);
            return player?.FirstName + " " + player?.LastName;
        }


        public async Task<IEnumerable<Question>> GetTodaysQuestionsAsync()
        {
            var lastCalculatedGame = await _context.Games
                .Where(g => g.Calculated)
                .OrderByDescending(g => g.Date)
                .FirstOrDefaultAsync();

            if (lastCalculatedGame == null)
                return new List<Question>();

            var baseDate = lastCalculatedGame.Date.Date.AddDays(1);
            var nextDay = baseDate.AddDays(1);

            return await _context.Questions
                .Include(q => q.Game)
                .Where(q => q.Deadline >= baseDate && q.Deadline < nextDay)
                .ToListAsync();
        }

        public async Task<string> AnswerQuestionAsync(AnswerQuestionDto dto, ClaimsPrincipal user)
        {
            if (dto == null || dto.SelectedAnswerIndex < 0)
                return "Invalid input.";

            var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
                return "User ID not found in token.";

            var userId = int.Parse(userIdClaim.Value);

            var question = await _context.Questions.FindAsync(dto.QuestionId);
            if (question == null)
                return "Question not found.";

            var existingAnswer = await _context.UserAnswers
                .FirstOrDefaultAsync(a => a.QuestionId == dto.QuestionId && a.UserId == userId);

            if (existingAnswer != null)
                return "You have already answered this question.";

            var userAnswer = new UserAnswer
            {
                QuestionId = dto.QuestionId,
                UserId = userId,
                SelectedAnswerIndex = dto.SelectedAnswerIndex,
                IsCorrect = false
            };

            _context.UserAnswers.Add(userAnswer);
            await _context.SaveChangesAsync();

            return "Answer submitted successfully.";
        }
        public async Task<IEnumerable<UserAnswer>> GetAnswersByQuestionIdAsync(int questionId)
        {
            return await _context.UserAnswers
                .Where(a => a.QuestionId == questionId)
                .ToListAsync();
        }

        public async Task SetCorrectAnswerForQuestion(Question question)
        {
            if (question == null)
                throw new ArgumentNullException(nameof(question));

            var game = await _context.Games
                .Include(g => g.PlayerStats)
                    .ThenInclude(ps => ps.Player)
                .FirstOrDefaultAsync(g => g.Id == question.GameId);

            if (game == null)
                return;

                var playerStat = game.PlayerStats.FirstOrDefault(ps => ps.PlayerId == question.PlayerId);
                if (playerStat == null)
                    return;

                double statValue = question.Category switch
                {
                    "Points" => playerStat.Points,
                    "Assists" => playerStat.Assists,
                    "Rebounds" => playerStat.Rebounds,
                    "Steals" => playerStat.Steals,
                    "Blocks" => playerStat.Blocks,
                    _ => 0
                };

                question.CorrectAnswerIndex = statValue > question.Threshold ? 0 : 1;

            if (question.CorrectAnswerIndex != null)
            {
                var correctAnswers = await _context.UserAnswers
                    .Where(ua => ua.QuestionId == question.Id && ua.SelectedAnswerIndex == question.CorrectAnswerIndex)
                    .ToListAsync();

                foreach (var answer in correctAnswers)
                {
                    var user = await _context.Users.FindAsync(answer.UserId);
                    if (user != null)
                    {
                        user.Coins += 10;
                    }

                    answer.IsCorrect = true;
                }
            }
        }
        public async Task<IEnumerable<UserAnswer>> GetAnswersByUserIdAsync(int userId)
        {
            return await _context.UserAnswers
                .Where(a => a.UserId == userId)
                .Include(a => a.Question)
                .Include(a => a.User)
                .ToListAsync();
        }
        public async Task<(bool Success, string Message)> DeleteQuestionAsync(int questionId)
        {
            var question = await _context.Questions
                .FirstOrDefaultAsync(q => q.Id == questionId);

            if (question == null)
                return (false, "Question not found.");

            var userAnswers = await _context.UserAnswers
                .Where(a => a.QuestionId == questionId)
                .ToListAsync();


            _context.Questions.Remove(question);

            await _context.SaveChangesAsync();
            return (true, "Question deleted successfully.");
        }

    }
}
