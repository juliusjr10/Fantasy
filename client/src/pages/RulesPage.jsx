import React, { useState } from "react";

function RulesPage() {
    const [mode, setMode] = useState("budget");

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 p-6 text-white">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex space-x-4 border-b border-slate-600 pb-2">
                    <button
                        className={`px-4 py-2 rounded-t font-semibold ${mode === "budget"
                            ? "bg-white text-slate-800"
                            : "text-gray-400 hover:text-white"
                            }`}
                        onClick={() => setMode("budget")}
                    >
                        Budget mode
                    </button>
                    <button
                        className={`px-4 py-2 rounded-t font-semibold ${mode === "draft"
                            ? "bg-white text-slate-800"
                            : "text-gray-400 hover:text-white"
                            }`}
                        onClick={() => setMode("draft")}
                    >
                        Draft mode
                    </button>
                </div>

                {mode === "budget" && (
                    <div className="space-y-6">
                        <h1 className="text-4xl font-bold text-orange-400">Budget Mode Rules</h1>

                        <section>
                            <h2 className="text-2xl font-semibold text-white">Team Creation</h2>
                            <p className="mt-2 text-gray-300">
                                You can create only one team. Each team is made up of 12 players and a total budget of $500. The team must consist of 4 guards, 4 forwards, and 2 centers.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-white">Scoring</h2>
                            <p className="mt-2 text-gray-300">
                                The modern scoring system awards fantasy points based on detailed player stats:
                            </p>
                            <ul className="mt-2 list-disc list-inside text-gray-300 space-y-1">
                                <li>+1.15 points per point scored</li>
                                <li>+1.2 points per rebound</li>
                                <li>+1.5 points per assist</li>
                                <li>+2.0 points per block</li>
                                <li>+2.0 points per steal</li>
                                <li>-1.0 point per turnover</li>
                                <li>-1.0 point for each missed field goal</li>
                                <li>-1.0 point for each missed free throw</li>
                                <li>-1.0 point per personal foul</li>
                                <li>+10 bonus points for a double-double</li>
                                <li>+30 bonus points for a triple-double</li>
                            </ul>
                            <p className="mt-4 text-gray-300">
                                Player points are then multiplied based on their role:
                            </p>
                            <ul className="mt-2 list-disc list-inside text-gray-300 space-y-1">
                                <li><strong>Starter:</strong> 100% of fantasy points</li>
                                <li><strong>Bench:</strong> 50%</li>
                                <li><strong>Captain:</strong> 200%</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-white">Lineups & Roles</h2>
                            <p className="mt-2 text-gray-300">
                                Before every round, choose a starting five, formation, and captain. The starting players give you 100% of their fantasy points, bench players give 50%, and the captain gives 200%.
                            </p>
                        </section>


                        <section>
                            <h2 className="text-2xl font-semibold text-white">Free Agency</h2>
                            <p className="mt-2 text-gray-300">
                                You can switch players freely and as many times as you want between rounds, as long as your team stays within the $500 budget. All player additions and removals must still respect positional requirements.
                            </p>
                        </section>
                    </div>
                )}


                {mode === "draft" && (
                    <div className="space-y-6">
                        <h1 className="text-4xl font-bold text-orange-400">Draft Mode Rules</h1>

                        <section>
                            <h2 className="text-2xl font-semibold text-white">Leagues & Team Setup</h2>
                            <p className="mt-2 text-gray-300">
                                Each team consists of 12 unique players. The league Commissioner defines how many guards, forwards, and centers must be included in each team. No budgets are used. Players are drafted live — once selected, they cannot be picked again.
                            </p>
                        </section>


                        <section>
                            <h2 className="text-2xl font-semibold text-white">Live Draft</h2>
                            <p className="mt-2 text-gray-300">
                                Any player in the league can start the live draft. The draft uses a serpentine (snake) order and allows 60 seconds per pick. The draft order is randomized 15 minutes before it begins.
                            </p>
                        </section>


                        <section>
                            <h2 className="text-2xl font-semibold text-white">Lineups & Roles</h2>
                            <p className="mt-2 text-gray-300">
                                Before each round, managers can freely choose their lineup formation from the available options (e.g., 2-2-1, 1-3-1, etc.). Each team must assign a captain, starting five, and bench players. Lineup roles (Captain, Starter, Bench) can be changed at any time.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-white">Trades & Free Agency</h2>
                            <p className="mt-2 text-gray-300">
                                Unlimited trades are allowed between rounds. Free agents (undrafted or dropped players) can be picked up at any time throughout the season. There are no restrictions based on standings or credits.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-white">Scoring</h2>
                            <p className="mt-2 text-gray-300">
                                The modern scoring system awards fantasy points based on detailed player stats:
                            </p>
                            <ul className="mt-2 list-disc list-inside text-gray-300 space-y-1">
                                <li>+1.15 points per point scored</li>
                                <li>+1.2 points per rebound</li>
                                <li>+1.5 points per assist</li>
                                <li>+2.0 points per block</li>
                                <li>+2.0 points per steal</li>
                                <li>-1.0 point per turnover</li>
                                <li>-1.0 point for each missed field goal</li>
                                <li>-1.0 point for each missed free throw</li>
                                <li>-1.0 point per personal foul</li>
                                <li>+10 bonus points for a double-double</li>
                                <li>+30 bonus points for a triple-double</li>
                            </ul>
                            <p className="mt-4 text-gray-300">
                                Player points are then multiplied based on their role:
                            </p>
                            <ul className="mt-2 list-disc list-inside text-gray-300 space-y-1">
                                <li><strong>Starter:</strong> 100% of fantasy points</li>
                                <li><strong>Bench:</strong> 50%</li>
                                <li><strong>Captain:</strong> 200%</li>
                            </ul>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}

export default RulesPage;
