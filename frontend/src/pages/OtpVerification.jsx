import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FormInput } from '../components/FormInput';
import { Button } from '../components/Button';
import { useAuth } from '../contexts/AuthContext';

export const OtpVerification = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, resendOtp, isLoading } = useAuth();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
      return;
    }

    let timer;
    if (countdown > 0 && !canResend) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, canResend, email, navigate]);

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 6) {
      setOtp(value);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      const response = await verifyOtp(email, otp);
      if (response?.token) {
        // After successful verification, redirect to reset password page
        navigate('/reset-password', { 
          state: { 
            fromOtpVerification: true,
            email: email,
            resetToken: response.token
          },
          replace: true // This will replace the current entry in history
        });
      } else {
        throw new Error('No reset token received');
      }
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    }
  };

  const handleResendOtp = async () => {
    try {
      await resendOtp(email);
      setCountdown(30);
      setCanResend(false);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 to-white py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-600">
            Check your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a password reset OTP to
            <br />
            <span className="font-medium text-gray-900">{email}</span>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <FormInput
              label="Enter OTP"
              type="text"
              value={otp}
              onChange={handleOtpChange}
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              className="text-center text-lg tracking-widest"
              required
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={isLoading || otp.length !== 6}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 transform hover:scale-[1.02] transition-all duration-300"
            >
              Verify OTP
            </Button>
          </div>
        </form>

        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            Didn't receive the email? {!canResend && `Wait ${countdown}s to`} 
            {canResend ? (
              <button
                onClick={handleResendOtp}
                className="font-medium text-sky-600 hover:text-sky-500 transition-colors duration-300 ml-1"
                disabled={!canResend || isLoading}
              >
                Resend OTP
              </button>
            ) : (
              <span className="text-gray-400 ml-1">Resend OTP</span>
            )}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="font-medium text-sky-600 hover:text-sky-500 transition-colors duration-300"
          >
            Back to login
          </button>
        </div>
      </div>
    </motion.div>
  );
};
