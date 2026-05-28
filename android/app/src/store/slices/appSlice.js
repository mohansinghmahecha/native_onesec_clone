// D:\CEO\IntentionalSpace\src\store\slices\appSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  blockedApps: {
    instagram: true,
    youtube: true,
    twitter: false,
    reddit: false,
    facebook: false,
  },
  strictMode: false,
  isAccessibilityEnabled: false,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    toggleApp: (state, action) => {
      state.blockedApps[action.payload] = !state.blockedApps[action.payload];
    },
    setStrictMode: (state, action) => {
      state.strictMode = action.payload;
    },
    setBlockedApps: (state, action) => {
      state.blockedApps = action.payload;
    },
    setAccessibilityStatus: (state, action) => {
      state.isAccessibilityEnabled = action.payload;
    },
  },
});

export const { toggleApp, setStrictMode, setBlockedApps, setAccessibilityStatus } = appSlice.actions;
export default appSlice.reducer;