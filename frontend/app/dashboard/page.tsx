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
  Filter,
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
} from 'lucide-react';

const CATEGORIES = ['All', 'Bug', 'Feature Request', 'Improvement', 'Other'];
const STATUSES = ['All', 'New', 'In Review', 'Resolved'];
const SORTS = [
  { label: 'Newest', value: 'createdAt', order: 'desc' },
  { label: 'Oldest', value: 'createdAt', order: 'asc' },
  { label: 'Highest Priority', value: 'ai_priority', order: 'desc' },
  { label: 'Lowest Priority', value: 'ai_priority', order: 'asc' },
];

const sentimentColors: Record<string, string> = {
  Positive: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Neutral: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  Negative: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusColors: Record<string, string> = {
  New: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'In Review': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Resolved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const categoryColors: Record<string, string> = {
  Bug: 'bg-red-500/20 text-red-400 border-red-500/30',
  'Feature Request': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Improvement: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Other: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
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
    if (!token) {
      router.push('/admin');
      return;
    }
    fetchFeedbacks();
  }, [fetchFeedbacks, router]);

  const handleLogout = () => {
    localStorage.removeItem('feedpulse_token');
    router.push('/admin');
    toast.success('Logged out successfully');
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
    } catch {
      toast.error('Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    setActionLoading(id);
    try {
      await deleteFeedback(id);
      toast.success('Feedback deleted');
      fetchFeedbacks();
      if (selectedFeedback?._id === id) setSelectedFeedback(null);
    } catch {
      toast.error('Failed to delete feedback');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReanalyze = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await reanalyzeFeedback(id);
      toast.success('Reanalysis complete');
      fetchFeedbacks();
      if (selectedFeedback?._id === id) setSelectedFeedback(res.data);
    } catch {
      toast.error('Reanalysis failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleGetSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await getAISummary();
      setAiSummary(JSON.stringify(res.data.summary, null, 2));
    } catch {
      toast.error('Failed to get AI summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  // Stats
  const newCount = feedbacks.filter((f) => f.status === 'New').length;
  const avgPriority =
    feedbacks.filter((f) => f.ai_priority).length > 0
      ? (
          feedbacks
            .filter((f) => f.ai_priority)
            .reduce((acc, f) => acc + (f.ai_priority || 0), 0) /
          feedbacks.filter((f) => f.ai_priority).length
        ).toFixed(1)
      : 'N/A';

  const allTags = feedbacks.flatMap((f) => f.ai_tags || []);
  const tagFreq = allTags.reduce<Record<string, number>>((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {});
  const topTag =
    Object.entries(tagFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-white/10 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-lg">FeedPulse</span>
            <span className="text-slate-500 text-sm ml-2">Admin</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <span className="text-slate-400 text-xs">Total Feedback</span>
            </div>
            <p className="text-2xl font-bold">{total}</p>
          </div>
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-blue-400" />
              <span className="text-slate-400 text-xs">Open Items</span>
            </div>
            <p className="text-2xl font-bold">{newCount}</p>
          </div>
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span className="text-slate-400 text-xs">Avg Priority</span>
            </div>
            <p className="text-2xl font-bold">{avgPriority}</p>
          </div>
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400 text-xs">Top Tag</span>
            </div>
            <p className="text-2xl font-bold truncate">{topTag}</p>
          </div>
        </div>

        {/* AI Summary */}
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="font-medium text-sm">AI Weekly Summary</span>
            </div>
            <button
              onClick={handleGetSummary}
              disabled={summaryLoading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
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
            <pre className="text-slate-300 text-xs bg-slate-900/50 rounded-lg p-3 overflow-auto whitespace-pre-wrap">
              {aiSummary}
            </pre>
          ) : (
            <p className="text-slate-500 text-sm">
              Click Generate to get AI insights on the last 7 days of feedback.
            </p>
          )}
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 mb-6 space-y-4">

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by title or AI summary..."
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm transition-all"
            >
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
                className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2.5 rounded-xl text-sm transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-slate-400 text-xs">Filters:</span>
            </div>

            {/* Category filter */}
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="bg-slate-900/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="bg-slate-900/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortIndex}
              onChange={(e) => { setSortIndex(Number(e.target.value)); setPage(1); }}
              className="bg-slate-900/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {SORTS.map((s, i) => (
                <option key={i} value={i}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden mb-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <MessageSquare className="w-10 h-10 mb-3" />
              <p>No feedback found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-900/50">
                    <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Title</th>
                    <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Category</th>
                    <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Sentiment</th>
                    <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Priority</th>
                    <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Date</th>
                    <th className="text-left px-4 py-3 text-xs text-slate-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map((fb) => (
                    <tr
                      key={fb._id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => setSelectedFeedback(fb)}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-white truncate max-w-[200px]">
                          {fb.title}
                        </p>
                        {fb.ai_summary && (
                          <p className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5">
                            {fb.ai_summary}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-lg border ${categoryColors[fb.category] || ''}`}>
                          {fb.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {fb.ai_sentiment ? (
                          <span className={`text-xs px-2 py-1 rounded-lg border ${sentimentColors[fb.ai_sentiment]}`}>
                            {fb.ai_sentiment}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {fb.ai_priority ? (
                          <span className={`text-sm font-bold ${
                            fb.ai_priority >= 8
                              ? 'text-red-400'
                              : fb.ai_priority >= 5
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}>
                            {fb.ai_priority}/10
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={fb.status}
                          onChange={(e) => handleStatusChange(fb._id, e.target.value)}
                          disabled={actionLoading === fb._id}
                          className={`text-xs px-2 py-1 rounded-lg border bg-transparent cursor-pointer focus:outline-none ${statusColors[fb.status]}`}
                        >
                          {['New', 'In Review', 'Resolved'].map((s) => (
                            <option key={s} value={s} className="bg-slate-800 text-white">
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-500">
                          {new Date(fb.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleReanalyze(fb._id)}
                            disabled={actionLoading === fb._id}
                            className="text-slate-400 hover:text-purple-400 transition-colors"
                            title="Reanalyze with AI"
                          >
                            <RefreshCw className={`w-4 h-4 ${actionLoading === fb._id ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleDelete(fb._id)}
                            disabled={actionLoading === fb._id}
                            className="text-slate-400 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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
            <p className="text-slate-500 text-sm">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-all"
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedFeedback(null)}
        >
          <div
            className="bg-slate-900 border border-white/20 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold text-white pr-4">
                {selectedFeedback.title}
              </h2>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="text-slate-400 hover:text-white transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span className={`text-xs px-2 py-1 rounded-lg border ${categoryColors[selectedFeedback.category]}`}>
                  {selectedFeedback.category}
                </span>
                {selectedFeedback.ai_sentiment && (
                  <span className={`text-xs px-2 py-1 rounded-lg border ${sentimentColors[selectedFeedback.ai_sentiment]}`}>
                    {selectedFeedback.ai_sentiment}
                  </span>
                )}
                <span className={`text-xs px-2 py-1 rounded-lg border ${statusColors[selectedFeedback.status]}`}>
                  {selectedFeedback.status}
                </span>
                {selectedFeedback.ai_priority && (
                  <span className="text-xs px-2 py-1 rounded-lg border border-white/10 text-white">
                    Priority: {selectedFeedback.ai_priority}/10
                  </span>
                )}
              </div>

              {/* Description */}
              <div>
                <p className="text-xs text-slate-400 mb-1">Description</p>
                <p className="text-sm text-slate-300">{selectedFeedback.description}</p>
              </div>

              {/* AI Summary */}
              {selectedFeedback.ai_summary && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <p className="text-xs text-purple-400 font-medium">AI Summary</p>
                  </div>
                  <p className="text-sm text-slate-300">{selectedFeedback.ai_summary}</p>
                </div>
              )}

              {/* Tags */}
              {selectedFeedback.ai_tags && selectedFeedback.ai_tags.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">AI Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFeedback.ai_tags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-1 bg-slate-800 border border-white/10 rounded-lg text-slate-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Submitter */}
              {(selectedFeedback.submitterName || selectedFeedback.submitterEmail) && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Submitted by</p>
                  <p className="text-sm text-slate-300">
                    {selectedFeedback.submitterName || 'Anonymous'}
                    {selectedFeedback.submitterEmail && (
                      <span className="text-slate-500 ml-2">
                        ({selectedFeedback.submitterEmail})
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Status change */}
              <div>
                <p className="text-xs text-slate-400 mb-2">Update Status</p>
                <div className="flex gap-2">
                  {['New', 'In Review', 'Resolved'].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(selectedFeedback._id, s)}
                      disabled={selectedFeedback.status === s || actionLoading === selectedFeedback._id}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all border ${
                        selectedFeedback.status === s
                          ? statusColors[s]
                          : 'border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'
                      }`}
                    >
                      {s === 'New' && <Clock className="w-3 h-3 inline mr-1" />}
                      {s === 'In Review' && <RefreshCw className="w-3 h-3 inline mr-1" />}
                      {s === 'Resolved' && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleReanalyze(selectedFeedback._id)}
                  disabled={actionLoading === selectedFeedback._id}
                  className="flex-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-3 h-3 ${actionLoading === selectedFeedback._id ? 'animate-spin' : ''}`} />
                  Reanalyze
                </button>
                <button
                  onClick={() => handleDelete(selectedFeedback._id)}
                  disabled={actionLoading === selectedFeedback._id}
                  className="flex-1 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3 h-3" />
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