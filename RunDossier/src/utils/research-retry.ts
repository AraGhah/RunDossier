/** Terminal Apify / research failures — scheduler must not retry these indefinitely. */
const TERMINAL_KINDS = new Set(['auth', 'bad_input', 'empty_dataset', 'rate_limit']);

const TERMINAL_MESSAGE_PATTERNS = [
  /No LinkedIn profile returned/i,
  /free user run limit|run limit exceeded/i,
  /approve its permissions|approvePermissions/i,
  /unsupported unicode escape sequence/i,
];

/**
 * True when the latest failed_jobs row indicates re-research will not succeed
 * without input or config changes.
 */
export function isTerminalResearchError(error: string | null | undefined): boolean {
  if (!error) return false;
  const kindMatch = error.match(/kind=(\w+)/);
  if (kindMatch && TERMINAL_KINDS.has(kindMatch[1])) return true;
  return TERMINAL_MESSAGE_PATTERNS.some((re) => re.test(error));
}

/** Max automatic scheduler retries for research_failed before giving up. */
export const MAX_SCHEDULER_RESEARCH_RETRIES = 5;

export function shouldSchedulerRetryResearch(
  failedJobCount: number,
  latestError: string | null | undefined
): boolean {
  if (failedJobCount >= MAX_SCHEDULER_RESEARCH_RETRIES) return false;
  if (isTerminalResearchError(latestError)) return false;
  return true;
}
