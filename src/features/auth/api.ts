import http from '@/lib/http/request';
import type { AuthUser } from './types';

export type RegisterPayload = {
    username: string;
    email: string;
    password: string;
};

export type LoginPayload = {
    username: string;
    password: string;
};

export type AuthResponse = {
    user: AuthUser;
    token: string;
};

const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
    const response = await http.post<AuthResponse>('/api/register', payload);
    return response.data;
};

const login = async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await http.post<AuthResponse>('/api/login', payload);
    return response.data;
};

const logout = async (): Promise<void> => {
    await http.post<void>('/api/logout');
};

export const authApi = {
    register,
    login,
    logout,
};

