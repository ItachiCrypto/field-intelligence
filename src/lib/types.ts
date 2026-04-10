export type UserRole = 'admin' | 'marketing' | 'kam' | 'dirco';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company_id: string;
  avatar?: string;
}

export type SignalType = 'concurrence' | 'besoin' | 'prix' | 'satisfaction' | 'opportunite';
export type Severity = 'rouge' | 'orange' | 'jaune' | 'vert';
export type AlertStatus = 'nouveau' | 'en_cours' | 'traite' | 'archive';

export interface Signal {
  id: string;
  type: SignalType;
  severity: Severity;
  title: string;
  content: string;
  client_name: string;
  client_id: string;
  commercial_name: string;
  commercial_id: string;
  region: string;
  competitor_name?: string;
  price_delta?: number;
  created_at: string;
  treated: boolean;
}

export interface Account {
  id: string;
  name: string;
  sector: string;
  region: string;
  ca_annual: number;
  kam_id: string;
  kam_name: string;
  risk_score: number;
  risk_trend: number;
  active_signals: number;
  last_rdv: string;
  health: Severity;
  signals: Signal[];
  contacts: Contact[];
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  client_id: string;
  first_detected: string;
  is_new: boolean;
}

export interface Alert {
  id: string;
  signal_id: string;
  signal: Signal;
  user_id: string;
  severity: Severity;
  status: AlertStatus;
  created_at: string;
  treated_at?: string;
}

export interface Commercial {
  id: string;
  name: string;
  region: string;
  cr_week: number;
  quality_score: number;
  quality_trend: number;
  useful_signals: number;
  active_alerts: number;
}

export interface Competitor {
  id: string;
  name: string;
  mentions: number;
  mention_type: string;
  evolution: number;
  risk: Severity;
  is_new: boolean;
}

export interface NeedItem {
  rank: number;
  label: string;
  mentions: number;
  evolution: number;
  trend: 'up' | 'down' | 'stable' | 'new';
}

export interface KPI {
  label: string;
  value: number | string;
  change?: number;
  suffix?: string;
  icon?: string;
}

export interface AIRecommendation {
  account_id: string;
  text: string;
  priority: Severity;
}
