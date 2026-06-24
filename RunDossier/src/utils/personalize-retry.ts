export const MAX_SCHEDULER_PERSONALIZE_RETRIES = 2;

export function shouldSchedulerRetryPersonalize(
  failedJobCount: number,
  hasDeadLetter: boolean
): boolean {
  if (hasDeadLetter) return false;
  return failedJobCount < MAX_SCHEDULER_PERSONALIZE_RETRIES;
}
