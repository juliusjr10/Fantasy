import { useState, useEffect } from "react";
import PlayerSummary from "./PlayerSummary";
import PlayerCard from "./PlayerCard";

export default function TeamManager({ players, onSubmit, isBudgetLeague, starterLimits, teamId }) {
  const [isEditing, setIsEditing] = useState(false);
  const [ordered, setOrdered] = useState(
    [...players].sort((a, b) => {
      const priority = { Captain: 0, Starter: 1, Bench: 2 };
      return priority[a.role] - priority[b.role];
    })
  );
  const [selectedIndexes, setSelectedIndexes] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState();
  const formatOptions = {
    "2-2-1": { G: 2, F: 2, C: 1 },
    "1-2-2": { G: 1, F: 2, C: 2 },
    "2-1-2": { G: 2, F: 1, C: 2 },
    "1-3-1": { G: 1, F: 3, C: 1 },
    "3-1-1": { G: 3, F: 1, C: 1 },
  };
  useEffect(() => {
    const fetchStarterLimits = async () => {
      try {
        const res = await fetch(`https://localhost:7119/api/Team/${teamId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
  
        if (!res.ok) throw new Error("Failed to fetch team info");
        const data = await res.json();
  
        const match = Object.entries(formatOptions).find(([_, limits]) => {
          return (
            limits.G === data.starterG &&
            limits.F === data.starterF &&
            limits.C === data.starterC
          );
        });
  
        if (match) {
          setSelectedFormat(match[0]);
        }
      } catch (err) {
        console.error("Error loading starter limits:", err);
      }
    };
  
    if (teamId) {
      fetchStarterLimits();
    }
  }, [teamId]);
  
  
  const handleSwapClick = (index) => {
    if (selectedIndexes.includes(index)) {
      setSelectedIndexes(selectedIndexes.filter((i) => i !== index));
    } else if (selectedIndexes.length === 1) {
      const updated = [...ordered];
      const [i1, i2] = [selectedIndexes[0], index];
      [updated[i1], updated[i2]] = [updated[i2], updated[i1]];
      setOrdered(updated);
      setSelectedIndexes([]);
    } else {
      setSelectedIndexes([index]);
    }
  };

  const handleConfirm = async () => {
    const updated = ordered.map((p, idx) => {
      if (idx === 0) return { ...p, role: "Captain" };
      if (idx < 5) return { ...p, role: "Starter" };
      return { ...p, role: "Bench" };
    });
  
    const captain = updated[0];
    const starterRules = { ...formatOptions[selectedFormat] };
  
    starterRules[captain.position] = (starterRules[captain.position] || 0) - 1;
  
    if (!starterRules) {
      alert(`Starter limits are not defined.`);
      return;
    }
  
    const starterPlayers = updated.slice(1, 5);
    const positionCounts = starterPlayers.reduce((acc, p) => {
      acc[p.position] = (acc[p.position] || 0) + 1;
      return acc;
    }, {});
  
    const isValid = Object.entries(positionCounts).every(([pos, count]) => {
      return count <= (starterRules[pos] ?? 0);
    });
  
    if (!isValid) {
      const formatCounts = (counts) => {
        return ['G', 'F', 'C']
          .filter(pos => (counts[pos] || 0) > 0)
          .map(pos => {
            const label = pos === 'G' ? 'Guard(s)' : pos === 'F' ? 'Forward(s)' : 'Center(s)';
            return `${counts[pos]} ${label}`;
          })
          .join(', ');
      };
  
      alert(
        `Invalid starter composition based on captain (${captain.position}).\n` +
        `Allowed: ${formatCounts(starterRules)}.\n` +
        `You currently have: ${formatCounts(positionCounts)}.`
      );
      return;
    }
  
    try {
      await fetch("https://localhost:7119/api/team/update-starter-limits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          teamId: teamId,
          starterG: formatOptions[selectedFormat].G,
          starterF: formatOptions[selectedFormat].F,
          starterC: formatOptions[selectedFormat].C,
        }),
      });
    } catch (err) {
      console.error("Failed to update starter limits:", err);
      alert("Failed to update starter limits");
      return;
    }
  
    onSubmit(updated);
    setIsEditing(false);
    setSelectedIndexes([]);
  };
  


  const handlePlayerClick = (player) => {
    if (!isEditing) setSelectedPlayer(player);
  };

  return (
    <div className="relative space-y-6 bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">Starter Format</label>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm w-full sm:w-48"
            disabled={!isEditing}
          >
            {Object.keys(formatOptions).map((key) => (
              <option key={key} value={key}>
                {key} (G-F-C)
              </option>
            ))}
          </select>
        </div>
  
        <div className="w-full sm:w-auto text-right">
          {isEditing ? (
            <button
              type="button"
              onClick={handleConfirm}
              className="bg-green-600 text-white px-4 py-2 rounded font-semibold w-full sm:w-auto"
            >
              Confirm Changes
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="bg-violet-600 text-white px-4 py-2 rounded font-semibold w-full sm:w-auto"
            >
              Manage Lineup
            </button>
          )}
        </div>
      </div>
  
      <Section title="Captain" players={ordered.slice(0, 1)} startIndex={0} />
      <Section title="Starters" players={ordered.slice(1, 5)} startIndex={1} />
      <Section title="Bench" players={ordered.slice(5)} startIndex={5} />
  
      {selectedPlayer && (
        <PlayerCard player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}
    </div>
  );
  

  function Section({ title, players, startIndex }) {
    return (
      <section>
        <h3 className="text-xl font-bold mb-2 text-gray-700">{title}</h3>
        <div className="space-y-2">
          {players.map((p, i) => (
            <PlayerSummary
              key={p.id}
              player={p}
              index={startIndex + i}
              isSelected={selectedIndexes.includes(startIndex + i)}
              isCaptain={startIndex + i === 0}
              isEditing={isEditing}
              onSwapClick={handleSwapClick}
              onClick={() => handlePlayerClick(p)}
              isBudgetLeague={isBudgetLeague}
            />
          ))}
        </div>
      </section>
    );
  }
}
