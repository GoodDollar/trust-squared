import { Home, Users, BarChart3, Heart, Settings, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

export default function BottomNavbar() {
  const location = useLocation();
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const { disconnect } = useDisconnect();
  const { handleLogOut } = useDynamicContext();

  const isActive = (route: string) => {
    if (route === "/") {
      return location.pathname === "/";
    }
    if (route === "/trust") {
      return location.pathname === "/trust";
    }
    return location.pathname.startsWith(route);
  };

  const handleLogout = async () => {
    try {
      disconnect();
      await handleLogOut();
      setShowLogoutMenu(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-6 px-4">
      <div className="bg-gray-800 rounded-2xl px-4 py-3 shadow-lg">
        <div className="flex items-center gap-4">
          {/* Home */}
          <Link
            to="/"
            className={`p-3 rounded-full transition-all duration-200 ${
              isActive("/")
                ? 'bg-green-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Home className="h-5 w-5" />
          </Link>

          {/* Dashboard */}
          <Link
            to="/dashboard"
            className={`p-3 rounded-full transition-all duration-200 ${
              isActive("/dashboard")
                ? 'bg-green-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <BarChart3 className="h-5 w-5" />
          </Link>

          {/* QR Scan Button */}
          <Link
            to="/trust"
            className={`p-3 rounded-full transition-all duration-200 ${
              isActive("/trust")
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="grid grid-cols-3 gap-0.5">
                <div className="w-1 h-1 bg-white rounded-sm"></div>
                <div className="w-1 h-1 bg-white rounded-sm"></div>
                <div className="w-1 h-1 bg-white rounded-sm"></div>
                <div className="w-1 h-1 bg-white rounded-sm"></div>
                <div className="w-1 h-1 bg-transparent"></div>
                <div className="w-1 h-1 bg-white rounded-sm"></div>
                <div className="w-1 h-1 bg-white rounded-sm"></div>
                <div className="w-1 h-1 bg-white rounded-sm"></div>
                <div className="w-1 h-1 bg-white rounded-sm"></div>
              </div>
            </div>
          </Link>

          {/* History
          <Link
            to="/history"
            className={`p-3 rounded-full transition-all duration-200 ${
              isActive("/history")
                ? 'bg-green-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Users className="h-5 w-5" />
          </Link> */}

          {/* Trustees */}
          <Link
            to="/trustees"
            className={`p-3 rounded-full transition-all duration-200 ${
              isActive("/trustees")
                ? 'bg-green-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Heart className="h-5 w-5" />
          </Link>

          {/* Settings with Logout Dropdown */}
          <div className="relative">
            <button
              className={`p-3 rounded-full transition-all duration-200 ${
                showLogoutMenu 
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              onClick={() => setShowLogoutMenu(!showLogoutMenu)}
            >
              <Settings className="h-5 w-5" />
            </button>

            {/* Logout Dropdown */}
            {showLogoutMenu && (
              <div className="absolute right-0 bottom-full mb-2 bg-gray-700 rounded-lg shadow-lg border border-gray-600 min-w-[150px] z-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-white hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showLogoutMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowLogoutMenu(false)}
        />
      )}
    </div>
  );
}