import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { authApi, type AuthResponse, type LoginPayload, type RegisterPayload } from './api';
import type { AuthUser } from './types';

export type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  hydrated: boolean; // 是否已从本地存储完成一次初始化
};

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  hydrated: false,
};

const STORAGE_KEY = 'auth';

export type PersistPayload = {
  user: AuthUser;
};

const persistAuth = (payload: PersistPayload | null) => {
  if (typeof window === 'undefined') return;
  if (!payload) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

export const login = createAsyncThunk<AuthResponse, LoginPayload, { rejectValue: string }>(
  'auth/login',
  async (payload: LoginPayload, helpers) => {
    try {
      const res = await authApi.login(payload);
      if (typeof window !== 'undefined') {
        persistAuth({ user: res.user });
      }
      return res;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '登录失败，请稍后重试';
      return helpers.rejectWithValue(message);
    }
  },
);

export const register = createAsyncThunk<AuthResponse, RegisterPayload, { rejectValue: string }>(
  'auth/register',
  async (payload: RegisterPayload, helpers) => {
    try {
      const res = await authApi.register(payload);
      if (typeof window !== 'undefined') {
        persistAuth({ user: res.user });
      }
      return res;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '注册失败，请稍后重试';
      return helpers.rejectWithValue(message);
    }
  },
);

export const logout = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async (_payload: void, helpers) => {
    try {
      await authApi.logout();
      if (typeof window !== 'undefined') {
        persistAuth(null);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '登出失败，请稍后重试';
      return helpers.rejectWithValue(message);
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 从本地存储恢复登录态；无论是否有 payload，都标记 hydrated = true
    hydrateFromStorage(state, action: PayloadAction<PersistPayload | null>) {
      state.hydrated = true;
      if (!action.payload) {
        state.user = null;
        state.isAuthenticated = false;
        return;
      }
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    clearError(state) {
      state.error = null;
    },
    /** 更新当前用户（如资料页保存后同步全局与 localStorage，供头部等组件使用） */
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      if (typeof window !== 'undefined') {
        persistAuth({ user: action.payload });
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.hydrated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? '登录失败，请稍后重试';
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.hydrated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? '注册失败，请稍后重试';
      })
      .addCase(logout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        state.hydrated = true;
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? '登出失败，请稍后重试';
      });
  },
});

export const { hydrateFromStorage, clearError, setUser } = authSlice.actions;

export default authSlice.reducer;

