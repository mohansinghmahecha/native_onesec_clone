/** Shared app metadata: JS keys, Android package names, defaults */
export const TRACKED_APPS = [
  {
    key: 'instagram',
    name: 'Instagram',
    icon: '📸',
    packageName: 'com.instagram.android',
    defaultSessionMinutes: 15,
    defaultDailyMinutes: 120,
  },
  {
    key: 'youtube',
    name: 'YouTube',
    icon: '🎬',
    packageName: 'com.google.android.youtube',
    defaultSessionMinutes: 15,
    defaultDailyMinutes: 60,
  },
  {
    key: 'twitter',
    name: 'X / Twitter',
    icon: '🐦',
    packageName: 'com.twitter.android',
    defaultSessionMinutes: 10,
    defaultDailyMinutes: 30,
  },
  {
    key: 'reddit',
    name: 'Reddit',
    icon: '🤖',
    packageName: 'com.reddit.frontpage',
    defaultSessionMinutes: 15,
    defaultDailyMinutes: 45,
  },
  {
    key: 'facebook',
    name: 'Facebook',
    icon: '👥',
    packageName: 'com.facebook.katana',
    defaultSessionMinutes: 15,
    defaultDailyMinutes: 30,
  },
];

export const PACKAGE_TO_KEY = Object.fromEntries(
  TRACKED_APPS.map((a) => [a.packageName, a.key]),
);

export const KEY_TO_PACKAGE = Object.fromEntries(
  TRACKED_APPS.map((a) => [a.key, a.packageName]),
);

export function getAppByKey(key) {
  return TRACKED_APPS.find((a) => a.key === key);
}

export function getAppByPackage(packageName) {
  return TRACKED_APPS.find((a) => a.packageName === packageName);
}

export function defaultBlockedAppsState() {
  return {
    instagram: true,
    youtube: true,
    twitter: false,
    reddit: false,
    facebook: false,
  };
}

export function defaultSessionLimits() {
  return Object.fromEntries(
    TRACKED_APPS.map((a) => [a.key, a.defaultSessionMinutes]),
  );
}
