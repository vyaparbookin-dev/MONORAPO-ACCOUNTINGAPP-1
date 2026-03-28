import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../services/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/api/auth/login", { email, password });
      
      if (response.success || response.token) {
        // Store token in localStorage
        localStorage.setItem("authToken", response.token);
        
        // Optionally store user info
        if (response.user) {
          localStorage.setItem("user", JSON.stringify(response.user));
        }

        // Redirect to dashboard
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Invalid email or password");
      console.error("Login error:", err);
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
            <input
              type="password"
              placeholder="Enter your password"
              className="border border-gray-300 w-full p-3 mb-1 rounded-lg focus:outline-none focus:border-blue-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
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
