import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FormInput } from '../components/FormInput';
import { Button } from '../components/Button';
import { motion } from 'framer-motion';

export const ResetPassword = () => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const { resetPassword, isLoading } = useAuth();

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      if (!location.state?.fromOtpVerification || !location.state?.resetToken) {
        navigate('/forgot-password');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [location.state, navigate]);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      navigate('/forgot-password');
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
    if (error) setError('');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.oldPassword) {
      newErrors.oldPassword = 'Current password is required';
    }

    if (!formData.password) {
      newErrors.password = 'New password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'New password must be at least 6 characters';
    } else if (formData.password === formData.oldPassword) {
      newErrors.password = 'New password must be different from current password';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const resetToken = location.state?.resetToken;
    if (!resetToken) {
      setError('Invalid reset token');
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    try {
      await resetPassword(resetToken, formData.password);
      setSuccess(true);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Password Reset Successful
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
            <div className="mt-6">
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in to your account
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 to-white py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-600">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter your current password and choose a new password below.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <FormInput
              label="Current Password"
              type="password"
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleChange}
              error={errors.oldPassword}
              placeholder="Enter your current password"
              required
              className="transition-all duration-300 focus:ring-2 focus:ring-sky-500"
            />
            
            <FormInput
              label="New Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Enter your new password"
              required
              className="transition-all duration-300 focus:ring-2 focus:ring-sky-500"
            />
            
            <FormInput
              label="Confirm New Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="Confirm your new password"
              required
              className="transition-all duration-300 focus:ring-2 focus:ring-sky-500"
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
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 transform hover:scale-[1.02] transition-all duration-300"
            >
              Reset Password
            </Button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="font-medium text-sky-600 hover:text-sky-500 transition-colors duration-300"
            >
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </motion.div>
  );
};
