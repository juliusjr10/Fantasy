import { Navigate } from "react-router-dom";

function RedirectIfAuthenticated({ children }) {
  const user = JSON.parse(localStorage.getItem("user"));
  return user ? <Navigate to="/" /> : children;
}

export default RedirectIfAuthenticated;
