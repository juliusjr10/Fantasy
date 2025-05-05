using FantasyBasketball.Models;
using System.ComponentModel.DataAnnotations;

public class League
{
    public int Id { get; set; }

    [Required]
    public string Name { get; set; }

    public string Description { get; set; }
    public int CommissionerId { get; set; }
    public User Commissioner { get; set; }
    public string Password { get; set; }
    public DateTime DraftDateTime { get; set; }
    public string Visibility { get; set; }
    public bool Drafted { get; set; } = false;
    public ICollection<Team> Teams { get; set; }
    public int GuardLimit { get; set; }
    public int ForwardLimit { get; set; }
    public int CenterLimit { get; set; }
}
