using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FantasyBasketball.Migrations
{
    /// <inheritdoc />
    public partial class RemoveAnsweredAtFromUserAnswer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AnsweredAt",
                table: "UserAnswers");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AnsweredAt",
                table: "UserAnswers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }
    }
}
