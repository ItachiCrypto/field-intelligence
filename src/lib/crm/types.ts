// @ts-nocheck
export type CrmProvider = 'salesforce' | 'hubspot' | 'dynamics' | 'pipedrive';
export type ConnectionStatus = 'pending' | 'connected' | 'error' | 'revoked';
export type ProcessingStatus = 'pending' | 'processing' | 'done' | 'error' | 'skipped';

export interface CrmConnection {
  id: string;
  company_id: string;
  provider: CrmProvider;
  instance_url: string | null;
  salesforce_org_id: string | null;
  status: ConnectionStatus;
  config_json: Record<string, any>;
  last_sync_at: string | null;
  last_sync_error: string | null;
  records_synced: number;
  created_at: string;
}

export interface RawVisitReport {
  id: string;
  company_id: string;
  crm_connection_id: string;
  external_id: string;
  content_text: string | null;
  subject: string | null;
  commercial_email: string | null;
  commercial_name: string | null;
  client_name: string | null;
  visit_date: string | null;
  processing_status: ProcessingStatus;
  processed_at: string | null;
  synced_at: string;
}

export interface SalesforceTokenResponse {
  access_token: string;
  refresh_token: string;
  instance_url: string;
  id: string;
  token_type: string;
  issued_at: string;
  signature: string;
}

export interface SalesforceTask {
  Id: string;
  Subject: string | null;
  Description: string | null;
  CreatedDate: string;
  ActivityDate: string | null;
  LastModifiedDate: string;
  OwnerId: string;
  WhoId: string | null;
  WhatId: string | null;
  Owner?: { Email?: string; Name?: string };
  What?: { Name?: string; Id?: string };
  Who?: { Name?: string };
}

// What the NLP extraction returns
export interface ExtractedCRData {
  signals: {
    type: 'concurrence' | 'besoin' | 'prix' | 'satisfaction' | 'opportunite';
    severity: 'rouge' | 'orange' | 'jaune' | 'vert';
    title: string;
    content: string;
    competitor_name?: string;
    price_delta?: number;
  }[];
  deals: {
    view: 'marketing' | 'commercial';
    motif: string;
    resultat: 'gagne' | 'perdu' | 'en_cours';
    concurrent_nom?: string;
    verbatim: string;
  }[];
  prix_signals: {
    concurrent_nom: string;
    ecart_pct: number;
    ecart_type: 'inferieur' | 'superieur';
    verbatim: string;
  }[];
  objectifs: {
    type: 'signature' | 'sell_out' | 'sell_in' | 'formation' | 'decouverte' | 'fidelisation';
    resultat: 'atteint' | 'non_atteint';
    cause_echec?: string;
    facteur_reussite?: string;
  }[];
  sentiment: 'positif' | 'negatif' | 'neutre' | 'interesse';
  needs: { label: string; trend: 'up' | 'down' | 'stable' | 'new' }[];
  competitors_mentioned: { name: string; mention_type: string }[];
}
