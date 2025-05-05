using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FantasyBasketball.Data;
using FantasyBasketball.Models;
using FantasyBasketball.DTOs;
using Microsoft.EntityFrameworkCore;

namespace FantasyBasketball.Services
{
    public class ForumService : IForumService
    {
        private readonly AppDbContext _context;

        public ForumService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Post> AddPostAsync(AddPostDto dto)
        {
            var post = new Post
            {
                Title = dto.Title,
                Content = dto.Content,
                LeagueId = dto.LeagueId,
                TeamId = dto.TeamId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Posts.Add(post);
            await _context.SaveChangesAsync();

            return post;
        }

        public async Task<List<PostDto>> GetPostsByLeagueIdAsync(int leagueId)
        {
            return await _context.Posts
                .Where(p => p.LeagueId == leagueId)
                .Include(p => p.Team)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new PostDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Content = p.Content,
                    CreatedAt = p.CreatedAt,
                    TeamId = p.TeamId,
                    TeamName = p.Team.Name
                })
                .ToListAsync();
        }
        public async Task<Post?> UpdatePostAsync(int postId, UpdatePostDto dto)
        {
            var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == postId);
            if (post == null) return null;

            post.Title = dto.Title;
            post.Content = dto.Content;
            post.CreatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return post;
        }
        public async Task<bool> DeletePostAsync(int postId, int teamId)
        {
            var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == postId && p.TeamId == teamId);
            if (post == null) return false;

            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();
            return true;
        }
        public async Task<Comment?> AddCommentAsync(AddCommentDto dto)
        {
            var postExists = await _context.Posts.AnyAsync(p => p.Id == dto.PostId);
            var teamExists = await _context.Teams.AnyAsync(t => t.Id == dto.TeamId);

            if (!postExists || !teamExists) return null;

            var comment = new Comment
            {
                PostId = dto.PostId,
                TeamId = dto.TeamId,
                Content = dto.Content,
                CreatedAt = DateTime.UtcNow
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            return comment;
        }
        public async Task<List<CommentDto>> GetCommentsByPostIdAsync(int postId)
        {
            return await _context.Comments
                .Where(c => c.PostId == postId)
                .Include(c => c.Team)
                .OrderBy(c => c.CreatedAt)
                .Select(c => new CommentDto
                {
                    Id = c.Id,
                    PostId = c.PostId,
                    TeamId = c.TeamId,
                    TeamName = c.Team.Name,
                    Content = c.Content,
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();
        }
        public async Task<Comment?> UpdateCommentAsync(int commentId, int teamId, string content)
        {
            var comment = await _context.Comments.FirstOrDefaultAsync(c => c.Id == commentId && c.TeamId == teamId);
            if (comment == null) return null;

            comment.Content = content;
            comment.CreatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return comment;
        }

        public async Task<bool> DeleteCommentAsync(int commentId, int teamId)
        {
            var comment = await _context.Comments.FirstOrDefaultAsync(c => c.Id == commentId && c.TeamId == teamId);
            if (comment == null) return false;

            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();
            return true;
        }

    }
}
