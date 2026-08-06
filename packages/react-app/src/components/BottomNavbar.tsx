import { Home, Compass, BarChart3, User, Plus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function BottomNavbar() {
  const location = useLocation();

  const isActive = (route: string) => {
    if (route === "/") return location.pathname === "/";
    return location.pathname.startsWith(route);
  };

  const navItems = [
    { to: "/", icon: Home, label: "Home" },
    { to: "/explore", icon: Compass, label: "Explore" },
    { to: "/streams", icon: BarChart3, label: "Streams" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <>
      {/* FAB -- Support button */}
      <Link
        to="/trust"
        className="fixed bottom-24 right-5 z-50 w-14 h-14 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center shadow-lg shadow-green-600/30 transition-colors"
      >
        <Plus className="h-6 w-6 text-white" />
      </Link>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-t2-card/95 backdrop-blur-sm border-t border-t2-border z-50">
        <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 ${
                isActive(to)
                  ? "text-green-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-colors ${
                  isActive(to) ? "bg-green-600 text-white" : ""
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
