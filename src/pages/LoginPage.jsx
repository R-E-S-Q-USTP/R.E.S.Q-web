import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Flame, AlertCircle } from "lucide-react";
import SystemStatus from "../components/SystemStatus";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      navigate("/dashboard");
    } catch (error) {
      setError(
        error.message || "Failed to sign in. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-8">
        {/* Left Side - Branding & Info */}
        <div className="flex flex-col justify-center space-y-6">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-600 p-3 rounded-xl">
              <Flame className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">R.E.S.Q.</h1>
              <p className="text-slate-600 dark:text-slate-400">
                Rapid Emergency Surveillance & Quenching
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Fire Incident Monitoring System
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Real-time IoT-based fire detection and response system for Cagayan
              de Oro City. Powered by advanced ML image detection (YOLOv8) and
              IoT sensors.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">24/7</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Monitoring</p>
              </div>
              <div className="text-center p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">Real-time</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Alerts</p>
              </div>
            </div>
          </div>

          <SystemStatus />
        </div>

        {/* Right Side - Login Form */}
        <div className="flex items-center">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-8 w-full">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Sign In
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Access the fire monitoring dashboard
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    Sign In Failed
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  Email / Station Name
                </label>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="Enter your email or station name"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary py-3 text-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Bureau of Fire Protection - Cagayan de Oro City
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
