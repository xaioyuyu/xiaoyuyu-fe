/**
 * 后台系统配置（fs_system_config），与 OpenAPI AdminSystemConfig 一致
 */
export type SystemConfigItem = {
    id: number;
    config_key: string;
    /** 后端可能返回字符串或已解析的对象 */
    config_value: string | Record<string, unknown> | unknown[] | number | boolean | null;
    description?: string | null;
    is_active: number;
    created_at?: string;
    updated_at?: string;
};

export type SystemConfigListParams = {
    is_active?: 0 | 1;
    config_key?: string;
};

export type SystemConfigCreatePayload = {
    config_key: string;
    config_value: string | Record<string, unknown> | unknown[];
    description?: string;
    is_active?: number;
};

export type SystemConfigUpdatePayload = {
    id: number;
    config_value?: string | Record<string, unknown> | unknown[];
    description?: string;
    is_active?: number;
};
