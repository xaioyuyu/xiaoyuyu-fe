import axios, {
    type AxiosError,
    type AxiosInstance,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
    type AxiosRequestConfig,
} from 'axios';
import type { ApiResponse } from './types';

// 后端基础地址，可根据环境变量进行调整
const baseURL = 'http://localhost:3030';

// 创建 axios 实例
const http: AxiosInstance = axios.create({
    baseURL,
    timeout: 10000,
    withCredentials: true, // 允许跨域请求携带 cookie
});

// Token 刷新相关状态管理
let isRefreshing = false; // 是否正在刷新 token
let refreshPromise: Promise<void> | null = null; // 刷新 token 的 Promise，用于并发请求共享

/**
 * 清除登录状态并跳转到登录页
 */
const clearAuthAndRedirect = () => {
    if (typeof window === 'undefined') return;

    // 清除本地存储的认证信息
    window.localStorage.removeItem('auth');

    // 跳转到登录页（避免循环重定向，检查当前路径）
    if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
    }
};

/**
 * 刷新访问令牌
 * 使用 Promise 锁机制，确保多个并发请求只触发一次刷新
 */
const refreshAccessToken = async (): Promise<void> => {
    // 如果正在刷新，直接返回现有的 Promise
    if (isRefreshing && refreshPromise) {
        return refreshPromise;
    }

    // 开始刷新
    isRefreshing = true;
    refreshPromise = (async () => {
        try {
            // 调用刷新接口（从 Cookie 中的 refresh_token 刷新 access_token）
            // http 实例已配置 withCredentials: true，会自动携带 Cookie
            // 刷新请求如果返回 401，会被响应拦截器捕获并排除（通过 URL 判断），不会无限循环
            await http.post('/api/refresh-token', {});
            // 刷新成功，新的 access_token 已通过 Cookie 设置
        } catch (error) {
            // 刷新失败，清除状态并跳转登录页
            clearAuthAndRedirect();
            throw error; // 重新抛出错误，让调用方知道刷新失败
        } finally {
            // 重置刷新状态
            isRefreshing = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
};

// 请求拦截器：当前使用 Cookie 认证（access_token + refresh_token），
// 浏览器通过 withCredentials: true 自动携带 Cookie，无需手动设置 Authorization 头
http.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // 所有请求都会自动携带 Cookie（access_token 和 refresh_token）
        // 无需额外处理
        return config;
    },
    (error: AxiosError | unknown) => Promise.reject(error),
);

// 响应拦截器：统一处理业务 code & 错误，以及 401 自动刷新 token
http.interceptors.response.use(
    (response: AxiosResponse<ApiResponse<unknown> | unknown>) => {
        const data = response.data;

        // 如果是约定的 ApiResponse 结构，统一按 code 判断；否则保持原样返回 response
        if (data && typeof data === 'object' && 'code' in (data as Record<string, unknown>)) {
            const res = data as ApiResponse<unknown>;
            if (res.code !== 0) {
                type ApiError = Error & { __raw?: unknown };
                const error: ApiError = new Error(res.message || '请求失败');
                error.__raw = res;
                return Promise.reject(error);
            }
        }

        // 返回原始 AxiosResponse，调用方通过 response.data 使用
        // 完整的响应返回回去
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // 处理 401 未授权错误（HTTP 状态码）
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            // 标记此请求已重试，避免无限循环
            originalRequest._retry = true;

            // 排除刷新 token 接口本身，避免死循环
            if (originalRequest.url?.includes('/api/refresh-token')) {
                // 刷新 token 接口也返回 401，说明 refresh_token 已失效
                clearAuthAndRedirect();
                return Promise.reject(error);
            }

            try {
                // 尝试刷新 token（使用 Promise 锁，多个并发请求共享同一个刷新操作）
                await refreshAccessToken();

                // 刷新成功，重试原请求
                // 新的 access_token 已通过 Cookie 自动携带，直接重试即可
                return http(originalRequest);
            } catch (refreshError) {
                // 刷新失败，已在上层 clearAuthAndRedirect，这里直接 reject
                return Promise.reject(refreshError);
            }
        }

        // 其他错误直接 reject
        return Promise.reject(error);
    },
);

export type HttpOptions = {
    /**
     * 是否返回完整 ApiResponse 格式
     * - false（默认）：返回 response.data.data（即 T 类型）
     * - true：返回完整 ApiResponse<T> 格式（即 { code, message, data: T }）
     */
    raw?: boolean;
};

/**
 * 通用请求方法，支持通过 options.raw 控制返回类型
 * 
 * @example
 * // 默认返回 T 类型（解包后的 data）
 * const user = await httpRequest<AuthUser>({ url: '/api/login', method: 'POST' });
 * // user 类型为 AuthUser
 * 
 * @example
 * // 传入 raw: true 返回完整 ApiResponse<T>
 * const response = await httpRequest<AuthUser>(
 *   { url: '/api/login', method: 'POST' },
 *   { raw: true }
 * );
 * // response 类型为 ApiResponse<AuthUser>，即 { code, message, data: AuthUser }
 */
// 函数重载：当 raw: true 时返回 ApiResponse<T>
export function httpRequest<T>(
    config: AxiosRequestConfig,
    options: { raw: true },
): Promise<ApiResponse<T>>;
// 函数重载：当 raw: false 或未传入时返回 T
export function httpRequest<T>(
    config: AxiosRequestConfig,
    options?: { raw?: false } | undefined,
): Promise<T>;
// 实现函数
export async function httpRequest<T>(
    config: AxiosRequestConfig,
    options?: HttpOptions,
): Promise<ApiResponse<T> | T> {
    // 响应拦截器已经处理了 code !== 0 的情况（会 reject），
    // 这里直接返回 response.data，它已经是 ApiResponse<T> 格式
    const response = await http.request<ApiResponse<T>>(config);
    if (options?.raw) {
        return response.data; // 返回 ApiResponse<T>
    }
    return response.data.data; // 返回 T
}

export { http };
export default http;

