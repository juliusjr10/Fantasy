using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FantasyBasketball.Migrations
{
    /// <inheritdoc />
    public partial class RenameSubjectIdToPlayerId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SubjectType",
                table: "Questions");

            migrationBuilder.RenameColumn(
                name: "SubjectId",
                table: "Questions",
                newName: "PlayerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PlayerId",
                table: "Questions",
                newName: "SubjectId");

            migrationBuilder.AddColumn<string>(
                name: "SubjectType",
                table: "Questions",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
