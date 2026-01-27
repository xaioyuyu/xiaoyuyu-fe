import axios, {
    type AxiosError,
    type AxiosInstance,
    type AxiosRequestConfig,
    type AxiosResponse,
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
    (config: AxiosRequestConfig) => {
        if (typeof window !== 'undefined') {
            const stored = window.localStorage.getItem('auth');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored) as { token?: string };
                    if (parsed.token) {
                        config.headers = config.headers ?? {};
                        (config.headers as Record<string, string>).Authorization = `Bearer ${parsed.token}`;
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

        // 如果是约定的 ApiResponse 结构，统一按 code 判断
        if (data && typeof data === 'object' && 'code' in (data as Record<string, unknown>)) {
            const res = data as ApiResponse<unknown>;
            if (res.code !== 0) {
                type ApiError = Error & { __raw?: unknown };
                const error: ApiError = new Error(res.message || '请求失败');
                error.__raw = res;
                return Promise.reject(error);
            }
            return res.data;
        }

        // 非标准结构则直接返回原始数据
        return data;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    },
);

export { http };
export default http;

