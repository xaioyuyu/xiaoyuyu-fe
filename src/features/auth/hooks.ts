'use client';

import { useCallback, useEffect } from 'react';
import type { AuthUser } from './types';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearError, hydrateFromStorage, login, logout, register, setUser as setUserAction } from './store';

export const useAuth = () => {
    const dispatch = useAppDispatch();
    const authState = useAppSelector((state) => state.auth);

    // 从 localStorage 恢复登录态，只在客户端首次挂载时执行
    // 注意：如果已经在 AppProviders 中初始化，这里可以跳过
    useEffect(() => {
        // 如果已经 hydrated，不再重复初始化
        if (authState.hydrated) return;
        if (typeof window === 'undefined') return;
        const stored = window.localStorage.getItem('auth');
        if (!stored) {
            dispatch(hydrateFromStorage(null));
            return;
        }
        try {
            const parsed = JSON.parse(stored) as { user: unknown };
            if (parsed.user) {
                dispatch(
                    hydrateFromStorage({
                        // 这里类型在 slice 中已经约束为 AuthUser，假设后端返回结构正确
                        user: parsed.user as never,
                    }),
                );
            } else {
                dispatch(hydrateFromStorage(null));
            }
        } catch {
            dispatch(hydrateFromStorage(null));
        }
    }, [dispatch, authState.hydrated]);

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

    const setUser = useCallback(
        (user: AuthUser) => {
            dispatch(setUserAction(user));
        },
        [dispatch],
    );

    return {
        ...authState,
        login: wrappedLogin,
        register: wrappedRegister,
        logout: wrappedLogout,
        clearError: resetError,
        setUser,
    };
};


