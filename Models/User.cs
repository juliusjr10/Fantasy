namespace FantasyBasketball.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public RoleType Role { get; set; }
        public int Coins { get; set; } = 0;
        public ICollection<Team> Teams { get; set; }

        public enum RoleType
        {
            User = 0,
            Admin = 1
        }
    }
}

