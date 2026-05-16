export const onboardingDismissedStorageKey = 'swf_onboarding_dismissed_v1';

export function hasDismissedOnboarding() {
  if (typeof window === 'undefined') {
    return true;
  }

  try {
    return window.localStorage?.getItem(onboardingDismissedStorageKey) === 'true';
  } catch {
    return false;
  }
}

export function dismissOnboarding() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage?.setItem(onboardingDismissedStorageKey, 'true');
  } catch {
    // Onboarding is optional, so storage failures should not block the app.
  }
}
