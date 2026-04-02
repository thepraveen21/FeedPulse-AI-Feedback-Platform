'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAdmin } from '@/lib/api';
import toast from 'react-hot-toast';
import { Zap, Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email.trim()) e.email = 'Email is required';
    if (!form.password.trim()) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await loginAdmin(form.email, form.password);
      if (res.success && res.data?.token) {
        localStorage.setItem('feedpulse_token', res.data.token);
        toast.success('Welcome back!');
        router.push('/dashboard');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">

      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#0d0d14] border-r border-white/5 flex-col items-center justify-center p-16">

        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-sm text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-16">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-600/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-white text-xl tracking-tight">FeedPulse</span>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { label: 'Feedback analysed', value: '2,400+' },
              { label: 'Avg response time', value: '< 2s' },
              { label: 'Accuracy rate', value: '98.2%' },
              { label: 'Teams using', value: '140+' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/[0.03] border border-white/8 rounded-2xl p-4 text-left"
              >
                <p className="text-2xl font-semibold text-white mb-1">{stat.value}</p>
                <p className="text-slate-500 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>

          <p className="text-slate-500 text-sm leading-relaxed">
            Manage your product feedback pipeline from one powerful dashboard.
          </p>
        </div>
      </div>

      {/* Right panel — Login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white text-lg">FeedPulse</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-white mb-2 tracking-tight">
              Welcome back
            </h1>
            <p className="text-slate-500 text-sm">
              Sign in to your admin dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Email address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@feedpulse.com"
                className={`w-full bg-white/[0.03] border ${
                  errors.email ? 'border-red-500/40' : 'border-white/8'
                } rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/[0.03] transition-all text-sm`}
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1.5">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••••••"
                  className={`w-full bg-white/[0.03] border ${
                    errors.password ? 'border-red-500/40' : 'border-white/8'
                  } rounded-xl px-4 py-3 pr-11 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/[0.03] transition-all text-sm`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1.5">{errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:cursor-not-allowed text-white font-medium py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm mt-2 shadow-lg shadow-violet-600/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Credentials hint */}
          <div className="mt-6 p-4 bg-white/[0.02] border border-white/8 rounded-xl">
            <p className="text-slate-500 text-xs mb-2 font-medium uppercase tracking-wider">
              Demo credentials
            </p>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-xs">Email</span>
                <code className="text-slate-400 text-xs font-mono bg-white/5 px-2 py-0.5 rounded">
                  admin@feedpulse.com
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-xs">Password</span>
                <code className="text-slate-400 text-xs font-mono bg-white/5 px-2 py-0.5 rounded">
                  admin123456
                </code>
              </div>
            </div>
          </div>

          {/* Back link */}
          <p className="text-center text-slate-700 text-xs mt-6">
            <a
              href="/"
              className="text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2"
            >
              Back to feedback form
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}