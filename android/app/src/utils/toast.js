// D:\CEO\IntentionalSpace\src\utils\toast.js
import Toast from 'react-native-toast-message';
import { isDebugMode } from './config';

export const showToast = (type, title, message) => {
  // Only show toasts in debug mode
  if (!isDebugMode()) return;
  
  Toast.show({
    type: type, // 'success', 'error', 'info'
    text1: title,
    text2: message,
    position: 'bottom',
    visibilityTime: 3000,
    autoHide: true,
    topOffset: 30,
    bottomOffset: 40,
  });
};

export const showSuccess = (title, message) => {
  showToast('success', title, message);
};

export const showError = (title, message) => {
  showToast('error', title, message);
};

export const showInfo = (title, message) => {
  showToast('info', title, message);
};