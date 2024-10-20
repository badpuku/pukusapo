import { useNavigate } from "@remix-run/react";
import { ROUTES } from "~/constants/routes";

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    navigate(ROUTES.LOGOUT);
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-300"
    >
      ログアウト
    </button>
  );
};

export default LogoutButton;
