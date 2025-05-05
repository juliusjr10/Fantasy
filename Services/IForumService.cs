using FantasyBasketball.DTOs;
using FantasyBasketball.Models;

namespace FantasyBasketball.Services
{
    public interface IForumService
    {
        Task<Post> AddPostAsync(AddPostDto dto);
        Task<List<PostDto>> GetPostsByLeagueIdAsync(int leagueId);
        Task<Post?> UpdatePostAsync(int postId, UpdatePostDto dto);
        Task<bool> DeletePostAsync(int postId, int teamId);
        Task<Comment?> AddCommentAsync(AddCommentDto dto);
        Task<List<CommentDto>> GetCommentsByPostIdAsync(int postId);
        Task<Comment?> UpdateCommentAsync(int commentId, int teamId, string content);
        Task<bool> DeleteCommentAsync(int commentId, int teamId);
    }
}
