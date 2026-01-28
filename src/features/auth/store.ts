import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { authApi, type AuthResponse, type LoginPayload, type RegisterPayload } from './api';
import type { AuthUser } from './types';

export type AuthState = {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
};

const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null,
};

const STORAGE_KEY = 'auth';

type PersistPayload = {
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
        hydrateFromStorage(state: AuthState, action: PayloadAction<PersistPayload | null>) {
            if (!action.payload) {
                return;
            }
            state.user = action.payload.user;
            state.isAuthenticated = true;
        },
        clearError(state: AuthState) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state: AuthState) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state: AuthState, action: PayloadAction<AuthResponse>) => {
                state.loading = false;
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(
                login.rejected,
                (state: AuthState, action: ReturnType<typeof login.rejected>) => {
                    state.loading = false;
                    state.error = action.payload ?? '登录失败，请稍后重试';
                },
            )
            .addCase(register.pending, (state: AuthState) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state: AuthState, action: PayloadAction<AuthResponse>) => {
                state.loading = false;
                state.user = action.payload.user;
                state.isAuthenticated = true;
                state.error = null;
            })
            .addCase(
                register.rejected,
                (state: AuthState, action: ReturnType<typeof register.rejected>) => {
                    state.loading = false;
                    state.error = action.payload ?? '注册失败，请稍后重试';
                },
            )
            .addCase(logout.pending, (state: AuthState) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(logout.fulfilled, (state: AuthState) => {
                state.loading = false;
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                state.error = null;
            })
            .addCase(
                logout.rejected,
                (state: AuthState, action: ReturnType<typeof logout.rejected>) => {
                    state.loading = false;
                    state.error = action.payload ?? '登出失败，请稍后重试';
                },
            );
    },
});

export const { hydrateFromStorage, clearError } = authSlice.actions;

export default authSlice.reducer;

