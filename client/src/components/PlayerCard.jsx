import { useEffect, useState } from "react";

function PlayerCard({ player, onClose }) {
  const [averages, setAverages] = useState(player.averages ?? null);
  const [loading, setLoading] = useState(!player.averages);

  useEffect(() => {
    if (!player.averages) {
      const fetchAverages = async () => {
        try {
          const res = await fetch(`https://localhost:7119/api/players/${player.id}/averages`);
          const data = await res.json();
          setAverages(data);
        } catch (err) {
          console.error("Error fetching averages", err);
        } finally {
          setLoading(false);
        }
      };

      fetchAverages();
    }
  }, [player]);

  const imagePath = `/players/${player.firstName.toLowerCase()}_${player.lastName.toLowerCase()}.png`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-white rounded-xl p-3 w-[90%] max-w-sm relative shadow-lg text-black text-sm">
        <button className="absolute top-3 right-3 text-lg" onClick={onClose}>
          ✕
        </button>

        <div className="flex flex-col items-center">
          <img
            src={imagePath}
            alt={`${player.firstName} ${player.lastName}`}
            className="w-16 h-16 rounded-full object-cover mb-2 border-2 border-gray-200"
          />
          <h2 className="text-base font-semibold text-center">
            {player.firstName} <span className="uppercase">{player.lastName}</span>
          </h2>
          <p className="text-gray-500 text-xs">{player.team} • {player.position}</p>

          {loading ? (
            <p className="mt-3 text-xs text-gray-500">Loading stats...</p>
          ) : (
            <div className="mt-3 flex justify-center w-full text-center">
              <div>
                <div className="text-lg font-semibold">
                  {averages?.fantasyPoints?.toFixed(1) ?? "—"}
                </div>
                <div className="text-xs text-gray-500">FPTS avg.</div>
              </div>
            </div>
          )}
        </div>

        {!loading && averages && (
          <div className="mt-4 border-t border-gray-200 pt-3 space-y-1">
            <StatRow label="Fantasy Points" value={averages.fantasyPoints?.toFixed(1) ?? "—"} />
            <StatRow label="Points" value={averages.points?.toFixed(1) ?? "—"} />
            <StatRow label="Rebounds" value={averages.rebounds?.toFixed(1) ?? "—"} />
            <StatRow label="Assists" value={averages.assists?.toFixed(1) ?? "—"} />
            <StatRow label="Blocks" value={averages.blocks?.toFixed(1) ?? "—"} />
            <StatRow label="Steals" value={averages.steals?.toFixed(1) ?? "—"} />
            <StatRow label="FG%" value={averages.fieldGoalPercentage?.toFixed(1) ?? "—"} />
            <StatRow label="FT%" value={averages.freeThrowPercentage?.toFixed(1) ?? "—"} />
            <StatRow label="Turnovers" value={averages.turnovers?.toFixed(1) ?? "—"} />
            <StatRow label="Fouls" value={averages.fouls?.toFixed(1) ?? "—"} />
            <StatRow label="Minutes" value={averages.minutes?.toFixed(1) ?? "—"} />
          </div>
        )}
      </div>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between text-xs text-gray-700">
      <span>{label}</span>
      <span className="font-medium text-black">{value}</span>
    </div>
  );
}

export default PlayerCard;
