// D:\CEO\IntentionalSpace\src\store\slices\timerSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeTimers: [],
  unlockedApps: [],
};

const timerSlice = createSlice({
  name: 'timer',
  initialState,
  reducers: {
    addTimer: (state, action) => {
      state.activeTimers.push(action.payload);
    },
    removeTimer: (state, action) => {
      state.activeTimers = state.activeTimers.filter(t => t.id !== action.payload);
    },
    addUnlockedApp: (state, action) => {
      state.unlockedApps.push(action.payload);
    },
    removeUnlockedApp: (state, action) => {
      state.unlockedApps = state.unlockedApps.filter(app => app.package !== action.payload);
    },
  },
});

export const { addTimer, removeTimer, addUnlockedApp, removeUnlockedApp } = timerSlice.actions;
export default timerSlice.reducer;