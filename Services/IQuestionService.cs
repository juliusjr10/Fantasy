using FantasyBasketball.DTOs;
using FantasyBasketball.Models;
using System.Security.Claims;

namespace FantasyBasketball.Services
{
    public interface IQuestionService
    {
        Task<Question> CreateThresholdQuestionAsync(ThresholdQuestionDto dto);
        Task<IEnumerable<Question>> GetTodaysQuestionsAsync();
        Task<string> AnswerQuestionAsync(AnswerQuestionDto dto, ClaimsPrincipal user);
        Task<IEnumerable<UserAnswer>> GetAnswersByQuestionIdAsync(int questionId);
        Task SetCorrectAnswerForQuestion(Question question);
        Task<IEnumerable<UserAnswer>> GetAnswersByUserIdAsync(int userId);
        Task<(bool Success, string Message)> DeleteQuestionAsync(int questionId);

    }
}
