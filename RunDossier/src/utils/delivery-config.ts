import { config } from '../config.js';
import { deliveryEmailConfigured } from './send-delivery-email.js';
import { resendConfigured } from './resend.js';
import { gmailConfigured } from './gmail-smtp.js';
import { logger } from './logger.js';

/** Log delivery provider readiness at worker startup (non-fatal). */
export function warnDeliveryConfigAtStartup(): void {
  if (!deliveryEmailConfigured()) {
    logger.warn('delivery_provider_missing', {
      hint: 'Set RESEND_API_KEY or GMAIL_USER+GMAIL_APP_PASSWORD — W5 will fail until configured',
      csv_only: config.deliveryCsvOnly,
    });
    return;
  }

  const providers: string[] = [];
  if (resendConfigured()) providers.push('resend');
  if (gmailConfigured()) providers.push('gmail');

  logger.info('delivery_provider_ready', {
    providers: providers.join('+'),
    from: config.deliveryFromEmail,
    sandbox_fallback: config.resendSandboxFallback,
  });

  if (resendConfigured() && !gmailConfigured()) {
    logger.info('delivery_resend_note', {
      hint: 'Verify DELIVERY_FROM_EMAIL domain on resend.com/domains; sandbox fallback is enabled by default',
    });
  }
}
