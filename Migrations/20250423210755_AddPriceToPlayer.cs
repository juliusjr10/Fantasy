﻿using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FantasyBasketball.Migrations
{
    /// <inheritdoc />
    public partial class AddPriceToPlayer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "Price",
                table: "Players",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Price",
                table: "Players");
        }
    }
}
