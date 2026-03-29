'use client';

import { useRouter } from 'next/navigation';
import { Card, Button, Row, Col } from 'antd';
import {
    DashboardOutlined,
    UnorderedListOutlined,
    AppstoreOutlined,
    TagsOutlined,
    PlusOutlined,
    WalletOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';

export default function RecordsIndexPage() {
    const router = useRouter();

    const menuItems = [
        {
            key: 'dashboard',
            title: '仪表盘',
            description: '查看数据统计和趋势分析',
            icon: <DashboardOutlined style={{ fontSize: 48, color: '#10b981' }} />,
            path: '/dashboard',
            color: 'bg-emerald-50 hover:bg-emerald-100',
        },
        {
            key: 'list',
            title: '账目列表',
            description: '查看和管理所有记账记录',
            icon: <UnorderedListOutlined style={{ fontSize: 48, color: '#3b82f6' }} />,
            path: '/records/list',
            color: 'bg-blue-50 hover:bg-blue-100',
        },
        {
            key: 'categories',
            title: '分类管理',
            description: '管理收支分类和标签',
            icon: <AppstoreOutlined style={{ fontSize: 48, color: '#f59e0b' }} />,
            path: '/categories',
            color: 'bg-amber-50 hover:bg-amber-100',
        },
        {
            key: 'tags',
            title: '标签管理',
            description: '管理记账标签',
            icon: <TagsOutlined style={{ fontSize: 48, color: '#8b5cf6' }} />,
            path: '/tags',
            color: 'bg-purple-50 hover:bg-purple-100',
        },
        {
            key: 'budget',
            title: '预算管理',
            description: '设置和管理月度预算',
            icon: <WalletOutlined style={{ fontSize: 48, color: '#6366f1' }} />,
            path: '/budget',
            color: 'bg-indigo-50 hover:bg-indigo-100',
        },
        {
            key: 'ai-analysis',
            title: 'AI智能分析',
            description: '智能分析消费数据，提供个性化建议',
            icon: <ThunderboltOutlined style={{ fontSize: 48, color: '#ec4899' }} />,
            path: '/ai-analysis',
            color: 'bg-pink-50 hover:bg-pink-100',
        },
    ];

    return (
        <div className="flex flex-1 flex-col bg-slate-50">
            <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
                {/* 顶部标题区 */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">记账中心</h1>
                    <p className="mt-2 text-base text-gray-600">管理您的收支记录和财务数据</p>
                </div>

                {/* 主要功能入口网格 */}
                <Row gutter={[24, 24]}>
                    {menuItems.map((item) => (
                        <Col xs={24} sm={12} lg={6} key={item.key}>
                            <Card
                                hoverable
                                className={`h-full cursor-pointer transition-all duration-300 ${item.color} border-2 border-transparent hover:border-emerald-300`}
                                onClick={() => router.push(item.path)}
                                bodyStyle={{ padding: '32px 24px' }}
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className="mb-4 transition-transform duration-300 hover:scale-110">
                                        {item.icon}
                                    </div>
                                    <h3 className="mb-2 text-xl font-semibold text-gray-900">{item.title}</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* 快捷操作区 */}
                <Card className="border-emerald-100 bg-emerald-50/50">
                    <div className="flex flex-col items-center gap-4">
                        <h3 className="text-lg font-semibold text-gray-900">快速开始</h3>
                        <div className="flex flex-wrap justify-center gap-3">
                            <Button
                                type="primary"
                                size="large"
                                icon={<PlusOutlined />}
                                onClick={() => router.push('/records/new')}
                                className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8 text-base"
                            >
                                立即记账
                            </Button>
                            <Button
                                size="large"
                                onClick={() => router.push('/records/list')}
                                className="h-12 px-8 text-base"
                            >
                                查看记录
                            </Button>
                            <Button
                                size="large"
                                onClick={() => router.push('/dashboard')}
                                className="h-12 px-8 text-base"
                            >
                                数据统计
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

