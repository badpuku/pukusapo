const LogoutButton = () => {
  const handleLogout = async () => {
    window.location.href = "/logout";
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center justify-center px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition duration-200"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        fill="currentColor"
        className="mr-2 bi bi-box-arrow-right"
        viewBox="0 0 16 16"
      >
        <path
          fillRule="evenodd"
          d="M10.5 10.5a.5.5 0 0 1-.5-.5V9H1.5a.5.5 0 0 1 0-1h8.5V5.5a.5.5 0 0 1 1 0v4.5a.5.5 0 0 1-.5.5z"
        />
        <path
          fillRule="evenodd"
          d="M15.854 8.146a.5.5 0 0 1 0 .708l-2.5 2.5a.5.5 0 0 1-.708-.708L14.793 8l-2.147-2.146a.5.5 0 1 1 .708-.708l2.5 2.5z"
        />
      </svg>
      Logout
    </button>
  );
};

export default LogoutButton;
