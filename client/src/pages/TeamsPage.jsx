import ModeCard from "../components/ModeCard";

function TeamsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800 flex flex-col items-center justify-center text-white p-6">
      <h1 className="text-4xl font-bold mb-10">Create Your Fantasy Team</h1>

      <div className="grid gap-6 sm:grid-cols-2 w-full max-w-2xl">
        <ModeCard
          title="Budget Mode"
          icon="💰"
          route="/team/budget"
          description="You have a fixed budget. Pick players wisely within the limit!"
        />
        <ModeCard
          title="Draft Mode"
          icon="📝"
          route="/team/draft"
          description="Draft players one by one. Compete with others in turn-based selection."
        />
      </div>
    </div>
  );
}

export default TeamsPage;
