import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { Shield, Phone } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'farmer',
    phone: '',
    otp: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, message: '', color: '' });

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    let score = 0;
    let message = '';
    let color = '';

    if (password.length >= minLength) score++;
    if (hasUpperCase) score++;
    if (hasLowerCase) score++;
    if (hasNumber) score++;
    if (hasSpecialChar) score++;

    if (score === 0) {
      message = 'Very Weak';
      color = 'text-red-600';
    } else if (score <= 2) {
      message = 'Weak';
      color = 'text-orange-600';
    } else if (score === 3) {
      message = 'Fair';
      color = 'text-yellow-600';
    } else if (score === 4) {
      message = 'Good';
      color = 'text-blue-600';
    } else {
      message = 'Strong';
      color = 'text-green-600';
    }

    return { score, message, color };
  };

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password });
    if (password) {
      setPasswordStrength(validatePassword(password));
    } else {
      setPasswordStrength({ score: 0, message: '', color: '' });
    }
  };

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async () => {
    setError('');
    
    // Validate required fields
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      setError('Please fill all required fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate password strength
    if (passwordStrength.score < 3) {
      setError('Password is too weak. Please use at least 8 characters with uppercase, lowercase, and numbers.');
      return;
    }

    // Normalize phone number - add +91 if not present
    let normalizedPhone = formData.phone.trim();
    if (!normalizedPhone.startsWith('+')) {
      // Remove any leading zeros
      normalizedPhone = normalizedPhone.replace(/^0+/, '');
      // Add +91 for Indian numbers
      normalizedPhone = '+91' + normalizedPhone;
    }

    // Validate phone number format (10 digits for India)
    if (!normalizedPhone.match(/^\+91[6-9]\d{9}$/)) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setLoading(true);
    try {
      await apiService.sendOTP({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: normalizedPhone,
      });
      
      // Update form data with normalized phone
      setFormData({ ...formData, phone: normalizedPhone });
      
      setOtpSent(true);
      setShowOTPInput(true);
      startCountdown();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.verifyOTP({
        email: formData.email,
        otp: formData.otp,
      });
      
      // Redirect based on role
      const roleRoutes: Record<string, string> = {
        farmer: '/farmer',
        buyer: '/buyer',
        transporter: '/transporter',
        storage: '/storage',
        admin: '/admin',
      };
      navigate(roleRoutes[response.user.role] || '/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const response = await apiService.login(formData.email, formData.password);
        sessionStorage.setItem('token', response.token);
        sessionStorage.setItem('user', JSON.stringify(response.user));
        
        // Redirect based on role
        const roleRoutes: Record<string, string> = {
          farmer: '/farmer',
          buyer: '/buyer',
          transporter: '/transporter',
          storage: '/storage',
          admin: '/admin',
        };
        navigate(roleRoutes[response.user.role] || '/');
      } else {
        // For registration, use OTP flow
        if (!showOTPInput) {
          await handleSendOTP();
        } else {
          await handleVerifyOTP();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const resetRegistration = () => {
    setShowOTPInput(false);
    setOtpSent(false);
    setFormData({ ...formData, otp: '' });
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600">Krishi Era AI</h1>
          <p className="text-gray-600 mt-2">Agricultural Intelligence Platform</p>
        </div>

        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => {
              setIsLogin(true);
              resetRegistration();
            }}
            className={`flex-1 py-2 rounded-md transition ${
              isLogin ? 'bg-white shadow' : 'text-gray-600'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              resetRegistration();
            }}
            className={`flex-1 py-2 rounded-md transition ${
              !isLogin ? 'bg-white shadow' : 'text-gray-600'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        {!isLogin && otpSent && !showOTPInput && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            OTP sent successfully! Check your phone.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && !showOTPInput && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="farmer">Farmer</option>
                  <option value="buyer">Buyer</option>
                  <option value="transporter">Transporter</option>
                  <option value="storage">Storage Provider</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="9876543210"
                    maxLength={10}
                    pattern="[6-9][0-9]{9}"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter 10-digit mobile number (country code +91 will be added automatically)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="your@email.com"
                />
                <p className="text-xs text-gray-500 mt-1">OTP will be sent to this email</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter password"
                  minLength={8}
                />
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Password Strength:</span>
                      <span className={`text-xs font-medium ${passwordStrength.color}`}>
                        {passwordStrength.message}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          passwordStrength.score <= 2 ? 'bg-red-500' :
                          passwordStrength.score === 3 ? 'bg-yellow-500' :
                          passwordStrength.score === 4 ? 'bg-blue-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Use 8+ characters with uppercase, lowercase, numbers & symbols
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {!isLogin && showOTPInput && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <Shield className="h-5 w-5 text-blue-600 mr-2" />
                  <p className="text-sm font-medium text-blue-900">Verify Your Email</p>
                </div>
                <p className="text-xs text-blue-700">
                  We've sent a 6-digit OTP to {formData.email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter OTP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={formData.otp}
                  onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={countdown > 0 || loading}
                  className="text-green-600 hover:text-green-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                </button>
                <button
                  type="button"
                  onClick={resetRegistration}
                  className="text-gray-600 hover:text-gray-700"
                >
                  Change Email
                </button>
              </div>
            </div>
          )}

          {isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter password"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : 
             isLogin ? 'Login' : 
             showOTPInput ? 'Verify & Register' : 
             'Send OTP'}
          </button>
        </form>

        {isLogin && (
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-gray-600 mb-2">Test Account:</p>
            <p className="text-xs text-gray-500">Email: test@example.com</p>
            <p className="text-xs text-gray-500">Password: password123</p>
          </div>
        )}

        {!isLogin && !showOTPInput && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-md border border-yellow-200">
            <p className="text-xs text-yellow-800">
              <Shield className="h-3 w-3 inline mr-1" />
              Your email will be verified via OTP for security
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

