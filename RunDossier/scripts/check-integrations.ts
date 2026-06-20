import 'dotenv/config';
import { config } from '../src/config.js';
import { resendConfigured } from '../src/utils/resend.js';
import { gmailConfigured } from '../src/utils/gmail-smtp.js';
import { deliveryEmailConfigured } from '../src/utils/send-delivery-email.js';

const status = {
  telegram: Boolean(config.telegramBotToken && config.telegramChatId),
  telegramPolling: config.telegramPolling,
  telegramWebhookSecret: Boolean(config.telegramWebhookSecret),
  resend: resendConfigured(),
  gmail: gmailConfigured(),
  deliveryEmail: deliveryEmailConfigured(),
  gmailDeliveryTo: Boolean(config.gmailDeliveryTo),
  searchEnabled: config.searchEnabled,
  salesNavCookie: Boolean(config.linkedinSalesNavCookie),
};

console.log(JSON.stringify(status, null, 2));
