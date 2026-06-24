import { config } from '../config.js';
import { query } from '../db.js';
import { coldSendAllowed } from '../services/deliverability/sender-guard.js';
import { logger } from '../utils/logger.js';

export interface SmartleadLeadPayload {
  prospectId: string;
  email?: string;
  firstName: string;
  lastName: string;
  companyName: string;
  subject: string;
  opener: string;
  bridge: string;
  linkedinUrl: string;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/**
 * Push to Smartlead API when configured AND the deliverability gate approves; otherwise
 * queue-only (review by hand). The gate is server-side and fail-closed: it prevents cold
 * sends from an unapproved or primary domain even when Smartlead credentials are present.
 */
export async function pushToSmartlead(payload: SmartleadLeadPayload): Promise<'pushed' | 'queued'> {
  const gate = await coldSendAllowed();
  if (!gate.allowed) {
    logger.warn('smartlead_push_gated', { reason: gate.reason, domain: gate.domain, prospectId: payload.prospectId });
    return 'queued';
  }
  if (!config.smartleadApiKey || !config.smartleadCampaignId) {
    return 'queued';
  }

  const { firstName, lastName } = splitName(
    [payload.firstName, payload.lastName].filter(Boolean).join(' ')
  );
  const body = {
    campaign_id: config.smartleadCampaignId,
    lead_list: [
      {
        first_name: firstName,
        last_name: lastName || firstName,
        company_name: payload.companyName,
        linkedin_profile: payload.linkedinUrl,
        custom_fields: {
          subject: payload.subject,
          opener: payload.opener,
          bridge: payload.bridge,
          preframe_prospect_id: payload.prospectId,
        },
      },
    ],
  };

  const res = await fetch('https://server.smartlead.ai/api/v1/campaigns/add-leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.smartleadApiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Smartlead API ${res.status}: ${text.slice(0, 300)}`);
  }

  return 'pushed';
}

export async function markSmartleadQueuePushed(
  queueId: string,
  prospectId: string
): Promise<void> {
  await query(
    `UPDATE smartlead_queue SET status = 'pushed', pushed_at = NOW() WHERE id = $1`,
    [queueId]
  );
  await query(
    `UPDATE prospects SET smartlead_status = 'pushed' WHERE id = $1`,
    [prospectId]
  );
}
