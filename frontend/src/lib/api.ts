import axios from 'axios';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  Regulation,
  Document,
  Alert,
  QueryResponse,
  SearchResult,
  PaginatedResponse,
  StatsData,
  User,
} from '../types';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — add Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fra_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fra_token');
      localStorage.removeItem('fra_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = (credentials: LoginCredentials) =>
  api.post<AuthResponse>('/auth/login', credentials).then((r) => r.data);

export const register = (data: RegisterData) =>
  api.post<AuthResponse>('/auth/register', data).then((r) => r.data);

export const getCurrentUser = () =>
  api.get<User>('/auth/me').then((r) => r.data);

// ── Regulations ───────────────────────────────────────────────────────────────
export interface RegulationFilters {
  page?: number;
  size?: number;
  type?: string;
  date_from?: string;
  date_to?: string;
  tags?: string;
  sort?: 'newest' | 'oldest' | 'relevance';
  language?: 'en' | 'ar';
}

export const getRegulations = (params?: RegulationFilters) =>
  api.get<PaginatedResponse<Regulation>>('/regulations', { params }).then((r) => r.data);

export const getRegulation = (id: number) =>
  api.get<Regulation>(`/regulations/${id}`).then((r) => r.data);

export const getLatestRegulations = (limit = 10) =>
  api.get<Regulation[]>('/regulations/latest', { params: { limit } }).then((r) => r.data);

export const getRelatedRegulations = (id: number) =>
  api.get<Regulation[]>(`/regulations/${id}/related`).then((r) => r.data);

// ── Search ────────────────────────────────────────────────────────────────────
export interface SearchParams {
  q: string;
  mode?: 'text' | 'semantic';
  type?: string;
  date_from?: string;
  date_to?: string;
  language?: 'en' | 'ar';
  page?: number;
  size?: number;
}

export const searchRegulations = (params: SearchParams) =>
  api.get<PaginatedResponse<SearchResult>>('/search', { params }).then((r) => r.data);

// ── AI Query ──────────────────────────────────────────────────────────────────
export const askAI = (query: string, language?: string) =>
  api.post<QueryResponse>('/ai/query', { query, language }).then((r) => r.data);

// ── Documents ─────────────────────────────────────────────────────────────────
export const getDocuments = () =>
  api.get<Document[]>('/documents').then((r) => r.data);

export const uploadDocument = (formData: FormData) =>
  api.post<Document>('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

export const deleteDocument = (id: number) =>
  api.delete(`/documents/${id}`).then((r) => r.data);

// ── Alerts ────────────────────────────────────────────────────────────────────
export const getAlerts = () =>
  api.get<Alert[]>('/alerts').then((r) => r.data);

export const createAlert = (data: Partial<Alert>) =>
  api.post<Alert>('/alerts', data).then((r) => r.data);

export const updateAlert = (id: number, data: Partial<Alert>) =>
  api.put<Alert>(`/alerts/${id}`, data).then((r) => r.data);

export const deleteAlert = (id: number) =>
  api.delete(`/alerts/${id}`).then((r) => r.data);

export const toggleAlert = (id: number, is_active: boolean) =>
  api.patch<Alert>(`/alerts/${id}/toggle`, { is_active }).then((r) => r.data);

export const sendTestAlert = (id: number) =>
  api.post(`/alerts/${id}/test`).then((r) => r.data);

// ── Stats ─────────────────────────────────────────────────────────────────────
export const getStats = () =>
  api.get<StatsData>('/stats').then((r) => r.data);

// ── Profile ───────────────────────────────────────────────────────────────────
export const updateProfile = (data: Partial<User>) =>
  api.put<User>('/auth/me', data).then((r) => r.data);

export const changePassword = (current_password: string, new_password: string) =>
  api.post('/auth/change-password', { current_password, new_password }).then((r) => r.data);

export default api;
