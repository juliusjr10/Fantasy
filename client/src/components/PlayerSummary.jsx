export default function PlayerSummary({ player, index, onSwapClick, isSelected, isCaptain, isEditing, onClick, isBudgetLeague }) {
  const formattedName = `${player.firstName[0]}. ${player.lastName}`;
  const imgSrc = `/players/${player.firstName}_${player.lastName}.png`;

  return (
<div
  onClick={!isEditing ? onClick : undefined}
  className={`flex items-center bg-white border rounded-lg p-2 shadow-sm text-sm cursor-pointer ${
    isSelected ? "border-blue-500" : "border-gray-300"
  }`}
>
  <div className="w-8 text-gray-600 font-semibold text-center">{player.position}</div>

  <img
    src={imgSrc}
    onError={(e) => (e.target.src = "/players/default.png")}
    alt={`${player.firstName} ${player.lastName}`}
    className="w-10 h-10 rounded-full object-cover mx-3"
  />

  <div className="flex-1">
    <div className="font-medium text-gray-800 leading-tight">
      {`${player.firstName[0]}. ${player.lastName}`}
      {isBudgetLeague && player.price !== undefined && (
        <span className="text-gray-500 text-xs ml-2">${player.price.toFixed(1)}</span>
      )}
    </div>

    {isCaptain && (
      <div className="text-[10px] text-white bg-blue-500 mt-0.5 px-1.5 py-0.5 rounded-full w-fit">
        Captain
      </div>
    )}
  </div>

  {isEditing && (
    <button
      onClick={() => onSwapClick(index)}
      className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded"
    >
      Move
    </button>
  )}
</div>

  );
}
