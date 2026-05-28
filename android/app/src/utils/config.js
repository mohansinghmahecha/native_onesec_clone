
// D:\CEO\IntentionalSpace\src\utils\config.js

// Change this to 'production' when app is ready for release
export const APP_MODE = 'debug'; // 'debug' or 'production'

export const isDebugMode = () => APP_MODE === 'debug';

export const showToastInDebug = (isDebugMode()) ? true : false;