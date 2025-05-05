using Microsoft.EntityFrameworkCore;
using FantasyBasketball.Models;

namespace FantasyBasketball.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Team> Teams { get; set; }
        public DbSet<Player> Players { get; set; }
        public DbSet<PlayerStat> PlayerStats { get; set; }
        public DbSet<League> Leagues { get; set; }
        public DbSet<DraftPick> DraftPicks { get; set; }
        public DbSet<TeamPlayer> TeamPlayers { get; set; }
        public DbSet<Game> Games { get; set; }
        public DbSet<Trade> Trades { get; set; }
        public DbSet<Question> Questions { get; set; }
        public DbSet<UserAnswer> UserAnswers { get; set; }
        public DbSet<Post> Posts { get; set; }
        public DbSet<Comment> Comments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>()
                .HasMany(u => u.Teams)
                .WithOne(t => t.User)
                .HasForeignKey(t => t.UserId);

            modelBuilder.Entity<TeamPlayer>()
                .HasKey(tp => new { tp.TeamId, tp.PlayerId });

            modelBuilder.Entity<TeamPlayer>()
                .HasOne(tp => tp.Team)
                .WithMany(t => t.TeamPlayers)
                .HasForeignKey(tp => tp.TeamId);

            modelBuilder.Entity<TeamPlayer>()
                .HasOne(tp => tp.Player)
                .WithMany(p => p.TeamPlayers)
                .HasForeignKey(tp => tp.PlayerId);

            modelBuilder.Entity<League>()
                .HasOne(l => l.Commissioner)
                .WithMany()
                .HasForeignKey(l => l.CommissionerId);

            modelBuilder.Entity<League>()
                .HasMany(l => l.Teams)
                .WithOne(t => t.League)
                .HasForeignKey(t => t.LeagueId);

            modelBuilder.Entity<DraftPick>()
                .HasOne(dp => dp.Team)
                .WithMany()
                .HasForeignKey(dp => dp.TeamId);

            modelBuilder.Entity<DraftPick>()
                .HasOne(dp => dp.Player)
                .WithMany()
                .HasForeignKey(dp => dp.PlayerId);

            modelBuilder.Entity<PlayerStat>()
                .HasOne(ps => ps.Game)
                .WithMany(g => g.PlayerStats)
                .HasForeignKey(ps => ps.GameId);
            modelBuilder.Entity<UserAnswer>()
                .HasOne(ua => ua.Question)
                .WithMany()
                .HasForeignKey(ua => ua.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Post>()
                .HasOne(p => p.Team)
                .WithMany()
                .HasForeignKey(p => p.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Post>()
                .HasOne(p => p.League)
                .WithMany()
                .HasForeignKey(p => p.LeagueId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Comment>()
                .HasOne(c => c.Post)
                .WithMany(p => p.Comments)
                .HasForeignKey(c => c.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Comment>()
                .HasOne(c => c.Team)
                .WithMany()
                .HasForeignKey(c => c.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

        }
    }
}
