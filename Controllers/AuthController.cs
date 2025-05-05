using Microsoft.AspNetCore.Mvc;
using FantasyBasketball.Services;
using FantasyBasketball.Dtos;

namespace FantasyBasketball.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(UserDTO dto)
        {
            var (success, message, user) = await _authService.Register(dto);
            if (!success)
            {
                return BadRequest(message);
            }

            return Ok(new { user.Id, user.Username });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var (success, message, token, user) = await _authService.Login(dto);
            if (!success)
                return Unauthorized(message);

            return Ok(new { token, user.Id, user.Username, user.Email });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(int id)
        {
            var dto = await _authService.GetUserById(id);
            if (dto == null)
                return NotFound("User not found.");

            return Ok(dto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, UserDTO dto)
        {
            var (success, message) = await _authService.UpdateUser(id, dto);
            if (!success)
                return BadRequest(message);

            return Ok(new { message });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var (success, message) = await _authService.DeleteUser(id);
            if (!success)
                return NotFound(message);

            return Ok(new { message });
        }

    }

}
