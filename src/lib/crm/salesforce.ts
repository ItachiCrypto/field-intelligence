// @ts-nocheck
import type { SalesforceTask, SalesforceTokenResponse } from './types';

const SF_API_VERSION = 'v59.0';

export function getSalesforceAuthUrl(redirectUri: string, state: string): string {
  const clientId = process.env.SALESFORCE_CLIENT_ID;
  if (!clientId) throw new Error('SALESFORCE_CLIENT_ID not configured');
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'api refresh_token',
    state,
  });
  return `https://login.salesforce.com/services/oauth2/authorize?${params}`;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<SalesforceTokenResponse> {
  const res = await fetch('https://login.salesforce.com/services/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.SALESFORCE_CLIENT_ID!,
      client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`Salesforce token exchange failed: ${res.statusText}`);
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; issued_at: string }> {
  const res = await fetch('https://login.salesforce.com/services/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.SALESFORCE_CLIENT_ID!,
      client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error('Token refresh failed');
  return res.json();
}

export async function fetchVisitReports(
  accessToken: string,
  instanceUrl: string,
  since: string, // ISO date string
): Promise<SalesforceTask[]> {
  const soql = `
    SELECT Id, Subject, Description, CreatedDate, ActivityDate, LastModifiedDate,
           OwnerId, WhoId, WhatId,
           Owner.Email, Owner.Name,
           What.Name, What.Id,
           Who.Name
    FROM Task
    WHERE LastModifiedDate >= ${since}
    AND (Subject LIKE '%visite%' OR Subject LIKE '%visit%' OR Subject LIKE '%RDV%' OR Subject LIKE '%rdv%' OR Subject LIKE '%CR%' OR Type = 'Call' OR Type = 'Meeting')
    ORDER BY LastModifiedDate DESC
    LIMIT 200
  `.trim().replace(/\s+/g, ' ');

  const res = await fetch(
    `${instanceUrl}/services/data/${SF_API_VERSION}/query?q=${encodeURIComponent(soql)}`,
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Salesforce query failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.records ?? [];
}

export async function testConnection(accessToken: string, instanceUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${instanceUrl}/services/data/${SF_API_VERSION}/limits`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.ok;
  } catch { return false; }
}

export async function revokeToken(accessToken: string): Promise<void> {
  await fetch(`https://login.salesforce.com/services/oauth2/revoke?token=${accessToken}`, {
    method: 'POST',
  });
}
