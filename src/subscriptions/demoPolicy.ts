export const demoPolicy = {
  code: 'DASHWORD-REVIEW-2026',
  revision: 'review-2026-11',
  expiresAt: Date.parse('2026-11-21T00:00:00-05:00'),
};

export function demoIsValid(revision: string | null, now = Date.now()): boolean {
  return revision === demoPolicy.revision && Number.isFinite(now) && now < demoPolicy.expiresAt;
}

export function demoCodeMatches(code: string): boolean {
  return code.trim().toUpperCase() === demoPolicy.code;
}
