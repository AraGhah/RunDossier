import { query, queryOne } from '../db.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CampaignStatus =
  | 'draft' | 'queued' | 'running' | 'paused'
  | 'cancelling' | 'cancelled'
  | 'completed' | 'completed_with_issues' | 'failed';

/** Full ICP config stored verbatim as entered by operator. */
export interface IcpConfig {
  industry?: string;
  niches?: string[];
  job_titles?: string[];
  seniority?: string[];
  company_size?: string[];
  company_type?: string[];
  keywords?: string[];
  exclusion_keywords?: string[];
  required_data_fields?: string[];
  research_requirements?: string;
  quality_threshold?: number;
  notes?: string;
  [key: string]: unknown;
}

export interface Campaign {
  id: string;
  client_id: string;
  name: string;
  status: CampaignStatus;
  target_count: number;
  icp_config: IcpConfig;
  criteria: string[];
  locations: string[];
  accepted_count: number;
  rejected_count: number;
  pending_count: number;
  research_complete_count: number;
  personalized_count: number;
  qa_passed_count: number;
  delivered_count: number;
  failed_count: number;
  started_at: string | null;
  paused_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  cancelled_by: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCampaignInput {
  client_id: string;
  name: string;
  target_count: number;
  icp_config?: IcpConfig;
  criteria?: string[];
  locations?: string[];
}

export interface UpdateDraftInput {
  name?: string;
  target_count?: number;
  icp_config?: IcpConfig;
  criteria?: string[];
  locations?: string[];
}

export interface CancelCampaignInput {
  actor?: string;
  reason?: string;
}

// ---------------------------------------------------------------------------
// State machine — only these transitions are permitted
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  draft:                 ['queued', 'cancelled'],
  queued:                ['running', 'paused', 'cancelled'],
  running:               ['paused', 'cancelling', 'completed', 'completed_with_issues', 'failed'],
  paused:                ['queued', 'cancelling', 'cancelled'],
  cancelling:            ['cancelled'],
  cancelled:             [],
  completed:             [],
  completed_with_issues: [],
  failed:                ['queued'],
};

export function isValidTransition(from: CampaignStatus, to: CampaignStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Statuses that block workers from claiming new work. */
export function campaignBlocksWork(status: CampaignStatus): boolean {
  return status === 'paused' || status === 'cancelling' || status === 'cancelled';
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

async function logEvent(
  campaignId: string,
  eventType: string,
  opts: { fromStatus?: string; toStatus?: string; actor?: string; reason?: string; metadata?: Record<string, unknown> }
): Promise<void> {
  await query(
    `INSERT INTO campaign_events (campaign_id, event_type, from_status, to_status, actor, reason, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      campaignId, eventType,
      opts.fromStatus ?? null, opts.toStatus ?? null,
      opts.actor ?? null, opts.reason ?? null,
      JSON.stringify(opts.metadata ?? {}),
    ]
  ).catch(e => console.error('[campaign] audit log error:', e));
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  if (!input.client_id) throw new Error('client_id is required');
  if (!input.name?.trim()) throw new Error('Campaign name is required');
  if (!input.target_count || input.target_count < 1) throw new Error('target_count must be >= 1');

  const [row] = await query<Campaign>(
    `INSERT INTO campaigns (client_id, name, target_count, icp_config, criteria, locations)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      input.client_id,
      input.name.trim(),
      input.target_count,
      JSON.stringify(input.icp_config ?? {}),
      JSON.stringify(input.criteria ?? []),
      JSON.stringify(input.locations ?? []),
    ]
  );
  if (!row) throw new Error('Campaign creation failed');
  await logEvent(row.id, 'created', { toStatus: 'draft', actor: 'system' });
  return row;
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  const row = await queryOne<Campaign>(`SELECT * FROM campaigns WHERE id = $1`, [id]);
  return row ?? null;
}

export async function listCampaigns(clientId?: string): Promise<Campaign[]> {
  if (clientId) {
    return query<Campaign>(
      `SELECT * FROM campaigns WHERE client_id = $1 ORDER BY created_at DESC`,
      [clientId]
    );
  }
  return query<Campaign>(`SELECT * FROM campaigns ORDER BY created_at DESC`);
}

/** Only allowed while status = 'draft'. */
export async function updateDraft(id: string, input: UpdateDraftInput): Promise<Campaign> {
  const campaign = await getCampaign(id);
  if (!campaign) throw new Error(`Campaign not found: ${id}`);
  if (campaign.status !== 'draft') {
    throw new Error(`Cannot edit campaign in status '${campaign.status}' — only drafts are editable`);
  }

  const updates: string[] = ['updated_at = NOW()'];
  const params: unknown[] = [id];

  if (input.name !== undefined) {
    if (!input.name.trim()) throw new Error('Campaign name cannot be empty');
    params.push(input.name.trim()); updates.push(`name = $${params.length}`);
  }
  if (input.target_count !== undefined) {
    if (input.target_count < 1) throw new Error('target_count must be >= 1');
    params.push(input.target_count); updates.push(`target_count = $${params.length}`);
  }
  if (input.icp_config !== undefined) {
    params.push(JSON.stringify(input.icp_config)); updates.push(`icp_config = $${params.length}`);
  }
  if (input.criteria !== undefined) {
    params.push(JSON.stringify(input.criteria)); updates.push(`criteria = $${params.length}`);
  }
  if (input.locations !== undefined) {
    params.push(JSON.stringify(input.locations)); updates.push(`locations = $${params.length}`);
  }

  const [updated] = await query<Campaign>(
    `UPDATE campaigns SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  if (!updated) throw new Error('Campaign update failed');
  await logEvent(id, 'updated', { fromStatus: 'draft', toStatus: 'draft', actor: 'operator' });
  return updated;
}

// ---------------------------------------------------------------------------
// State transitions
// ---------------------------------------------------------------------------

async function transition(
  id: string,
  to: CampaignStatus,
  opts: { actor?: string; reason?: string; extraUpdates?: string; extraParams?: unknown[] } = {}
): Promise<Campaign> {
  const campaign = await getCampaign(id);
  if (!campaign) throw new Error(`Campaign not found: ${id}`);

  if (campaign.status === to) return campaign; // idempotent

  if (!isValidTransition(campaign.status as CampaignStatus, to)) {
    throw new Error(
      `Invalid campaign transition: ${campaign.status} → ${to} (id: ${id})`
    );
  }

  const extras = opts.extraUpdates ? `, ${opts.extraUpdates}` : '';
  const base = opts.extraParams ?? [];
  const params = [id, to, ...base];

  const [updated] = await query<Campaign>(
    `UPDATE campaigns SET status = $2, updated_at = NOW()${extras} WHERE id = $1 RETURNING *`,
    params
  );
  if (!updated) throw new Error(`Campaign transition failed: ${id}`);
  await logEvent(id, `status_changed`, {
    fromStatus: campaign.status, toStatus: to,
    actor: opts.actor, reason: opts.reason,
  });
  return updated;
}

/** Draft → queued. Validates required fields before queuing. */
export async function queueCampaign(id: string, actor = 'operator'): Promise<Campaign> {
  const campaign = await getCampaign(id);
  if (!campaign) throw new Error(`Campaign not found: ${id}`);

  // Required-field validation before starting
  if (campaign.status !== 'draft' && campaign.status !== 'failed') {
    throw new Error(`Cannot start campaign in status '${campaign.status}'`);
  }
  const icp = campaign.icp_config as IcpConfig;
  if (!icp || Object.keys(icp).length === 0) {
    throw new Error('ICP config is empty — fill in at least one criterion before starting');
  }
  if (!campaign.locations || (campaign.locations as string[]).length === 0) {
    throw new Error('Locations are required before starting');
  }

  const updated = await transition(id, 'queued', {
    actor, reason: 'operator started campaign',
    extraUpdates: 'started_at = COALESCE(started_at, NOW())',
  });
  await logEvent(id, 'queued', { toStatus: 'queued', actor });
  return updated;
}

export async function pauseCampaign(id: string, actor = 'operator'): Promise<Campaign> {
  return transition(id, 'paused', {
    actor, reason: 'operator paused campaign',
    extraUpdates: 'paused_at = NOW()',
  });
}

export async function resumeCampaign(id: string, actor = 'operator'): Promise<Campaign> {
  return transition(id, 'queued', {
    actor, reason: 'operator resumed campaign',
    extraUpdates: 'paused_at = NULL',
  });
}

export async function cancelCampaign(id: string, opts: CancelCampaignInput = {}): Promise<Campaign> {
  const campaign = await getCampaign(id);
  if (!campaign) throw new Error(`Campaign not found: ${id}`);

  // Idempotent: already cancelled
  if (campaign.status === 'cancelled') return campaign;

  // From running → cancelling first (graceful in-progress stop)
  if (campaign.status === 'running') {
    await transition(id, 'cancelling', { actor: opts.actor, reason: opts.reason });
  }

  // Then → cancelled
  const actor = opts.actor ?? 'operator';
  const reason = opts.reason ?? null;
  const p = [actor, reason];

  const [updated] = await query<Campaign>(
    `UPDATE campaigns
     SET status = 'cancelled', cancelled_at = NOW(),
         cancelled_by = $2, cancellation_reason = $3, updated_at = NOW()
     WHERE id = $1
       AND status NOT IN ('completed','completed_with_issues')
     RETURNING *`,
    [id, ...p]
  );
  if (!updated) {
    // Could not cancel (terminal state) — return current row
    return (await getCampaign(id))!;
  }
  await logEvent(id, 'cancelled', {
    fromStatus: campaign.status, toStatus: 'cancelled',
    actor: opts.actor, reason: opts.reason,
  });
  return updated;
}

export async function completeCampaign(
  id: string,
  withIssues = false,
  actor = 'system'
): Promise<Campaign> {
  const to: CampaignStatus = withIssues ? 'completed_with_issues' : 'completed';
  return transition(id, to, {
    actor, extraUpdates: 'completed_at = NOW()',
  });
}

// ---------------------------------------------------------------------------
// Progress refresh — counts directly from prospects table
// ---------------------------------------------------------------------------

export async function refreshCampaignCounters(id: string): Promise<void> {
  await query(
    `UPDATE campaigns c
     SET
       pending_count            = COALESCE((SELECT COUNT(*) FROM prospects WHERE campaign_id = c.id AND status = 'queued'), 0),
       accepted_count           = COALESCE((SELECT COUNT(*) FROM prospects WHERE campaign_id = c.id AND status NOT IN ('queued','research_failed','thin_research','dead_letter')), 0),
       rejected_count           = COALESCE((SELECT COUNT(*) FROM prospects WHERE campaign_id = c.id AND status IN ('thin_research','research_failed','dead_letter')), 0),
       research_complete_count  = COALESCE((SELECT COUNT(*) FROM prospects WHERE campaign_id = c.id AND status IN ('research_complete','personalization_in_progress','personalized_qa_passed','qa_failed','personalization_failed','delivering','delivered')), 0),
       personalized_count       = COALESCE((SELECT COUNT(*) FROM prospects WHERE campaign_id = c.id AND status IN ('personalized_qa_passed','delivering','delivered')), 0),
       qa_passed_count          = COALESCE((SELECT COUNT(*) FROM prospects WHERE campaign_id = c.id AND status IN ('personalized_qa_passed','delivering','delivered')), 0),
       delivered_count          = COALESCE((SELECT COUNT(*) FROM prospects WHERE campaign_id = c.id AND status = 'delivered'), 0),
       failed_count             = COALESCE((SELECT COUNT(*) FROM prospects WHERE campaign_id = c.id AND status IN ('research_failed','thin_research','dead_letter','personalization_failed')), 0),
       updated_at               = NOW()
     WHERE c.id = $1`,
    [id]
  );
}

// ---------------------------------------------------------------------------
// Audit log query
// ---------------------------------------------------------------------------

export interface CampaignEvent {
  id: string;
  campaign_id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  actor: string | null;
  reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export async function getCampaignEvents(
  campaignId: string,
  limit = 50
): Promise<CampaignEvent[]> {
  return query<CampaignEvent>(
    `SELECT * FROM campaign_events WHERE campaign_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [campaignId, limit]
  );
}

// ---------------------------------------------------------------------------
// Worker eligibility check — called by research/personalize/delivery jobs
// ---------------------------------------------------------------------------

export async function isCampaignEligibleForWork(campaignId: string | null | undefined): Promise<boolean> {
  if (!campaignId) return true; // no campaign = legacy prospect, always eligible
  const row = await queryOne<{ status: string }>(
    `SELECT status FROM campaigns WHERE id = $1`,
    [campaignId]
  );
  if (!row) return true; // campaign deleted — don't block orphaned prospects
  return !campaignBlocksWork(row.status as CampaignStatus);
}
