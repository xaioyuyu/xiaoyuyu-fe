'use client';

import { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { store } from '@/store';
import { hydrateFromStorage } from '@/features/auth/store';
// 导入 dayjs 配置，设置默认时区为中国时区
import '@/lib/utils/dayjs';

// 客户端初始化：从 localStorage 恢复状态（在模块加载时执行，确保在首次渲染前完成）
if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem('auth');
    if (!stored) {
        store.dispatch(hydrateFromStorage(null));
    } else {
        try {
            const parsed = JSON.parse(stored) as { user: unknown };
            if (parsed.user) {
                store.dispatch(
                    hydrateFromStorage({
                        user: parsed.user as never,
                    }),
                );
            } else {
                store.dispatch(hydrateFromStorage(null));
            }
        } catch {
            store.dispatch(hydrateFromStorage(null));
        }
    }
}

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
    const initializedRef = useRef(false);

    // 标记 antd 样式已就绪，显示页面内容
    useEffect(() => {
        if (!initializedRef.current) {
            // 延迟一帧，确保 antd 样式已注入
            requestAnimationFrame(() => {
                document.body.classList.add('antd-ready');
            });
            initializedRef.current = true;
        }
    }, []);

    return (
        <Provider store={store}>
            <ConfigProvider locale={zhCN}>
                {children}
            </ConfigProvider>
        </Provider>
    );
};


