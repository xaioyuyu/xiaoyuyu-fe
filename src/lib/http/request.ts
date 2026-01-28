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
});

// 请求拦截器：自动附加 Authorization 头
http.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (typeof window !== 'undefined') {
            const stored = window.localStorage.getItem('auth');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored) as { token?: string };
                    if (parsed.token) {
                        // Axios v1 的 headers 是 AxiosHeaders，这里保持简单字符串覆盖即可
                        const headers = config.headers || {};
                        (headers as Record<string, string>)['Authorization'] = `Bearer ${parsed.token}`;
                        config.headers = headers;
                    }
                } catch {
                    // 忽略解析错误，避免影响正常请求
                }
            }
        }
        return config;
    },
    (error: AxiosError | unknown) => Promise.reject(error),
);

// 响应拦截器：统一处理业务 code & 错误
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
    (error: AxiosError) => {
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

