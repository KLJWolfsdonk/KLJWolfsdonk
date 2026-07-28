import { getDashboardStats } from '../services/statsService.js';

/**
 * HTTP-endpoints voor later gebruik met Cloud Functions.
 */
export function healthCheck() {
	return { ok: true };
}

export function dashboardSummary() {
	return getDashboardStats();
}
