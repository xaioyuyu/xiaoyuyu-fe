'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Form, Input, Card, message } from 'antd';
import { useAuth } from '@/features/auth/hooks';
import { authApi, type UpdateProfilePayload } from '@/features/auth/api';
import type { AuthUser } from '@/features/auth/types';

const ProfilePage = () => {
    const router = useRouter();
    const { user: currentUser, isAuthenticated, hydrated, setUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [form] = Form.useForm();
    const [userInfo, setUserInfo] = useState<AuthUser | null>(null);

    // 初始化用户信息：优先使用已存在的 auth.user，避免刷新时出现额外 loading
    // const loadUserProfile = async () => {
    //     try {
    //         const { user } = await authApi.getProfile();
    //         setUserInfo(user);
    //         form.setFieldsValue({
    //             username: user.username,
    //             email: user.email,
    //             avatarUrl: user.avatarUrl || '',
    //         });
    //     } catch (error) {
    //         message.error('加载用户信息失败');
    //         console.error('loadUserProfile error', error);
    //     } finally {
    //         // 不修改任何 loading 状态，避免刷新时出现额外的全屏加载效果
    //     }
    // };

    useEffect(() => {
        if (!hydrated) return;

        // 未登录则重定向到登录页
        if (!isAuthenticated) {
            router.push('/auth');
            return;
        }

        // 1. 首先用当前登录态中的用户信息填充页面（无额外 loading）
        if (!userInfo && currentUser) {
            const user = currentUser as AuthUser;
            setUserInfo(user);
            form.setFieldsValue({
                username: user.username,
                email: user.email,
                avatarUrl: user.avatarUrl || '',
            });
        }

        // 2. 可选：在后台静默刷新一次最新的用户信息
        // void loadUserProfile();
    }, [hydrated, isAuthenticated, currentUser, userInfo, form, router]);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        // 重置表单为原始值
        if (userInfo) {
            form.setFieldsValue({
                username: userInfo.username,
                email: userInfo.email,
                avatarUrl: userInfo.avatarUrl || '',
            });
        }
    };

    const handleSave = async (values: UpdateProfilePayload) => {
        try {
            setLoading(true);
            const { user: updatedUser } = await authApi.updateProfile(values);
            setUser(updatedUser);
            setUserInfo(updatedUser);
            setIsEditing(false);
            message.success('保存成功');
        } catch (error) {
            message.error('保存失败，请稍后重试');
            console.error('updateProfile error', error);
        } finally {
            setLoading(false);
        }
    };

    // auth 状态尚未从本地恢复完成前，不渲染任何内容，避免错误闪烁
    if (!hydrated) {
        return null;
    }

    // 已完成恢复且确认未登录时，交由 effect 做路由跳转，这里不再渲染内容
    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-8">
            <Card
                title="用户信息"
                className="w-full max-w-2xl"
                extra={
                    !isEditing && (
                        <Button type="primary" onClick={handleEdit}>
                            编辑
                        </Button>
                    )
                }
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSave}
                    disabled={!isEditing}
                >
                    <Form.Item label="用户ID" name="id">
                        <Input disabled />
                    </Form.Item>

                    <Form.Item
                        label="用户名"
                        name="username"
                        rules={[{ required: true, message: '请输入用户名' }]}
                    >
                        <Input placeholder="请输入用户名" />
                    </Form.Item>

                    <Form.Item
                        label="邮箱"
                        name="email"
                        rules={[
                            { required: true, message: '请输入邮箱' },
                            { type: 'email', message: '请输入有效的邮箱地址' },
                        ]}
                    >
                        <Input placeholder="请输入邮箱" />
                    </Form.Item>

                    <Form.Item label="头像URL" name="avatarUrl">
                        <Input placeholder="请输入头像URL（可选）" />
                    </Form.Item>

                    {isEditing && (
                        <Form.Item>
                            <div className="flex gap-3">
                                <Button type="primary" htmlType="submit" loading={loading}>
                                    保存
                                </Button>
                                <Button onClick={handleCancel}>取消</Button>
                            </div>
                        </Form.Item>
                    )}
                </Form>
            </Card>
        </div>
    );
};

export default ProfilePage;

