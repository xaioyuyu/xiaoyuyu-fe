'use client';

import Image from 'next/image';
import { Button, Dropdown, type MenuProps } from 'antd';
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

    const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
        if (key === 'profile') {
            router.push('/profile');
        }
    };

    // 已登录状态
    if (isAuthenticated && user) {
        const menuItems: MenuProps['items'] = [
            {
                key: 'profile',
                label: '用户信息',
            },
            ...(user.role === 'admin'
                ? [
                      {
                          key: 'admin',
                          label: '后台管理',
                      },
                  ]
                : []),
        ];

        const handleMenuClickWithAdmin: MenuProps['onClick'] = ({ key }) => {
            if (key === 'profile') {
                router.push('/profile');
            } else if (key === 'admin') {
                // 根据 role 判断跳转
                if (user.role === 'admin') {
                    router.push('/admin');
                } else {
                    router.push('/admin/login');
                }
            }
        };

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
                <Dropdown
                    menu={{ items: menuItems, onClick: handleMenuClickWithAdmin }}
                    trigger={['hover']}
                >
                    <span className="text-sm text-gray-700 cursor-pointer hover:text-emerald-600 transition-colors">
                        {user.username}
                    </span>
                </Dropdown>
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

