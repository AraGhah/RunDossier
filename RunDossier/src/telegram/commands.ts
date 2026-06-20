import { query, queryOne } from '../db.js';
import { config } from '../config.js';
import { sendTelegramMessage } from './api.js';
import { runAllEnabledSearches } from '../services/prospect-search.js';
import { runDelivery } from '../jobs/delivery.job.js';
import { runPipelineDigest } from '../jobs/pipeline-digest.job.js';
import { runScheduler } from '../jobs/scheduler.job.js';
import { logger } from '../utils/logger.js';
import {
  createWorkflowRun,
  getActiveWorkflowRun,
  updateWorkflowRun,
  countThinResearch,
  getPipelineCounts,
} from '../services/workflow-run.js';
import {
  parseTelegramCommand,
  isAuthorizedTelegramChat,
  sanitizeTelegramError,
  isLongRunningCommand,
} from './parse.js';

const STATUS_LABELS: Record<string, string> = {
  queued: 'En file',
  research_in_progress: 'Recherche en cours',
  research_complete: 'Recherche terminée',
  thin_research: 'Recherche faible',
  research_failed: 'Échec recherche',
  personalization_in_progress: 'Personnalisation en cours',
  personalized_qa_passed: 'QA OK — prêt à livrer',
  qa_failed: 'Échec QA',
  personalization_failed: 'Échec personnalisation',
  delivering: 'Livraison en cours',
  delivered: 'Livrés',
};

async function logBotCommand(
  updateId: number,
  command: string,
  args: string,
  chatId: number,
  result: 'ok' | 'error' | 'denied' | 'duplicate',
  detail?: string,
  runId?: string
): Promise<void> {
  await query(
    `INSERT INTO telegram_command_log (update_id, command, args, chat_id, result, detail)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      updateId,
      command,
      args.slice(0, 200),
      chatId,
      result,
      [detail?.slice(0, 450), runId ? `run=${runId}` : ''].filter(Boolean).join(' | ') || null,
    ]
  ).catch((e) => logger.warn('telegram_command_log_failed', { error: (e as Error).message }));
}

export async function isDuplicateTelegramUpdate(updateId: number): Promise<boolean> {
  const [row] = await query<{ update_id: number }>(
    `INSERT INTO telegram_updates (update_id) VALUES ($1)
     ON CONFLICT (update_id) DO NOTHING
     RETURNING update_id`,
    [updateId]
  );
  return !row;
}

async function buildStatusReport(): Promise<string> {
  const counts = await getPipelineCounts();
  const thin = counts.thin_research ?? 0;
  const ready = counts.personalized_qa_passed ?? 0;
  const active =
    (counts.queued ?? 0) +
    (counts.research_in_progress ?? 0) +
    (counts.personalization_in_progress ?? 0);

  const activeRun = await getActiveWorkflowRun();
  const failures = await query<{ workflow: string; error: string }>(
    `SELECT workflow, error FROM failed_jobs ORDER BY created_at DESC LIMIT 5`
  );

  const lines = [
    '📋 Statut pipeline',
    '',
    ...Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => `• ${STATUS_LABELS[status] ?? status}: ${count}`),
    '',
    `Actifs (en cours): ${active}`,
    `Prêts à livrer: ${ready}`,
    `Recherche faible (exclus): ${thin}`,
  ];

  if (activeRun) {
    lines.push('', `Run en cours: ${activeRun.id.slice(0, 8)}… (${activeRun.stage})`);
  }

  if (failures.length > 0) {
    lines.push('', 'Derniers échecs:');
    for (const f of failures) {
      const err = f.error.length > 100 ? `${f.error.slice(0, 97)}...` : f.error;
      lines.push(`• [${f.workflow}] ${err}`);
    }
  }

  return lines.join('\n');
}

async function handleSearchCommand(chatId: number, runId?: string): Promise<string> {
  if (!config.searchEnabled) {
    return '⚠️ W1 désactivé (SEARCH_ENABLED=false).';
  }

  if (runId) await updateWorkflowRun(runId, { stage: 'searching' });

  const results = await runAllEnabledSearches();
  const totalFound = results.reduce((s, r) => s + r.leadsFound, 0);
  const totalIngested = results.reduce((s, r) => s + r.ingested, 0);
  const totalSkipped = results.reduce((s, r) => s + r.skipped, 0);

  if (runId) {
    await updateWorkflowRun(runId, {
      prospects_found: totalFound,
      prospects_ingested: totalIngested,
      prospects_skipped: totalSkipped,
    });
  }

  if (results.length === 0) {
    return '⚠️ Aucun profil de recherche actif. Configurez client_search_profiles.';
  }

  return (
    `✅ W1 terminé\n` +
    `• Profils: ${results.length}\n` +
    `• Trouvés: ${totalFound} → ${totalIngested} ingérés\n` +
    `• Ignorés: ${totalSkipped}` +
    (runId ? `\n• Run: ${runId.slice(0, 8)}…` : '')
  );
}

async function handleDeliveryCommand(chatId: number, runId?: string): Promise<string> {
  if (runId) await updateWorkflowRun(runId, { stage: 'delivering' });

  const thinCount = await countThinResearch();
  const summary = await runDelivery();
  await runPipelineDigest(summary);

  if (runId) {
    await updateWorkflowRun(runId, {
      prospects_delivered: summary.prospectsDelivered,
      prospects_thin_research: thinCount,
      stage: 'completed',
      status: summary.errors.length > 0 ? 'partial' : 'completed',
      completed: true,
    });
  }

  return (
    `✅ Livraison terminée\n` +
    `• Clients: ${summary.clientsProcessed}\n` +
    `• Livrés: ${summary.prospectsDelivered}\n` +
    `• Recherche faible (exclus): ${thinCount}` +
    (summary.errors.length > 0 ? `\n• Erreurs: ${summary.errors.join('; ')}` : '') +
    (runId ? `\n• Run: ${runId.slice(0, 8)}…` : '')
  );
}

async function handleRunCommand(chatId: number): Promise<string> {
  const existing = await getActiveWorkflowRun();
  if (existing) {
    return `⏳ Un run est déjà en cours (${existing.id.slice(0, 8)}…, étape: ${existing.stage}). Utilisez /status.`;
  }

  const run = await createWorkflowRun({ triggerSource: 'telegram', triggerRef: String(chatId) });

  try {
    await updateWorkflowRun(run.id, { stage: 'scheduling' });
    await runScheduler();

    let searchMsg = '';
    if (config.searchEnabled) {
      const searchResult = await handleSearchCommand(chatId, run.id);
      searchMsg = `\n${searchResult.split('\n').slice(1).join('\n')}`;
    }

    await updateWorkflowRun(run.id, { stage: 'delivering' });
    const deliveryResult = await handleDeliveryCommand(chatId, run.id);

    const counts = await getPipelineCounts();
    return (
      `✅ Run lancé — ${run.id.slice(0, 8)}…\n` +
      `• Scheduler: OK (W3/W4 s'exécutent en arrière-plan via workers)\n` +
      searchMsg +
      `\n${deliveryResult.split('\n').slice(1).join('\n')}\n` +
      `• En file: ${counts.queued ?? 0} | Recherche: ${counts.research_in_progress ?? 0} | Perso: ${counts.personalization_in_progress ?? 0}\n` +
      `⏳ Utilisez /status — la recherche et la personnalisation ne sont pas synchrones.`
    );
  } catch (err) {
    await updateWorkflowRun(run.id, {
      stage: 'failed',
      status: 'failed',
      error_message: sanitizeTelegramError((err as Error).message),
      completed: true,
    });
    throw err;
  }
}

const HELP_TEXT = `🤖 Preframe / Dossier Bot

Commandes:
/status — état du pipeline
/search — lancer W1 (prospect search)
/delivery — livrer les prospects QA OK (W5)
/run — scheduler + W1 + livraison (W3/W4 async — voir /status)
/digest — rapport horaire immédiat
/help — cette aide

Les prospects thin_research sont exclus de la personnalisation et de la livraison.`;

export async function handleTelegramCommand(
  updateId: number,
  chatId: number,
  text: string
): Promise<void> {
  const { command, args, isCommand } = parseTelegramCommand(text);

  if (!isAuthorizedTelegramChat(chatId, config.telegramChatId)) {
    await logBotCommand(updateId, command || 'unknown', args, chatId, 'denied', 'unauthorized chat');
    await sendTelegramMessage(chatId, '⛔ Chat non autorisé.');
    return;
  }

  if (isCommand && isLongRunningCommand(command)) {
    const active = await getActiveWorkflowRun();
    if (active && command === 'run') {
      await logBotCommand(updateId, command, args, chatId, 'duplicate', 'run already active', active.id);
      await sendTelegramMessage(
        chatId,
        `⏳ Run déjà actif (${active.id.slice(0, 8)}…). /status pour suivre.`
      );
      return;
    }
    await sendTelegramMessage(chatId, `✅ Requête reçue — /${command} en cours…`);
  } else if (isCommand) {
    await sendTelegramMessage(chatId, `✅ Requête reçue — /${command}`);
  }

  try {
    let response: string;

    switch (command) {
      case 'start':
      case 'help':
        response = HELP_TEXT;
        break;
      case 'status':
        response = await buildStatusReport();
        break;
      case 'search':
        response = await handleSearchCommand(chatId);
        break;
      case 'delivery':
        response = await handleDeliveryCommand(chatId);
        break;
      case 'run':
        response = await handleRunCommand(chatId);
        break;
      case 'digest':
        await runPipelineDigest();
        response = '✅ Rapport horaire envoyé.';
        break;
      default:
        response = isCommand
          ? `❌ Commande inconnue: /${command}\n\n${HELP_TEXT}`
          : `❌ Message non reconnu. Utilisez /help.`;
    }

    await sendTelegramMessage(chatId, response);
    await logBotCommand(updateId, command || 'message', args, chatId, 'ok');
  } catch (err) {
    const message = sanitizeTelegramError((err as Error).message);
    logger.error('telegram_command_error', { command, error: message });
    await logBotCommand(updateId, command, args, chatId, 'error', message);
    await sendTelegramMessage(chatId, `❌ Erreur: ${message}`);
  }
}
