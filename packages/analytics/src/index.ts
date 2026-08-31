export type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>

export interface AnalyticsAdapter {
  capture(event: string, properties?: AnalyticsProperties): void
}

export function scopedAnalytics(adapter: AnalyticsAdapter, customerSlug: string): AnalyticsAdapter {
  return {
    capture(event, properties = {}) {
      adapter.capture(event, { customer_slug: customerSlug, ...properties })
    },
  }
}

export const noOpAnalytics: AnalyticsAdapter = { capture() {} }
