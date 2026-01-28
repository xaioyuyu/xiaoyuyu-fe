'use client';
import Image from 'next/image';
import UserStatus from './userStatus';
import { useRouter } from 'next/navigation';

const GlobalHeader = () => {
    const router = useRouter();
    const goToHome = () => {
        router.push('/');
    };
    return (
        <header className="flex h-20 items-center justify-between bg-white px-8 shadow-md">
            {/* 左侧区域：Logo + 标题 */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={goToHome}>
                <Image src="/logo.png" alt="finsmart" width={40} height={40} />
                <h1 className="text-2xl font-semibold text-gray-900">Finsmart</h1>
            </div>

            {/* 中间区域：占位布局 */}
            <div className="flex-1" />

            {/* 右侧区域：用户状态 */}
            <div>
                <UserStatus />
            </div>
        </header>
    );
};

export default GlobalHeader;