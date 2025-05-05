using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FantasyBasketball.Migrations
{
    /// <inheritdoc />
    public partial class AddGames : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_PlayerStats_GameId",
                table: "PlayerStats",
                column: "GameId");

            migrationBuilder.AddForeignKey(
                name: "FK_PlayerStats_Games_GameId",
                table: "PlayerStats",
                column: "GameId",
                principalTable: "Games",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PlayerStats_Games_GameId",
                table: "PlayerStats");

            migrationBuilder.DropIndex(
                name: "IX_PlayerStats_GameId",
                table: "PlayerStats");
        }
    }
}
