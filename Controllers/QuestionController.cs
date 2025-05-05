using FantasyBasketball.DTOs;
using FantasyBasketball.Models;
using FantasyBasketball.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FantasyBasketball.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QuestionController : ControllerBase
    {
        private readonly IQuestionService _questionService;

        public QuestionController(IQuestionService questionService)
        {
            _questionService = questionService;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateThresholdQuestion([FromBody] ThresholdQuestionDto dto)
        {
            var question = await _questionService.CreateThresholdQuestionAsync(dto);
            if (question == null)
                return BadRequest("Failed to create question.");

            return Ok(question);
        }

        [HttpGet("today")]
        public async Task<IActionResult> GetTodaysQuestions()
        {
            var questions = await _questionService.GetTodaysQuestionsAsync();
            return Ok(questions);
        }

        [Authorize]
        [HttpPost("answer")]
        public async Task<IActionResult> AnswerQuestion([FromBody] AnswerQuestionDto dto)
        {
            var result = await _questionService.AnswerQuestionAsync(dto, User);
            if (result != "Answer submitted successfully.")
                return BadRequest(result);

            return Ok(result);
        }

        [HttpGet("{questionId}/answers")]
        public async Task<IActionResult> GetAnswersByQuestionId(int questionId)
        {
            var answers = await _questionService.GetAnswersByQuestionIdAsync(questionId);
            if (!answers.Any())
                return NotFound("No answers found for this question.");

            return Ok(answers);
        }
        [Authorize]
        [HttpGet("my-answers")]
        public async Task<IActionResult> GetMyAnswers()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null) return Unauthorized();

            int userId = int.Parse(userIdClaim.Value);
            var answers = await _questionService.GetAnswersByUserIdAsync(userId);

            return Ok(answers.Select(a => new {
                Title = a.Question?.Title,
                Answer = a.SelectedAnswerIndex,
                IsCorrect = a.IsCorrect
            }));
        }
        [HttpDelete("{questionId}")]
        public async Task<IActionResult> DeleteQuestion(int questionId)
        {
            var result = await _questionService.DeleteQuestionAsync(questionId);
            if (!result.Success)
                return NotFound(result.Message);

            return Ok(result.Message);
        }

    }
}
