'use client';

import { useState } from 'react';
import { submitFeedback } from '@/lib/api';
import toast from 'react-hot-toast';
import { Send, Loader2, CheckCircle2, Zap } from 'lucide-react';

const CATEGORIES = ['Bug', 'Feature Request', 'Improvement', 'Other'];

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
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (form.title.length > 120) newErrors.title = 'Title cannot exceed 120 characters';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (form.description.length < 20) newErrors.description = 'Description must be at least 20 characters';
    if (!form.category) newErrors.category = 'Please select a category';
    if (form.submitterEmail && !/^\S+@\S+\.\S+$/.test(form.submitterEmail)) {
      newErrors.submitterEmail = 'Please enter a valid email';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await submitFeedback(form);
      setSubmitted(true);
      toast.success('Feedback submitted successfully!');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({
      title: '',
      description: '',
      category: '',
      submitterName: '',
      submitterEmail: '',
    });
    setErrors({});
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-10 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Thank you!</h2>
          <p className="text-slate-300 mb-6">
            Your feedback has been submitted and our AI is analysing it right now.
          </p>
          <button
            onClick={handleReset}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 w-full"
          >
            Submit another feedback
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Zap className="w-7 h-7 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">FeedPulse</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Share your feedback — our AI will analyse and prioritise it instantly
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Brief summary of your feedback"
                className={`w-full bg-white/10 border ${errors.title ? 'border-red-400' : 'border-white/20'} rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
              />
              {errors.title && (
                <p className="text-red-400 text-xs mt-1">{errors.title}</p>
              )}
              <p className="text-slate-500 text-xs mt-1 text-right">
                {form.title.length}/120
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Category <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setForm({ ...form, category: cat })}
                    className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200 border ${
                      form.category === cat
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {errors.category && (
                <p className="text-red-400 text-xs mt-1">{errors.category}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe your feedback in detail (minimum 20 characters)"
                rows={4}
                className={`w-full bg-white/10 border ${errors.description ? 'border-red-400' : 'border-white/20'} rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none`}
              />
              {errors.description && (
                <p className="text-red-400 text-xs mt-1">{errors.description}</p>
              )}
              <p className="text-slate-500 text-xs mt-1 text-right">
                {form.description.length} chars
                {form.description.length < 20 && form.description.length > 0 && (
                  <span className="text-amber-400 ml-1">
                    ({20 - form.description.length} more needed)
                  </span>
                )}
              </p>
            </div>

            {/* Optional fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Name <span className="text-slate-500 text-xs">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.submitterName}
                  onChange={(e) => setForm({ ...form, submitterName: e.target.value })}
                  placeholder="Your name"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Email <span className="text-slate-500 text-xs">(optional)</span>
                </label>
                <input
                  type="email"
                  value={form.submitterEmail}
                  onChange={(e) => setForm({ ...form, submitterEmail: e.target.value })}
                  placeholder="your@email.com"
                  className={`w-full bg-white/10 border ${errors.submitterEmail ? 'border-red-400' : 'border-white/20'} rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all`}
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
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-2"
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
        </div>

        {/* Admin link */}
        <p className="text-center text-slate-600 text-xs mt-6">
          Are you an admin?{' '}
          <a href="/admin" className="text-purple-400 hover:text-purple-300 transition-colors">
            Go to dashboard
          </a>
        </p>
      </div>
    </main>
  );
}