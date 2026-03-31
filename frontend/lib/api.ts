import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach token to every request if it exists
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('feedpulse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Types
export interface Feedback {
  _id: string;
  title: string;
  description: string;
  category: 'Bug' | 'Feature Request' | 'Improvement' | 'Other';
  status: 'New' | 'In Review' | 'Resolved';
  submitterName?: string;
  submitterEmail?: string;
  ai_category?: string;
  ai_sentiment?: 'Positive' | 'Neutral' | 'Negative';
  ai_priority?: number;
  ai_summary?: string;
  ai_tags?: string[];
  ai_processed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  error: string | null;
  data: T;
}

export interface PaginatedFeedback {
  feedbacks: Feedback[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface FeedbackFilters {
  category?: string;
  status?: string;
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
  search?: string;
}

// Auth
export const loginAdmin = async (email: string, password: string) => {
  const res = await api.post<ApiResponse<{ token: string }>>('/auth/login', {
    email,
    password,
  });
  return res.data;
};

// Feedback
export const submitFeedback = async (data: {
  title: string;
  description: string;
  category: string;
  submitterName?: string;
  submitterEmail?: string;
}) => {
  const res = await api.post<ApiResponse<Feedback>>('/feedback', data);
  return res.data;
};

export const getAllFeedback = async (filters: FeedbackFilters = {}) => {
  const res = await api.get<ApiResponse<PaginatedFeedback>>('/feedback', {
    params: filters,
  });
  return res.data;
};

export const getFeedbackById = async (id: string) => {
  const res = await api.get<ApiResponse<Feedback>>(`/feedback/${id}`);
  return res.data;
};

export const updateFeedbackStatus = async (id: string, status: string) => {
  const res = await api.patch<ApiResponse<Feedback>>(`/feedback/${id}`, {
    status,
  });
  return res.data;
};

export const deleteFeedback = async (id: string) => {
  const res = await api.delete<ApiResponse<null>>(`/feedback/${id}`);
  return res.data;
};

export const reanalyzeFeedback = async (id: string) => {
  const res = await api.post<ApiResponse<Feedback>>(
    `/feedback/${id}/reanalyze`
  );
  return res.data;
};

export const getAISummary = async () => {
  const res = await api.get<ApiResponse<{ summary: string }>>(
    '/feedback/summary'
  );
  return res.data;
};

export default api;