export interface User {
  id: number;
  email: string;
  full_name: string;
  whatsapp_number?: string;
  preferred_language: 'en' | 'ar';
  keywords: string[];
  notification_email: boolean;
  notification_whatsapp: boolean;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export type RegulationType = 'Law' | 'Decree' | 'Circular' | 'Announcement';

export interface Regulation {
  id: number;
  title_en: string;
  title_ar: string;
  regulation_type: string;
  content_en?: string;
  content_ar?: string;
  summary_en?: string;
  summary_ar?: string;
  published_date: string;
  source_url?: string;
  tags: string[];
  is_active: boolean;
  scraped_at: string;
  created_at: string;
}

export interface Document {
  id: number;
  filename: string;
  title?: string;
  regulation_type?: RegulationType;
  source_url?: string;
  published_date?: string;
  tags: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  uploaded_by: number;
  created_at: string;
}

export interface Alert {
  id: number;
  name: string;
  keywords: string[];
  regulation_types: string[];
  is_active: boolean;
  last_triggered?: string;
  created_at: string;
  user_id: number;
}

export interface AlertHistory {
  id: number;
  alert_id: number;
  regulation_id: number;
  regulation_title: string;
  triggered_at: string;
  notification_sent: boolean;
}

export interface SearchResult {
  id: number;
  title_en: string;
  title_ar: string;
  type: RegulationType;
  published_date: string;
  summary_en?: string;
  summary_ar?: string;
  source_url?: string;
  score?: number;
  snippet?: string;
}

export interface Source {
  regulation_id: number;
  title_en: string;
  title_ar: string;
  source_url?: string;
  relevance_score?: number;
}

export interface QueryResponse {
  answer: string;
  sources: Source[];
  relevant_regulations: Regulation[];
  query: string;
  language: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  relevant_regulations?: Regulation[];
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface StatsData {
  total_regulations: number;
  new_this_week: number;
  active_alerts: number;
  saved_documents: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  whatsapp_number?: string;
  preferred_language: 'en' | 'ar';
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
