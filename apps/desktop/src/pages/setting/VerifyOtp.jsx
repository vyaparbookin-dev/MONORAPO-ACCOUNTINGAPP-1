import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@repo/shared/src/services/api';

export default function VerifyOtp() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const queryUserId = searchParams.get('userId');
  const queryOtp = searchParams.get('otp');

  // Register पेज से जो userId पास होगी, या Email के link से जो मिलेगी
  const userId = location.state?.userId || queryUserId;

  useEffect(() => {
    if (queryOtp) {
      setOtp(queryOtp); // ईमेल के लिंक से आने पर OTP अपने आप भर जायेगा
    }
  }, [queryOtp]);

  const handleVerify = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!userId) {
      setError("User ID missing. Please register again.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/verify-otp', { userId, otp });
      if (response.success || response.message === "Account verified successfully. You can now log in.") {
        alert("Account Verified Successfully! 🎉 Please login.");
        navigate('/login'); // वेरीफाई होने के बाद सीधे लॉगिन पेज पर भेजें
      }
    } catch (err) {
      setError(err.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-indigo-600">Verify Your Email</h2>
        <p className="text-center text-gray-600 mb-6">
          We have sent a 6-digit OTP to your email. Please enter it below.
        </p>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <input
            type="text"
            maxLength="6"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center tracking-[0.5em] text-xl font-bold"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white p-3 rounded font-bold hover:bg-indigo-700 transition"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}
