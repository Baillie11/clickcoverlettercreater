/**
 * Fire a Google Analytics 4 custom event.
 * Falls back silently when gtag is not loaded (e.g. missing GA_ID).
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }
}

/* Pre-defined event helpers */

export const trackSignupClick = () => trackEvent("signup_button_click");
export const trackPricingView = () => trackEvent("pricing_view");
export const trackEarlyAccessSignup = () => trackEvent("early_access_signup");
export const trackLaunchAppClick = () => trackEvent("launch_app_click");
