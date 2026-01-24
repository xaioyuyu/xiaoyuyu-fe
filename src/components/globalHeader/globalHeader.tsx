'use client';
import Image from 'next/image';
import UserStatus, { User } from './userStatus';

const GlobalHeader = () => {
    // TODO: 这里的 user 信息后续可以接入真实的登录态
    const user: User | null = null;

    const handleLogin = () => {
        // TODO: 在这里触发实际的登录逻辑（弹出登录框 / 跳转登录页等）
        console.log('登录按钮被点击');
    };

    return (
        <header className="flex h-20 items-center justify-between bg-white px-8 shadow-md">
            {/* 左侧区域：Logo + 标题 */}
            <div className="flex items-center gap-3">
                <Image src="/logo.png" alt="finsmart" width={40} height={40} />
                <h1 className="text-2xl font-semibold text-gray-900">Finsmart</h1>
            </div>

            {/* 中间区域：占位布局 */}
            <div className="flex-1" />

            {/* 右侧区域：用户状态 */}
            <div>
                <UserStatus user={user} onLogin={handleLogin} />
            </div>
        </header>
    );
};

export default GlobalHeader;