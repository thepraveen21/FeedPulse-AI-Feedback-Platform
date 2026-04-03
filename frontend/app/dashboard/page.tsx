'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAllFeedback,
  updateFeedbackStatus,
  deleteFeedback,
  reanalyzeFeedback,
  getAISummary,
  Feedback,
} from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Zap,
  LogOut,
  Search,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  SlidersHorizontal,
  Tag,
} from 'lucide-react';

const CATEGORIES = ['All', 'Bug', 'Feature Request', 'Improvement', 'Other'];
const STATUSES = ['All', 'New', 'In Review', 'Resolved'];
const SORTS = [
  { label: 'Newest first', value: 'createdAt', order: 'desc' },
  { label: 'Oldest first', value: 'createdAt', order: 'asc' },
  { label: 'Highest priority', value: 'ai_priority', order: 'desc' },
  { label: 'Lowest priority', value: 'ai_priority', order: 'asc' },
];

const sentimentConfig: Record<string, { color: string; dot: string }> = {
  Positive: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
  Neutral: { color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', dot: 'bg-slate-400' },
  Negative: { color: 'bg-red-500/10 text-red-400 border-red-500/20', dot: 'bg-red-400' },
};

const statusConfig: Record<string, { color: string; dot: string }> = {
  New: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-400' },
  'In Review': { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-400' },
  Resolved: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
};

const categoryConfig: Record<string, string> = {
  Bug: 'bg-red-500/10 text-red-400 border-red-500/20',
  'Feature Request': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  Improvement: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Other: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const priorityColor = (p: number) => {
  if (p >= 8) return 'text-red-400';
  if (p >= 5) return 'text-amber-400';
  return 'text-emerald-400';
};

const priorityBg = (p: number) => {
  if (p >= 8) return 'bg-red-500/10 border-red-500/20';
  if (p >= 5) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-emerald-500/10 border-emerald-500/20';
};

export default function DashboardPage() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [sortIndex, setSortIndex] = useState(0);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [aiSummary, setAiSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const sort = SORTS[sortIndex];
      const res = await getAllFeedback({
        page,
        limit: 10,
        category: category === 'All' ? undefined : category,
        status: status === 'All' ? undefined : status,
        sort: sort.value,
        order: sort.order,
        search: search || undefined,
      });
      if (res.success) {
        setFeedbacks(res.data.feedbacks);
        setTotalPages(res.data.pagination.totalPages);
        setTotal(res.data.pagination.total);
      }
    } catch {
      toast.error('Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  }, [page, category, status, sortIndex, search]);

  useEffect(() => {
    const token = localStorage.getItem('feedpulse_token');
    if (!token) { router.push('/admin'); return; }
    fetchFeedbacks();
  }, [fetchFeedbacks, router]);

  const handleLogout = () => {
    localStorage.removeItem('feedpulse_token');
    router.push('/admin');
    toast.success('Logged out');
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setActionLoading(id);
    try {
      await updateFeedbackStatus(id, newStatus);
      toast.success('Status updated');
      fetchFeedbacks();
      if (selectedFeedback?._id === id) {
        setSelectedFeedback((prev) =>
          prev ? { ...prev, status: newStatus as Feedback['status'] } : null
        );
      }
    } catch { toast.error('Failed to update status'); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this feedback?')) return;
    setActionLoading(id);
    try {
      await deleteFeedback(id);
      toast.success('Deleted');
      fetchFeedbacks();
      if (selectedFeedback?._id === id) setSelectedFeedback(null);
    } catch { toast.error('Failed to delete'); }
    finally { setActionLoading(null); }
  };

  const handleReanalyze = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await reanalyzeFeedback(id);
      toast.success('Reanalysis complete');
      fetchFeedbacks();
      if (selectedFeedback?._id === id) setSelectedFeedback(res.data);
    } catch { toast.error('Reanalysis failed'); }
    finally { setActionLoading(null); }
  };

const handleGetSummary = async () => {
  setSummaryLoading(true);
  try {
    const res = await getAISummary();
    setAiSummary(res.data.summary);
  } catch {
    toast.error('Failed to get summary');
  } finally {
    setSummaryLoading(false);
  }
};

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const newCount = feedbacks.filter((f) => f.status === 'New').length;
  const avgPriority = feedbacks.filter((f) => f.ai_priority).length > 0
    ? (feedbacks.filter((f) => f.ai_priority).reduce((a, f) => a + (f.ai_priority || 0), 0) /
      feedbacks.filter((f) => f.ai_priority).length).toFixed(1)
    : 'N/A';
  const allTags = feedbacks.flatMap((f) => f.ai_tags || []);
  const tagFreq = allTags.reduce<Record<string, number>>((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1; return acc;
  }, {});
  const topTag = Object.entries(tagFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-outfit">

      {/* Navbar */}
      <nav className="border-b border-white/5 bg-[#0d0d14]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-white tracking-tight">FeedPulse</span>
            <span className="hidden sm:block w-px h-4 bg-white/10" />
            <span className="hidden sm:block text-slate-500 text-sm">Admin Dashboard</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Total feedback',
              value: total,
              icon: <MessageSquare className="w-4 h-4" />,
              color: 'text-violet-400',
              bg: 'bg-violet-500/10',
            },
            {
              label: 'Open items',
              value: newCount,
              icon: <AlertCircle className="w-4 h-4" />,
              color: 'text-blue-400',
              bg: 'bg-blue-500/10',
            },
            {
              label: 'Avg priority',
              value: avgPriority,
              icon: <TrendingUp className="w-4 h-4" />,
              color: 'text-amber-400',
              bg: 'bg-amber-500/10',
            },
            {
              label: 'Top tag',
              value: topTag,
              icon: <Tag className="w-4 h-4" />,
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/10',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all"
            >
              <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center ${stat.color} mb-3`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-semibold text-white tracking-tight truncate">{stat.value}</p>
              <p className="text-slate-500 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* AI Summary */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-violet-500/10 rounded-lg flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">AI Weekly Summary</p>
                <p className="text-slate-500 text-xs">Top themes from the last 7 days</p>
              </div>
            </div>
            <button
              onClick={handleGetSummary}
              disabled={summaryLoading}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:cursor-not-allowed text-white text-xs font-medium px-3 py-2 rounded-lg transition-all"
            >
              {summaryLoading ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              Generate
            </button>
          </div>
         {aiSummary ? (
  <div className="space-y-4">
    {aiSummary.split('\n\n').map((block, i) => {
      const isHeading = block.startsWith('TOP 3') || block.startsWith('OVERALL');
      const isNumbered = /^\d\./.test(block.trim());

      if (isHeading) {
        return (
          <p key={i} className="text-xs font-semibold text-violet-400 uppercase tracking-widest">
            {block.trim()}
          </p>
        );
      }

      if (isNumbered) {
        const lines = block.trim().split('\n');
        const title = lines[0];
        const body = lines.slice(1).join(' ');
        return (
          <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
            <p className="text-sm font-semibold text-white mb-1">{title}</p>
            {body && <p className="text-sm text-slate-400 leading-relaxed">{body}</p>}
          </div>
        );
      }

      return (
        <p key={i} className="text-sm text-slate-400 leading-relaxed">
          {block.trim()}
        </p>
      );
    })}
  </div>
) : (
  <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-4">
    <Sparkles className="w-4 h-4 text-slate-600 shrink-0" />
    <p className="text-slate-600 text-sm">
      Click Generate to get AI insights on the last 7 days of feedback.
    </p>
  </div>
)}
        </div>

        {/* Search + Filters */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-6">
          <div className="flex gap-3">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search feedback..."
                  className="w-full bg-white/[0.03] border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/30 transition-all"
                />
              </div>
              <button
                type="submit"
                className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              >
                Search
              </button>
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
                  className="bg-white/5 hover:bg-white/10 text-slate-400 px-3 py-2.5 rounded-xl transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                showFilters
                  ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                  : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:block">Filters</span>
            </button>
          </div>

          {/* Filter dropdowns */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-white/5">
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-violet-500/30 transition-all"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-slate-900">{c}</option>
                ))}
              </select>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-violet-500/30 transition-all"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-slate-900">{s}</option>
                ))}
              </select>
              <select
                value={sortIndex}
                onChange={(e) => { setSortIndex(Number(e.target.value)); setPage(1); }}
                className="bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-violet-500/30 transition-all"
              >
                {SORTS.map((s, i) => (
                  <option key={i} value={i} className="bg-slate-900">{s.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden mb-4">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex items-center gap-3 text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading feedback...</span>
              </div>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-slate-600" />
              </div>
              <p className="text-slate-500 text-sm">No feedback found</p>
              <p className="text-slate-600 text-xs mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Title</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Sentiment</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-5 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {feedbacks.map((fb) => (
                    <tr
                      key={fb._id}
                      onClick={() => setSelectedFeedback(fb)}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors truncate max-w-[180px]">
                          {fb.title}
                        </p>
                        {fb.ai_summary && (
                          <p className="text-xs text-slate-600 truncate max-w-[180px] mt-0.5">
                            {fb.ai_summary}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-lg border ${categoryConfig[fb.category]}`}>
                          {fb.category}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {fb.ai_sentiment ? (
                          <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border ${sentimentConfig[fb.ai_sentiment].color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sentimentConfig[fb.ai_sentiment].dot}`} />
                            {fb.ai_sentiment}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">Pending</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {fb.ai_priority ? (
                          <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg border ${priorityBg(fb.ai_priority)} ${priorityColor(fb.ai_priority)}`}>
                            {fb.ai_priority}/10
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">N/A</span>
                        )}
                      </td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={fb.status}
                          onChange={(e) => handleStatusChange(fb._id, e.target.value)}
                          disabled={actionLoading === fb._id}
                          className={`text-xs px-2.5 py-1 rounded-lg border bg-transparent cursor-pointer focus:outline-none transition-all ${statusConfig[fb.status].color}`}
                        >
                          {['New', 'In Review', 'Resolved'].map((s) => (
                            <option key={s} value={s} className="bg-slate-900 text-white">{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-slate-600">
                          {new Date(fb.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </span>
                      </td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleReanalyze(fb._id)}
                            disabled={actionLoading === fb._id}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                            title="Reanalyze"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === fb._id ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleDelete(fb._id)}
                            disabled={actionLoading === fb._id}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-slate-600 text-sm">
              Page <span className="text-slate-400">{page}</span> of <span className="text-slate-400">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedFeedback && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedFeedback(null)}
        >
          <div
            className="bg-[#0d0d14] border border-white/10 rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex-1 pr-4">
                <h2 className="text-base font-semibold text-white leading-snug">
                  {selectedFeedback.title}
                </h2>
                <p className="text-slate-500 text-xs mt-1">
                  {new Date(selectedFeedback.createdAt).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric'
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-lg border ${categoryConfig[selectedFeedback.category]}`}>
                  {selectedFeedback.category}
                </span>
                {selectedFeedback.ai_sentiment && (
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border ${sentimentConfig[selectedFeedback.ai_sentiment].color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sentimentConfig[selectedFeedback.ai_sentiment].dot}`} />
                    {selectedFeedback.ai_sentiment}
                  </span>
                )}
                {selectedFeedback.ai_priority && (
                  <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg border ${priorityBg(selectedFeedback.ai_priority)} ${priorityColor(selectedFeedback.ai_priority)}`}>
                    Priority {selectedFeedback.ai_priority}/10
                  </span>
                )}
                <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border ${statusConfig[selectedFeedback.status].color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusConfig[selectedFeedback.status].dot}`} />
                  {selectedFeedback.status}
                </span>
              </div>

              {/* Description */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Description</p>
                <p className="text-sm text-slate-300 leading-relaxed">{selectedFeedback.description}</p>
              </div>

              {/* AI Summary */}
              {selectedFeedback.ai_summary && (
                <div className="bg-violet-500/[0.07] border border-violet-500/15 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    <p className="text-xs font-medium text-violet-400 uppercase tracking-wider">AI Summary</p>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{selectedFeedback.ai_summary}</p>
                </div>
              )}

              {/* Tags */}
              {selectedFeedback.ai_tags && selectedFeedback.ai_tags.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">AI Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFeedback.ai_tags.map((tag) => (
                      <span key={tag} className="text-xs px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-400">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Submitter */}
              {(selectedFeedback.submitterName || selectedFeedback.submitterEmail) && (
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Submitted by</p>
                  <p className="text-sm text-white font-medium">{selectedFeedback.submitterName || 'Anonymous'}</p>
                  {selectedFeedback.submitterEmail && (
                    <p className="text-xs text-slate-500 mt-0.5">{selectedFeedback.submitterEmail}</p>
                  )}
                </div>
              )}

              {/* Status update */}
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Update Status</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { s: 'New', icon: <Clock className="w-3 h-3" /> },
                    { s: 'In Review', icon: <RefreshCw className="w-3 h-3" /> },
                    { s: 'Resolved', icon: <CheckCircle2 className="w-3 h-3" /> },
                  ].map(({ s, icon }) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(selectedFeedback._id, s)}
                      disabled={selectedFeedback.status === s || actionLoading === selectedFeedback._id}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all border ${
                        selectedFeedback.status === s
                          ? statusConfig[s].color
                          : 'border-white/5 text-slate-500 hover:border-white/10 hover:text-slate-300 bg-white/[0.02]'
                      }`}
                    >
                      {icon}{s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleReanalyze(selectedFeedback._id)}
                  disabled={actionLoading === selectedFeedback._id}
                  className="flex items-center justify-center gap-2 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-400 py-2.5 rounded-xl text-xs font-medium transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === selectedFeedback._id ? 'animate-spin' : ''}`} />
                  Reanalyze with AI
                </button>
                <button
                  onClick={() => handleDelete(selectedFeedback._id)}
                  disabled={actionLoading === selectedFeedback._id}
                  className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 py-2.5 rounded-xl text-xs font-medium transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}