import { useNavigate } from "react-router-dom";

function ModeCard({ title, description, icon, route }) {
  const navigate = useNavigate();

  return (
    <div
      className="cursor-pointer bg-gray-800 hover:bg-gray-700 rounded-2xl p-6 shadow-xl transition"
      onClick={() => navigate(route)}
    >
      <h2 className="text-2xl font-semibold mb-2">
        {icon} {title}
      </h2>
      <p className="text-gray-300">{description}</p>
    </div>
  );
}

export default ModeCard;
