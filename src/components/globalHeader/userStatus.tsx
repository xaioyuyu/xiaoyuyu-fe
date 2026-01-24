'use client';

import Image from 'next/image';
import { Button } from 'antd';

export type User = {
    username: string;
    avatarUrl?: string;
};

type UserStatusProps = {
    user: User | null;
    onLogin?: () => void;
};

// 右侧用户状态子组件
const UserStatus = ({ user, onLogin }: UserStatusProps) => {
    // 已登录状态
    if (user) {
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
            </div>
        );
    }

    // 未登录状态
    return (
        <Button type="primary" onClick={onLogin}>
            登录
        </Button>
    );
};

export default UserStatus;


