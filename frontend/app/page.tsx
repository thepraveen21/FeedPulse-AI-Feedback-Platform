'use client';

import { useState } from 'react';
import { submitFeedback } from '@/lib/api';
import toast from 'react-hot-toast';
import { Send, Loader2, CheckCircle2, ArrowRight, Zap } from 'lucide-react';

const CATEGORIES = [
  { value: 'Bug', icon: '🐛', desc: 'Something is broken' },
  { value: 'Feature Request', icon: '✨', desc: 'New functionality' },
  { value: 'Improvement', icon: '⚡', desc: 'Make it better' },
  { value: 'Other', icon: '💬', desc: 'General feedback' },
];

export default function HomePage() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    submitterName: '',
    submitterEmail: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (form.title.length > 120) e.title = 'Max 120 characters';
    if (!form.description.trim()) e.description = 'Description is required';
    if (form.description.length < 20) e.description = 'Minimum 20 characters required';
    if (!form.category) e.category = 'Please select a category';
    if (form.submitterEmail && !/^\S+@\S+\.\S+$/.test(form.submitterEmail))
      e.submitterEmail = 'Invalid email address';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await submitFeedback(form);
      setSubmitted(true);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-semibold text-white mb-3">Thank you!</h2>
          <p className="text-slate-400 leading-relaxed mb-8">
            Your feedback has been received. Our AI is analysing it and the team will review it shortly.
          </p>
          <button
            onClick={() => {
              setForm({ title: '', description: '', category: '', submitterName: '', submitterEmail: '' });
              setErrors({});
              setSubmitted(false);
            }}
            className="inline-flex items-center gap-2 bg-white text-black font-medium px-6 py-3 rounded-xl hover:bg-slate-100 transition-all"
          >
            Submit another <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between p-12 border-r border-white/5 bg-[#0d0d14]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white text-lg">FeedPulse</span>
        </div>

        <div>
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1 mb-6">
            <div className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
            <span className="text-violet-300 text-xs font-medium">AI-Powered Analysis</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Your feedback<br />shapes the product.
          </h1>
          <p className="text-slate-400 leading-relaxed">
            Share what's on your mind. Our AI instantly categorises, prioritises, and routes your feedback to the right team.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { title: 'Instant AI analysis', desc: 'Gemini analyses your feedback in seconds' },
              { title: 'Priority scoring', desc: 'Automatically scored from 1 to 10' },
              { title: 'Smart categorisation', desc: 'Routed to the right team automatically' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="w-5 h-5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{item.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-xs">
          © 2026 FeedPulse. All rights reserved.
        </p>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-lg">

          {/* Mobile header */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white text-lg">FeedPulse</span>
          </div>

          <h2 className="text-2xl font-semibold text-white mb-1">Share your feedback</h2>
          <p className="text-slate-500 text-sm mb-8">Help us build a better product for you.</p>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Brief summary of your feedback"
                className={`w-full bg-white/[0.03] border ${errors.title ? 'border-red-500/50' : 'border-white/8'} rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/[0.03] transition-all text-sm`}
              />
              <div className="flex justify-between mt-1.5">
                {errors.title ? (
                  <p className="text-red-400 text-xs">{errors.title}</p>
                ) : <span />}
                <p className={`text-xs ml-auto ${form.title.length > 100 ? 'text-amber-400' : 'text-slate-600'}`}>
                  {form.title.length}/120
                </p>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Category <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat.value })}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      form.category === cat.value
                        ? 'bg-violet-500/10 border-violet-500/40 '
                        : 'bg-white/[0.02] border-white/8 hover:border-white/15 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <div>
                      <p className={`text-xs font-medium ${form.category === cat.value ? 'text-violet-300' : 'text-slate-300'}`}>
                        {cat.value}
                      </p>
                      <p className="text-slate-600 text-xs">{cat.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="text-red-400 text-xs mt-1.5">{errors.category}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe your feedback in detail..."
                rows={4}
                className={`w-full bg-white/[0.03] border ${errors.description ? 'border-red-500/50' : 'border-white/8'} rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/[0.03] transition-all resize-none text-sm`}
              />
              <div className="flex justify-between mt-1.5">
                {errors.description ? (
                  <p className="text-red-400 text-xs">{errors.description}</p>
                ) : (
                  <p className="text-slate-600 text-xs">
                    {form.description.length < 20 && form.description.length > 0 && (
                      <span className="text-amber-400">{20 - form.description.length} more characters needed</span>
                    )}
                  </p>
                )}
                <p className="text-slate-600 text-xs ml-auto">{form.description.length} chars</p>
              </div>
            </div>

            {/* Optional fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                  Name <span className="text-slate-600">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.submitterName}
                  onChange={(e) => setForm({ ...form, submitterName: e.target.value })}
                  placeholder="Your name"
                  className="w-full bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                  Email <span className="text-slate-600">(optional)</span>
                </label>
                <input
                  type="email"
                  value={form.submitterEmail}
                  onChange={(e) => setForm({ ...form, submitterEmail: e.target.value })}
                  placeholder="your@email.com"
                  className={`w-full bg-white/[0.03] border ${errors.submitterEmail ? 'border-red-500/50' : 'border-white/8'} rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-all text-sm`}
                />
                {errors.submitterEmail && (
                  <p className="text-red-400 text-xs mt-1">{errors.submitterEmail}</p>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:cursor-not-allowed text-white font-medium py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Feedback
                </>
              )}
            </button>
          </form>

          <p className="text-center text-slate-700 text-xs mt-6">
            Admin?{' '}
            <a href="/admin" className="text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2">
              Sign in to dashboard
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}