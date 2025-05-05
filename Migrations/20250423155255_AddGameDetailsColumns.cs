using Microsoft.EntityFrameworkCore.Migrations;
using System;

#nullable disable

namespace FantasyBasketball.Migrations
{
    public partial class AddGameDetailsColumns : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "HomeTeam",
                table: "Games",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AwayTeam",
                table: "Games",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "HomeScore",
                table: "Games",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "AwayScore",
                table: "Games",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "Date",
                table: "Games",
                type: "timestamp without time zone",
                nullable: false,
                defaultValueSql: "NOW()");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HomeTeam",
                table: "Games");

            migrationBuilder.DropColumn(
                name: "AwayTeam",
                table: "Games");

            migrationBuilder.DropColumn(
                name: "HomeScore",
                table: "Games");

            migrationBuilder.DropColumn(
                name: "AwayScore",
                table: "Games");

            migrationBuilder.DropColumn(
                name: "Date",
                table: "Games");
        }
    }
}
