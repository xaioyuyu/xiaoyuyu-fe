'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Form, Input, message } from 'antd';
import { useAuth } from '@/features/auth/hooks';
import { authApi } from '@/features/auth/api';
import type { LoginPayload } from '@/features/auth/api';

export default function AdminLoginPage() {
    const router = useRouter();
    const { login, isAuthenticated, user, hydrated } = useAuth();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!hydrated) return;

        // 已登录且是 admin，跳转到后台首页
        if (isAuthenticated && user?.role === 'admin') {
            router.push('/admin');
        }
    }, [hydrated, isAuthenticated, user, router]);

    const handleSubmit = async (values: LoginPayload) => {
        try {
            setLoading(true);
            await login(values);
            
            // 登录成功后重新获取用户信息以检查角色
            const profileRes = await authApi.getProfile();
            const currentUser = profileRes.user;
            
            if (currentUser.role === 'admin') {
                message.success('登录成功');
                router.push('/admin');
            } else {
                message.error('无权限访问后台，需要管理员角色');
            }
        } catch (error) {
            console.error('登录失败', error);
            message.error('登录失败，请检查用户名和密码');
        } finally {
            setLoading(false);
        }
    };

    if (!hydrated) {
        return null;
    }

    return (
        <div className="flex flex-1 items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-md">
                <h2 className="mb-2 text-center text-xl font-semibold text-slate-900">
                    后台管理登录
                </h2>
                <p className="mb-4 text-center text-xs text-slate-500">
                    请使用管理员账号登录
                </p>
                <Form<LoginPayload>
                    layout="vertical"
                    onFinish={handleSubmit}
                    requiredMark={false}
                >
                    <Form.Item
                        label="用户名"
                        name="username"
                        rules={[{ required: true, message: '请输入用户名' }]}
                    >
                        <Input placeholder="请输入用户名" />
                    </Form.Item>
                    <Form.Item
                        label="密码"
                        name="password"
                        rules={[{ required: true, message: '请输入密码' }]}
                    >
                        <Input.Password placeholder="请输入密码" />
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            className="w-full"
                        >
                            登录
                        </Button>
                    </Form.Item>
                </Form>
                <div className="mt-4 text-center">
                    <Button type="link" onClick={() => router.push('/')}>
                        返回前台
                    </Button>
                </div>
            </div>
        </div>
    );
}

