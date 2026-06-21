import { query } from '../db.js';
import { sendFollowUp, pauseStalled, type OnboardingClient } from '../services/onboarding.service.js';

const COLS =
  'id, name, contact_email, client_first_name, status, onboarding_token, approval_token, icp_brief, icp_parsed';

/** 72h with no form -> follow-up (once); 7 days -> pause + alert. */
export async function runOnboardingTimers(): Promise<void> {
  const dueFollowUp = await query<OnboardingClient>(
    `SELECT ${COLS} FROM clients
     WHERE status = 'onboarding'
       AND form_submitted_at IS NULL
       AND follow_up_sent_at IS NULL
       AND form_sent_at IS NOT NULL
       AND form_sent_at < NOW() - INTERVAL '72 hours'
     LIMIT 50`
  );
  for (const c of dueFollowUp) {
    try {
      await sendFollowUp(c);
    } catch (e) {
      console.error('[onboarding-timers] follow-up failed:', (e as Error).message);
    }
  }

  const duePause = await query<OnboardingClient>(
    `SELECT ${COLS} FROM clients
     WHERE status = 'onboarding'
       AND form_submitted_at IS NULL
       AND form_sent_at IS NOT NULL
       AND form_sent_at < NOW() - INTERVAL '7 days'
     LIMIT 50`
  );
  for (const c of duePause) {
    try {
      await pauseStalled(c);
    } catch (e) {
      console.error('[onboarding-timers] pause failed:', (e as Error).message);
    }
  }
}
