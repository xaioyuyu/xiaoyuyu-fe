'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Tabs, Button, Badge, Row, Col } from 'antd';
import {
    ArrowLeftOutlined,
    FileTextOutlined,
    BarChartOutlined,
    BulbOutlined,
    LineChartOutlined,
    WarningOutlined,
    RobotOutlined,
} from '@ant-design/icons';
import SavingSuggestionsTab from './components/SavingSuggestionsTab';
import ConsumptionForecastTab from './components/ConsumptionForecastTab';
import AnomalyAlertsTab from './components/AnomalyAlertsTab';
import { aiApi } from '@/features/ai/api';

export default function AIAnalysisPage() {
    const router = useRouter();
    const [unreadCount, setUnreadCount] = useState(0);

    // 加载未读异常提醒数量
    useEffect(() => {
        const loadUnreadCount = async () => {
            try {
                const response = await aiApi.getAnomalyAlerts({
                    page: 1,
                    page_size: 1,
                    is_read: false,
                });
                setUnreadCount(response.unread_count);
            } catch (error) {
                console.error('加载未读数量失败', error);
            }
        };
        loadUnreadCount();
    }, []);

    const quickAccessItems = [
        {
            key: 'monthly-summary',
            title: '月度消费总结',
            description: '查看月度消费报告和趋势分析',
            icon: <FileTextOutlined style={{ fontSize: 48, color: '#10b981' }} />,
            path: '/ai-analysis/monthly-summary',
            color: 'bg-emerald-50 hover:bg-emerald-100',
        },
        {
            key: 'behavior-insight',
            title: '消费行为洞察',
            description: '分析消费偏好与习惯',
            icon: <BarChartOutlined style={{ fontSize: 48, color: '#3b82f6' }} />,
            path: '/ai-analysis/behavior-insight',
            color: 'bg-blue-50 hover:bg-blue-100',
        },
        {
            key: 'agent-chat-demo',
            title: 'Agent 对话 Demo',
            description: '体验基于 SSE 的 Agent 对话',
            icon: <RobotOutlined style={{ fontSize: 48, color: '#8b5cf6' }} />,
            path: '/agent-chat-demo',
            color: 'bg-purple-50 hover:bg-purple-100',
        },
    ];

    const tabItems = [
        {
            key: 'saving-suggestions',
            label: '节省建议',
            icon: <BulbOutlined />,
            children: <SavingSuggestionsTab />,
        },
        {
            key: 'consumption-forecast',
            label: '消费预测',
            icon: <LineChartOutlined />,
            children: <ConsumptionForecastTab />,
        },
        {
            key: 'anomaly-alerts',
            label: (
                <span>
                    异常提醒
                    {unreadCount > 0 && (
                        <Badge count={unreadCount} offset={[8, 0]} />
                    )}
                </span>
            ),
            icon: <WarningOutlined />,
            children: <AnomalyAlertsTab onUnreadCountChange={setUnreadCount} />,
        },
    ];

    return (
        <div className="flex flex-1 flex-col bg-slate-50 p-6">
            <div className="mx-auto w-full max-w-7xl space-y-6">
                {/* 返回按钮 */}
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.push('/records')}
                    className="mb-2"
                >
                    返回记账中心
                </Button>

                {/* 顶部标题区 */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">AI智能分析中心</h1>
                    <p className="mt-2 text-base text-gray-600">智能分析您的消费数据，提供个性化建议</p>
                </div>

                {/* 快速入口卡片 */}
                <Row gutter={[24, 24]}>
                    {quickAccessItems.map((item) => (
                        <Col xs={24} sm={12} key={item.key}>
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

                {/* Tab内容区 */}
                <Card>
                    <Tabs
                        defaultActiveKey="saving-suggestions"
                        items={tabItems.map((item) => ({
                            key: item.key,
                            label: (
                                <span>
                                    {item.icon}
                                    <span className="ml-2">{item.label}</span>
                                </span>
                            ),
                            children: item.children,
                        }))}
                    />
                </Card>
            </div>
        </div>
    );
}

