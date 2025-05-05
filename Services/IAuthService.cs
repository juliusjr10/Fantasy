using FantasyBasketball.Dtos;
using FantasyBasketball.Models;

namespace FantasyBasketball.Services
{
    public interface IAuthService
    {
        Task<(bool Success, string Message, User User)> Register(UserDTO dto);
        Task<(bool Success, string Message, string Token, User User)> Login(LoginDto dto);
        Task<User> GetUserById(int id);
        Task<(bool Success, string Message)> UpdateUser(int id, UserDTO dto);
        Task<(bool Success, string Message)> DeleteUser(int id);

    }
}
