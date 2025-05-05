using FantasyBasketball.Data;
using FantasyBasketball.Dtos;
using FantasyBasketball.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
namespace FantasyBasketball.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthService(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        public async Task<(bool Success, string Message, User User)> Register(UserDTO dto)
        {
            bool usernameExists = await _context.Users.AnyAsync(u => u.Username == dto.Username);
            bool emailExists = await _context.Users.AnyAsync(u => u.Email == dto.Email);

            if (usernameExists || emailExists)
                return (false, "Username or email already in use.", null);

            var hasher = new PasswordHasher<User>();
            var user = new User
            {
                Username = dto.Username,
                Email = dto.Email
            };
            user.Password = hasher.HashPassword(user, dto.Password);

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return (true, "Registration successful.", user);
        }

        public async Task<(bool Success, string Message, string Token, User User)> Login(LoginDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null)
                return (false, "User not found.", null, null);

            var hasher = new PasswordHasher<User>();
            var result = hasher.VerifyHashedPassword(user, user.Password, dto.Password);

            if (result != PasswordVerificationResult.Success)
                return (false, "Incorrect password.", null, null);

            var token = GenerateJwtToken(user);

            return (true, "Login successful.", token, user);
        }

        public async Task<User> GetUserById(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return null;

            return new User
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Coins = user.Coins
            };
        }


        public async Task<(bool Success, string Message)> UpdateUser(int id, UserDTO dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return (false, "User not found.");

            bool usernameExists = await _context.Users.AnyAsync(u => u.Username == dto.Username && u.Id != id);
            bool emailExists = await _context.Users.AnyAsync(u => u.Email == dto.Email && u.Id != id);

            if (usernameExists || emailExists)
                return (false, "Username or email already taken.");

            user.Username = dto.Username;
            user.Email = dto.Email;

            if (!string.IsNullOrWhiteSpace(dto.Password))
            {
                var hasher = new PasswordHasher<User>();
                user.Password = hasher.HashPassword(user, dto.Password);
            }

            await _context.SaveChangesAsync();
            return (true, "User updated successfully.");
        }

        public async Task<(bool Success, string Message)> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return (false, "User not found.");

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return (true, "User deleted successfully.");
        }

        private string GenerateJwtToken(User user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Issuer"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(2),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

    }
}
