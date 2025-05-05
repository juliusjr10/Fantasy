using Microsoft.AspNetCore.Mvc;
using FantasyBasketball.Services;
using FantasyBasketball.DTOs;
using System.Threading.Tasks;

namespace FantasyBasketball.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ForumController : ControllerBase
    {
        private readonly IForumService _forumService;

        public ForumController(IForumService forumService)
        {
            _forumService = forumService;
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddPost([FromBody] AddPostDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var post = await _forumService.AddPostAsync(dto);
            return Ok(post);
        }
        [HttpGet("league/{leagueId}")]
        public async Task<IActionResult> GetPostsByLeague(int leagueId)
        {
            var posts = await _forumService.GetPostsByLeagueIdAsync(leagueId);
            return Ok(posts);
        }
        [HttpPut("{postId}")]
        public async Task<IActionResult> UpdatePost(int postId, [FromBody] UpdatePostDto dto)
        {
            var updated = await _forumService.UpdatePostAsync(postId, dto);
            if (updated == null) return NotFound("Post not found");

            return Ok(updated);
        }
        [HttpDelete("{postId}")]
        public async Task<IActionResult> DeletePost(int postId, [FromQuery] int teamId)
        {
            var success = await _forumService.DeletePostAsync(postId, teamId);
            if (!success) return NotFound("Post not found or unauthorized");

            return NoContent();
        }
        [HttpPost("comment")]
        public async Task<IActionResult> AddComment([FromBody] AddCommentDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var comment = await _forumService.AddCommentAsync(dto);
            if (comment == null) return NotFound("Invalid post or team.");

            return Ok(comment);
        }
        [HttpGet("{postId}/comments")]
        public async Task<IActionResult> GetComments(int postId)
        {
            var comments = await _forumService.GetCommentsByPostIdAsync(postId);
            return Ok(comments);
        }
        [HttpPut("comment/{commentId}")]
        public async Task<IActionResult> UpdateComment(int commentId, [FromQuery] int teamId, [FromBody] string content)
        {
            var updated = await _forumService.UpdateCommentAsync(commentId, teamId, content);
            if (updated == null) return NotFound("Comment not found or unauthorized.");
            return Ok(updated);
        }

        [HttpDelete("comment/{commentId}")]
        public async Task<IActionResult> DeleteComment(int commentId, [FromQuery] int teamId)
        {
            var success = await _forumService.DeleteCommentAsync(commentId, teamId);
            return success ? Ok() : NotFound("Comment not found or unauthorized.");
        }

    }
}
