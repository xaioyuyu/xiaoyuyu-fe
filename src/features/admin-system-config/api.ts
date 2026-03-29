import { httpRequest } from '@/lib/http/request';
import type {
    SystemConfigCreatePayload,
    SystemConfigItem,
    SystemConfigListParams,
    SystemConfigUpdatePayload,
} from './types';

function normalizeConfigList(data: unknown): SystemConfigItem[] {
    if (Array.isArray(data)) {
        return data as SystemConfigItem[];
    }
    if (
        data &&
        typeof data === 'object' &&
        'list' in data &&
        Array.isArray((data as { list: unknown }).list)
    ) {
        return (data as { list: SystemConfigItem[] }).list;
    }
    return [];
}

export const listSystemConfigs = async (
    params?: SystemConfigListParams,
): Promise<SystemConfigItem[]> => {
    const raw = await httpRequest<unknown>({
        url: '/api/admin/system-config/list',
        method: 'POST',
        data: params ?? {},
    });
    return normalizeConfigList(raw);
};

export const getSystemConfigDetail = async (id: number): Promise<SystemConfigItem> => {
    return httpRequest<SystemConfigItem>({
        url: '/api/admin/system-config/detail',
        method: 'POST',
        data: { id },
    });
};

export const createSystemConfig = async (
    payload: SystemConfigCreatePayload,
): Promise<void> => {
    await httpRequest<void>({
        url: '/api/admin/system-config',
        method: 'POST',
        data: payload,
    });
};

export const updateSystemConfig = async (
    payload: SystemConfigUpdatePayload,
): Promise<void> => {
    await httpRequest<void>({
        url: '/api/admin/system-config/update',
        method: 'PUT',
        data: payload,
    });
};

export const deleteSystemConfig = async (id: number): Promise<void> => {
    await httpRequest<void>({
        url: '/api/admin/system-config/delete',
        method: 'DELETE',
        data: { id },
    });
};
