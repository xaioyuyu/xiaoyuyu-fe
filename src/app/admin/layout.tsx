'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks';
import { Spin } from 'antd';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { user, isAuthenticated, hydrated } = useAuth();

    useEffect(() => {
        if (!hydrated) return;

        // 未登录则跳转到登录页
        if (!isAuthenticated) {
            router.push('/admin/login');
            return;
        }

        // 已登录但不是 admin，跳转到前台首页
        if (user && user.role !== 'admin') {
            router.push('/');
            return;
        }
    }, [hydrated, isAuthenticated, user, router]);

    // 等待认证状态恢复
    if (!hydrated) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Spin size="large" />
            </div>
        );
    }

    // 未登录或非 admin，等待跳转（不渲染内容）
    if (!isAuthenticated || (user && user.role !== 'admin')) {
        return null;
    }

    return <div className="flex flex-1 flex-col">{children}</div>;
}

