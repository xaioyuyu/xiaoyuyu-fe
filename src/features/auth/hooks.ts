'use client';

import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearError, hydrateFromStorage, login, logout, register } from './store';

export const useAuth = () => {
    const dispatch = useAppDispatch();
    const authState = useAppSelector((state) => state.auth);

    // 从 localStorage 恢复登录态，只在客户端首次挂载时执行
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const stored = window.localStorage.getItem('auth');
        if (!stored) return;
        try {
            const parsed = JSON.parse(stored) as { user: unknown };
            if (parsed.user) {
                dispatch(
                    hydrateFromStorage({
                        // 这里类型在 slice 中已经约束为 AuthUser，假设后端返回结构正确
                        user: parsed.user as never,
                    }),
                );
            }
        } catch {
            // ignore
        }
    }, [dispatch]);

    const wrappedLogin = useCallback(
        (payload: Parameters<typeof login>[0]) => dispatch(login(payload)).unwrap(),
        [dispatch],
    );

    const wrappedRegister = useCallback(
        (payload: Parameters<typeof register>[0]) => dispatch(register(payload)).unwrap(),
        [dispatch],
    );

    const wrappedLogout = useCallback(
        () => dispatch(logout()).unwrap(),
        [dispatch],
    );

    const resetError = useCallback(
        () => dispatch(clearError()),
        [dispatch],
    );

    return {
        ...authState,
        login: wrappedLogin,
        register: wrappedRegister,
        logout: wrappedLogout,
        clearError: resetError,
    };
};


