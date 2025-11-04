import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAlerts } from "../contexts/AlertContext";
import {
  LayoutDashboard,
  Camera,
  Radio,
  Map,
  FileText,
  Bell,
  BarChart3,
  Settings,
  Wrench,
  LogOut,
  Flame,
  AlertCircle,
} from "lucide-react";

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { unacknowledgedCount } = useAlerts();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const primaryNavItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/analytics", icon: BarChart3, label: "Analytics" },
    { path: "/map", icon: Map, label: "Map" },
    { path: "/incidents", icon: FileText, label: "Incidents" },
    {
      path: "/alerts",
      icon: Bell,
      label: "Alerts",
      badge: unacknowledgedCount,
    },
  ];

  const secondaryNavItems = [
    { path: "/cameras", icon: Camera, label: "Cameras" },
    { path: "/sensors", icon: Radio, label: "Sensors" },
  ];

  const adminNavItems = [
    { path: "/settings", icon: Settings, label: "Settings" },
    { path: "/maintenance", icon: Wrench, label: "Maintenance" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <Flame className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="text-xl font-bold text-slate-900">R.E.S.Q.</h1>
                <p className="text-xs text-slate-500">Fire Monitoring System</p>
              </div>
            </div>

            {/* Primary Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {primaryNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors relative ${
                    isActive(item.path)
                      ? "bg-primary-50 text-primary-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">
                  {profile?.full_name || "User"}
                </p>
                <p className="text-xs text-slate-500">{profile?.role}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Secondary Navigation Bar */}
      <div className="bg-slate-100 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center space-x-1">
              {secondaryNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive(item.path)
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {profile?.role === "Admin" && (
              <div className="flex items-center space-x-1">
                {adminNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      isActive(item.path)
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Alert Banner (if unacknowledged alerts exist) */}
      {unacknowledgedCount > 0 && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 alert-pulse">
          <AlertCircle className="w-6 h-6" />
          <div>
            <p className="font-bold">
              {unacknowledgedCount} Unacknowledged Alert
              {unacknowledgedCount > 1 ? "s" : ""}
            </p>
            <p className="text-sm">Click to view and respond</p>
          </div>
          <Link
            to="/alerts"
            className="ml-4 bg-white text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors"
          >
            View Alerts
          </Link>
        </div>
      )}
    </div>
  );
};

export default Layout;
