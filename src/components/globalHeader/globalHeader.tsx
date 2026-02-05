'use client';
import Image from 'next/image';
import UserStatus from './userStatus';
import { useRouter } from 'next/navigation';

const GlobalHeader = () => {
    const router = useRouter();
    const goToHome = () => {
        router.push('/');
    };
    const goToRecords = () => {
        router.push('/records');
    };

    return (
        <header className="flex h-20 items-center justify-between bg-white px-8 shadow-md">
            {/* 左侧区域：Logo + 标题 */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={goToHome}>
                <Image src="/logo.png" alt="finsmart" width={40} height={40} />
                <h1 className="text-2xl font-semibold text-gray-900">Finsmart</h1>
            </div>

            {/* 中间导航入口 */}
            <nav className="flex flex-1 items-center justify-center gap-6 text-sm">
                <button
                    type="button"
                    className="text-gray-700 hover:text-emerald-600"
                    onClick={() => router.push('/dashboard')}
                >
                    仪表盘
                </button>
                <button
                    type="button"
                    className="text-gray-700 hover:text-emerald-600"
                    onClick={goToRecords}
                >
                    账目列表
                </button>
                <button
                    type="button"
                    className="text-gray-700 hover:text-emerald-600"
                    onClick={() => router.push('/reports')}
                >
                    统计报表
                </button>
                <button
                    type="button"
                    className="text-gray-700 hover:text-emerald-600"
                    onClick={() => router.push('/categories')}
                >
                    分类管理
                </button>
                <button
                    type="button"
                    className="text-gray-700 hover:text-emerald-600"
                    onClick={() => router.push('/tags')}
                >
                    标签管理
                </button>
            </nav>

            {/* 右侧区域：用户状态 */}
            <div>
                <UserStatus />
            </div>
        </header>
    );
};

export default GlobalHeader;