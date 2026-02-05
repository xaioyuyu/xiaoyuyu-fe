import { httpRequest } from '@/lib/http/request';
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

// 定义的data
export type AuthResponse = {
    user: AuthUser;
};

// export type AuthResponse = ApiResponse<AuthUser>;

const register = async (payload: RegisterPayload): Promise<AuthResponse> => {
    // httpRequest<AuthUser> 返回 ApiResponse<AuthUser>，即 AuthResponse
    const response = await httpRequest<AuthResponse>({
        url: '/api/register',
        method: 'POST',
        data: payload,
    });
    return response;
};

const login = async (payload: LoginPayload): Promise<AuthResponse> => {
    // httpRequest<AuthUser> 返回 ApiResponse<AuthUser>，即 AuthResponse
    const response = await httpRequest<AuthResponse>({
        url: '/api/login',
        method: 'POST',
        data: payload,
    });
    return response;
};

const logout = async (): Promise<void> => {
    // logout 接口通常不需要返回数据，传入 void 类型
    await httpRequest<void>({
        url: '/api/logout',
        method: 'POST',
    });
};

// 获取用户信息
const getProfile = async (): Promise<AuthResponse> => {
    const response = await httpRequest<AuthResponse>({
        url: '/api/profile',
        method: 'GET',
    });
    return response;
};

// 更新用户信息
export type UpdateProfilePayload = {
    username?: string;
    email?: string;
    avatarUrl?: string;
};

const updateProfile = async (payload: UpdateProfilePayload): Promise<AuthResponse> => {
    const response = await httpRequest<AuthResponse>({
        url: '/api/profile/update',
        method: 'POST',
        data: payload,
    });
    return response;
};

// 刷新访问令牌（从 Cookie 中的 refresh_token 刷新 access_token）
const refreshToken = async (): Promise<void> => {
    // refresh-token 接口不返回数据，仅通过 Cookie 续期
    await httpRequest<void>({
        url: '/api/refresh-token',
        method: 'POST',
    });
};

export const authApi = {
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    refreshToken,
};

