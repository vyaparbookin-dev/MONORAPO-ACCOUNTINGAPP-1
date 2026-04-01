import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";
import { dbService } from "../../services/dbService";
import { Eye, EyeOff } from "lucide-react";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const response = await api.post("/api/auth/login", { email: cleanEmail, password });
      
      if (response.success || response.token) {
        // Store auth data securely via dbService
        dbService.setAuthData(response.token, response.user);

        // Redirect to dashboard
        navigate("/");
      }
    } catch (err) {
      console.log("Login Catch Error:", err);
      
      // ROBUST OFFLINE CHECK: Agar server band hai ya internet nahi hai, toh offline bypass on karein
      const isOfflineOrBackendDown = !navigator.onLine || !err.response || err.code === 'ERR_NETWORK' || err.message === "Network Error";
      
      if (isOfflineOrBackendDown) {
        const localUser = dbService.getAuthUser();
        if (localUser && (localUser.email || "").toLowerCase() === cleanEmail) {
          dbService.setAuthData(localUser.token || "offline-token", localUser); // Allow offline session
          navigate("/");
        } else {
          // 🚨 TOTAL OFFLINE BYPASS: Allow ANY email to login when backend is down for testing
          dbService.setAuthData("offline-demo-token", { name: cleanEmail.split('@')[0] || "Offline User", email: cleanEmail, role: "admin" });
          navigate("/");
        }
      } else {
        const errData = err.response?.data?.message || err.response?.data || err;
        if (errData.requiresVerification && errData.userId) {
          alert("Account not verified. Redirecting to OTP verification page...");
          navigate("/verify-otp", { state: { userId: errData.userId } });
        } else {
          setError(errData.message || err.message || "Invalid email or password");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="w-full max-w-md">
        <form onSubmit={handleLogin} className="bg-white shadow-2xl rounded-2xl p-8">
          <h1 className="text-3xl font-bold mb-2 text-center text-gray-800">Red Accounting</h1>
          <p className="text-center text-gray-600 mb-6">Business Accounting Made Easy</p>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="border border-gray-300 w-full p-3 mb-1 rounded-lg focus:outline-none focus:border-blue-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Password</label>
            <div className="relative mb-1">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="border border-gray-300 w-full p-3 pr-12 rounded-lg focus:outline-none focus:border-blue-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition z-10"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full py-3 rounded-lg font-semibold transition disabled:bg-gray-400"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="mt-6 text-center space-y-3">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                Register here
              </Link>
            </p>
            <p className="text-gray-600">
              <Link to="/forgot-password" className="text-blue-600 font-semibold hover:underline">
                Forgot password?
              </Link>
            </p>
          </div>
        </form>

        <div className="mt-6 text-center text-white text-sm">
          <p>Demo Credentials (for testing):</p>
          <p>Email: <code className="bg-blue-700 px-2 py-1 rounded">demo@example.com</code></p>
          <p>Password: <code className="bg-blue-700 px-2 py-1 rounded">password123</code></p>
        </div>
      </div>
    </div>
  );
}
