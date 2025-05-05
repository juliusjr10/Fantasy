public class CreateLeagueDto
{
    public string Name { get; set; }
    public string Description { get; set; }
    public string Password { get; set; }
    public DateTime DraftDateTime { get; set; }
    public int CommissionerId { get; set; }
    public string Visibility { get; set; }
    public int GuardLimit { get; set; }
    public int ForwardLimit { get; set; }
    public int CenterLimit { get; set; }
}
