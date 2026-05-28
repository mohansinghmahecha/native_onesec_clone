// D:\CEO\IntentionalSpace\src\store\store.js
import { configureStore } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice';
import timerReducer from './slices/timerSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    timer: timerReducer,
  },
});