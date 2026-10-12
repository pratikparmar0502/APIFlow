import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Workflow, Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signup, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!email.trim() || !password) {
      setFormError('Email and password are required');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    try {
      await signup({
        name: name.trim() || undefined,
        email: email.trim(),
        password,
      });
      navigate('/', { replace: true });
    } catch {
      // Error will be set in useAuthStore
    }
  };

  const displayError = formError || error;

  return (
    <div className="min-h-screen bg-[#0B0B0D] flex flex-col justify-center items-center px-4 select-none">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#F5D90A] flex items-center justify-center text-[#0B0B0D] shadow-lg shadow-[#F5D90A]/10 mb-3">
            <Workflow className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">Create an Account</h1>
          <p className="text-sm text-neutral-400 mt-1">Join APIFlow and streamline your API testing</p>
        </div>

        {/* Card */}
        <div className="bg-[#111114] border border-[#26262B] rounded-xl p-7 shadow-2xl">
          {displayError && (
            <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-400 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 uppercase tracking-wider">
                Full Name (Optional)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  disabled={isLoading}
                  className="w-full bg-[#18181C] border border-[#2E2E33] focus:border-[#F5D90A] focus:outline-none rounded-lg pl-9 pr-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@apiflow.io"
                  required
                  disabled={isLoading}
                  className="w-full bg-[#18181C] border border-[#2E2E33] focus:border-[#F5D90A] focus:outline-none rounded-lg pl-9 pr-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  disabled={isLoading}
                  className="w-full bg-[#18181C] border border-[#2E2E33] focus:border-[#F5D90A] focus:outline-none rounded-lg pl-9 pr-10 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  disabled={isLoading}
                  className="w-full bg-[#18181C] border border-[#2E2E33] focus:border-[#F5D90A] focus:outline-none rounded-lg pl-9 pr-10 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-[#F5D90A] hover:bg-[#FFE629] text-[#0B0B0D] font-semibold rounded-lg py-2.5 text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#26262B] text-center text-xs text-neutral-400">
            Already have an account?{' '}
            <Link to="/login" className="text-[#F5D90A] hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-neutral-600 mt-6 font-mono">
          Zero-trust infrastructure &bull; Encrypted credentials
        </p>
      </div>
    </div>
  );
};
