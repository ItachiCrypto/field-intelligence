// @ts-nocheck
import type {
  SalesforceTask,
  SalesforceEvent,
  SalesforceActivity,
  SalesforceTokenResponse,
} from './types';
import crypto from 'crypto';

const SF_API_VERSION = 'v59.0';

// PKCE helpers
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

export function getSalesforceAuthUrl(redirectUri: string, state: string, codeChallenge?: string): string {
  const clientId = process.env.SALESFORCE_CLIENT_ID;
  if (!clientId) throw new Error('SALESFORCE_CLIENT_ID not configured');
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'api refresh_token',
    state,
  });
  if (codeChallenge) {
    params.set('code_challenge', codeChallenge);
    params.set('code_challenge_method', 'S256');
  }
  return `https://login.salesforce.com/services/oauth2/authorize?${params}`;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string, codeVerifier?: string): Promise<SalesforceTokenResponse> {
  const body: Record<string, string> = {
    grant_type: 'authorization_code',
    code,
    client_id: process.env.SALESFORCE_CLIENT_ID!,
    client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
    redirect_uri: redirectUri,
  };
  if (codeVerifier) {
    body.code_verifier = codeVerifier;
  }
  const res = await fetch('https://login.salesforce.com/services/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Salesforce token exchange failed: ${res.statusText} - ${errText}`);
  }
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

/**
 * Execute une requete SOQL et retourne `records` (ou throw en cas d'erreur).
 * Extrait dans un helper car on fait maintenant 2 requetes (Task + Event)
 * en parallele et il faut le meme traitement d'erreur.
 */
async function soqlQuery<T>(
  accessToken: string,
  instanceUrl: string,
  soql: string,
): Promise<T[]> {
  const collapsed = soql.trim().replace(/\s+/g, ' ');
  const res = await fetch(
    `${instanceUrl}/services/data/${SF_API_VERSION}/query?q=${encodeURIComponent(collapsed)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    },
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Salesforce SOQL failed: ${res.status} ${err}`);
  }
  const data = await res.json();
  return data.records ?? [];
}

/**
 * Recupere les Tasks (incluant Calls, Emails, autres) modifiees depuis `since`.
 * Plus de filtre sur le Subject : on veut toutes les activites car meme un
 * appel de 2 minutes peut contenir un signal concurrentiel. Filtre minimum :
 * la Description n'est pas vide (pas d'interet a traiter des entrees sans
 * contenu).
 */
export async function fetchSalesforceTasks(
  accessToken: string,
  instanceUrl: string,
  since: string,
  limit = 300,
): Promise<SalesforceTask[]> {
  const soql = `
    SELECT Id, Subject, Description, CreatedDate, ActivityDate, LastModifiedDate,
           OwnerId, WhoId, WhatId, TaskSubtype, Type,
           Owner.Email, Owner.Name,
           What.Name, What.Id,
           Who.Name
    FROM Task
    WHERE LastModifiedDate >= ${since}
    AND Description != null
    ORDER BY LastModifiedDate DESC
    LIMIT ${limit}
  `;
  return soqlQuery<SalesforceTask>(accessToken, instanceUrl, soql);
}

/**
 * Recupere les Events (reunions / RDV / visites planifiees) modifies depuis
 * `since`. Beaucoup de commerciaux mettent le compte-rendu dans le champ
 * Description de l'Event plutot que dans une Task.
 */
export async function fetchSalesforceEvents(
  accessToken: string,
  instanceUrl: string,
  since: string,
  limit = 200,
): Promise<SalesforceEvent[]> {
  const soql = `
    SELECT Id, Subject, Description, CreatedDate, StartDateTime, EndDateTime,
           LastModifiedDate, OwnerId, WhoId, WhatId, IsAllDayEvent, Type,
           Owner.Email, Owner.Name,
           What.Name, What.Id,
           Who.Name
    FROM Event
    WHERE LastModifiedDate >= ${since}
    AND Description != null
    ORDER BY LastModifiedDate DESC
    LIMIT ${limit}
  `;
  return soqlQuery<SalesforceEvent>(accessToken, instanceUrl, soql);
}

/**
 * Infere le type d'activite a partir d'une Task Salesforce.
 * TaskSubtype est la source de verite quand dispo ; sinon on fallback sur
 * Type (picklist custom dans beaucoup d'orgs) avec mapping raisonnable.
 */
function classifyTask(t: SalesforceTask): 'task' | 'call' | 'email' {
  const sub = (t.TaskSubtype || '').toLowerCase();
  if (sub === 'call') return 'call';
  if (sub === 'email' || sub === 'list email') return 'email';
  const type = (t.Type || '').toLowerCase();
  if (type.includes('call') || type.includes('appel')) return 'call';
  if (type.includes('email') || type.includes('mail')) return 'email';
  return 'task';
}

/**
 * Recupere TOUTES les activites CRM pertinentes (Task + Event) depuis Salesforce
 * et renvoie une liste unifiee, chaque entree annotee avec `_kind` pour le
 * diagnostic downstream. Les appels Task et Event sont executes en parallele.
 */
export async function fetchCrmActivities(
  accessToken: string,
  instanceUrl: string,
  since: string,
): Promise<SalesforceActivity[]> {
  const [tasks, events] = await Promise.all([
    fetchSalesforceTasks(accessToken, instanceUrl, since),
    fetchSalesforceEvents(accessToken, instanceUrl, since),
  ]);

  const classified: SalesforceActivity[] = [
    ...tasks.map((t) => ({ ...t, _kind: classifyTask(t) as 'task' | 'call' | 'email' })),
    ...events.map((e) => ({ ...e, _kind: 'event' as const })),
  ];

  // Tri global par LastModifiedDate desc pour que la page de sync affiche les
  // plus recents en premier.
  classified.sort((a, b) => {
    const ta = new Date(a.LastModifiedDate || 0).getTime();
    const tb = new Date(b.LastModifiedDate || 0).getTime();
    return tb - ta;
  });
  return classified;
}

/**
 * Retro-compat : ancien nom conserve pour ne pas casser d'eventuels callers.
 * Nouveau code : preferer fetchCrmActivities (couvre Task + Event + Call + Email).
 *
 * @deprecated utiliser fetchCrmActivities
 */
export async function fetchVisitReports(
  accessToken: string,
  instanceUrl: string,
  since: string,
): Promise<SalesforceTask[]> {
  return fetchSalesforceTasks(accessToken, instanceUrl, since);
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
