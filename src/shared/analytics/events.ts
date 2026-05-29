type AnalyticsPayload = Record<string, string | number | boolean | undefined>;

export function trackGameEvent(name: string, payload: AnalyticsPayload = {}) {
  if (import.meta.env.DEV) {
    console.info(`[analytics] ${name}`, payload);
  }
}
