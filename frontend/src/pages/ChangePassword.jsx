import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FormInput } from '../components/FormInput';
import { Button } from '../components/Button';
import { authService } from '../services/authService';

export const ChangePassword = () => {
  const [formData, setFormData] = useState({
    loginId: '',
    oldPassword: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const location = useLocation();
  

  // Get loginId from URL params or location state
  React.useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const loginIdFromUrl = urlParams.get('loginId');
    if (loginIdFromUrl) {
      setFormData(prev => ({ ...prev, loginId: loginIdFromUrl }));
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.loginId.trim()) {
      newErrors.loginId = 'Login ID is required';
    }
    // Require either old password or otp
    if (!formData.oldPassword.trim() && !formData.otp.trim()) {
      newErrors.oldPassword = 'Old Password or OTP is required';
    }
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'New Password is required';
    }
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirm Password is required';
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      newErrors.newPassword = 'New Password must be at least 6 characters';
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setApiError(null);
      setIsLoading(true);

      // If OTP is provided, use it as the oldPassword
      const oldPasswordToUse = formData.otp.trim() ? formData.otp.trim() : formData.oldPassword.trim();

      await authService.changePassword(
        formData.loginId.trim(),
        oldPasswordToUse,
        formData.newPassword.trim()
      );

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setApiError(err?.message || 'Failed to change password. Try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Password Changed Successfully
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Your password has been updated successfully. You can now sign in with your new password.
            </p>
            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-700 to-blue-500 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">

          <div className="flex items-center mb-6">
            <Link to="/login" className="flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Change Password</h2>
          <p className="text-sm text-gray-600 mb-8">
            Enter your login details and new password
          </p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <FormInput
              label="Login ID"
              type="text"
              name="loginId"
              value={formData.loginId}
              onChange={handleChange}
              error={errors.loginId}
              placeholder="Enter your login ID"
              required
            />

            <FormInput
              label="Old Password"
              type="password"
              name="oldPassword"
              value={formData.oldPassword}
              onChange={handleChange}
              error={errors.oldPassword}
              placeholder="Enter your old password"
              required
            />

            <div className="text-sm text-gray-500">If you received an OTP via email, you can enter it below instead of your old password.</div>

            <FormInput
              label="OTP (optional)"
              type="text"
              name="otp"
              value={formData.otp}
              onChange={handleChange}
              error={errors.otp}
              placeholder="Enter the OTP from your email"
            />

            <FormInput
              label="New Password"
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              error={errors.newPassword}
              placeholder="Enter your new password"
              required
            />

            <FormInput
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="Confirm your new password"
              required
            />

            {apiError && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{apiError}</div>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Changing Password...' : 'Change Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
