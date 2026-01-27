'use client';

import Image from 'next/image';
import { Button } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks';

// 右侧用户状态子组件
const UserStatus = () => {
    const router = useRouter();
    const { user, isAuthenticated, logout, loading } = useAuth();

    const handleGoAuth = () => {
        router.push('/auth');
    };

    const handleLogout = async () => {
        await logout();
    };

    // 已登录状态
    if (isAuthenticated && user) {
        return (
            <div className="flex items-center gap-3">
                {user.avatarUrl && (
                    <Image
                        src={user.avatarUrl}
                        alt={user.username}
                        width={32}
                        height={32}
                        className="rounded-full"
                    />
                )}
                <span className="text-sm text-gray-700">{user.username}</span>
                <Button size="small" type="link" onClick={handleLogout} loading={loading}>
                    退出登录
                </Button>
            </div>
        );
    }

    // 未登录状态
    return (
        <Button type="primary" onClick={handleGoAuth}>
            登录 / 注册
        </Button>
    );
};

export default UserStatus;

