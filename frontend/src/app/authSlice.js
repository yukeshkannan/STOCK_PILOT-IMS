import { createSlice } from '@reduxjs/toolkit';

const initialUser = localStorage.getItem('stockpilot_user')
  ? JSON.parse(localStorage.getItem('stockpilot_user'))
  : null;

const initialToken = localStorage.getItem('stockpilot_token') || null;

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialUser,
    token: initialToken,
    isAuthenticated: !!initialToken
  },
  reducers: {
    setCredentials: (state, action) => {
      const user = action.payload?.user;
      const tokens = action.payload?.tokens || {};
      const accessToken = tokens.accessToken || action.payload?.token || '';
      
      state.user = user;
      state.token = accessToken;
      state.isAuthenticated = !!accessToken;

      if (user) {
        localStorage.setItem('stockpilot_user', JSON.stringify(user));
      }
      if (accessToken) {
        localStorage.setItem('stockpilot_token', accessToken);
      }
      if (tokens.refreshToken) {
        localStorage.setItem('stockpilot_refresh_token', tokens.refreshToken);
      }
    },
    updateProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('stockpilot_user', JSON.stringify(state.user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      localStorage.removeItem('stockpilot_user');
      localStorage.removeItem('stockpilot_token');
      localStorage.removeItem('stockpilot_refresh_token');
    }
  }
});

export const { setCredentials, updateProfile, logout } = authSlice.actions;
export default authSlice.reducer;
