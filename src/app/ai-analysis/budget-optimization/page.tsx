'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, DatePicker, InputNumber, Button, Table, Tag, Spin, message } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined, CheckOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from '@/lib/utils/dayjs';
import { aiApi } from '@/features/ai/api';
import type { BudgetOptimizationResponse } from '@/features/ai/types';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';

export default function BudgetOptimizationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
    const [totalBudget, setTotalBudget] = useState<number | undefined>(undefined);
    const [data, setData] = useState<BudgetOptimizationResponse | null>(null);

    const loadData = async (forceRefresh = false) => {
        try {
            setLoading(true);
            const response = await aiApi.getBudgetOptimization({
                year: selectedDate.year(),
                month: selectedDate.month() + 1,
                total_budget: totalBudget,
                force_refresh: forceRefresh,
            });
            setData(response);
            // 如果传入了总预算，更新state
            const total = response.recommended_allocation?.total ?? response.current_budget?.total;
            if (totalBudget === undefined && total) {
                setTotalBudget(total);
            }
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = (forceRefresh: boolean = false) => {
        loadData(forceRefresh);
    };

    const handleApplyRecommendation = async () => {
        if (!data) return;
        try {
            // TODO: 调用预算保存接口
            message.success('预算方案已应用');
            // 可以跳转到预算管理页面
            // router.push('/budget');
        } catch (error) {
            console.error('应用预算方案失败', error);
            message.error('应用预算方案失败，请稍后重试');
        }
    };

    // 使用 recommended_allocation.categories 作为表格数据（已包含 current_budget、recommended_budget、reason）
    const tableData = data?.recommended_allocation?.categories ?? [];

    const columns = [
        {
            title: '分类名称',
            dataIndex: 'category_name',
            key: 'category_name',
        },
        {
            title: '当前预算',
            dataIndex: 'current_budget',
            key: 'current_budget',
            render: (amount: number) => `¥${(amount ?? 0).toFixed(2)}`,
        },
        {
            title: '推荐预算',
            dataIndex: 'recommended_budget',
            key: 'recommended_budget',
            render: (amount: number) => `¥${(amount ?? 0).toFixed(2)}`,
        },
        {
            title: '变化',
            key: 'change',
            render: (_: unknown, record: (typeof tableData)[0]) => {
                const curr = record.current_budget ?? 0;
                const rec = record.recommended_budget ?? 0;
                const changeAmount = rec - curr;
                const changePercent = curr > 0 ? (changeAmount / curr) * 100 : (rec > 0 ? 100 : 0);
                const color = changeAmount >= 0 ? 'green' : 'red';
                const symbol = changeAmount >= 0 ? '+' : '';
                return (
                    <Tag color={color}>
                        {symbol}¥{changeAmount.toFixed(2)} ({symbol}
                        {changePercent.toFixed(2)}%)
                    </Tag>
                );
            },
        },
        {
            title: '推荐原因',
            key: 'reason',
            dataIndex: 'reason',
        },
    ];

    return (
        <div className="flex flex-1 flex-col bg-slate-50 p-6">
            <div className="mx-auto w-full max-w-7xl space-y-6">
                {/* 返回按钮 */}
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.push('/ai-analysis')}
                    className="mb-2"
                >
                    返回AI分析中心
                </Button>

                {/* 筛选区 */}
                <Card>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">目标月份：</span>
                            <DatePicker
                                picker="month"
                                value={selectedDate}
                                onChange={(date) => date && setSelectedDate(date)}
                                format="YYYY-MM"
                                style={{ width: 140 }}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">总预算（可选）：</span>
                            <InputNumber
                                value={totalBudget}
                                onChange={(value) => setTotalBudget(value ?? undefined)}
                                placeholder="不填则使用现有预算"
                                min={0}
                                precision={2}
                                style={{ width: 200 }}
                                formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={(value) => parseFloat(value!.replace(/¥\s?|(,*)/g, '')) || 0}
                            />
                        </div>

                        <div className="ml-auto flex gap-2">
                            <Button
                                type="primary"
                                icon={<ReloadOutlined />}
                                onClick={() => handleRefresh(false)}
                                loading={loading}
                            >
                                查询
                            </Button>
                            <Button
                                type="primary"
                                icon={<ReloadOutlined />}
                                onClick={() => handleRefresh(true)}
                                loading={loading}
                            >
                                刷新
                            </Button>
                            {data && (
                                <Button
                                    type="primary"
                                    icon={<CheckOutlined />}
                                    onClick={handleApplyRecommendation}
                                >
                                    一键应用推荐方案
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Spin size="large" />
                    </div>
                ) : data ? (
                    <>
                        {/* 总预算信息 */}
                        <Card>
                            <div className="text-center">
                                <p className="text-sm text-gray-600">
                                    目标月份：{data.target_period} · 总预算
                                </p>
                                <p className="mt-2 text-3xl font-bold text-gray-900">
                                    ¥{(data.recommended_allocation?.total ?? data.current_budget?.total ?? 0).toFixed(2)}
                                </p>
                            </div>
                        </Card>

                        {/* 预算分配对比表格 */}
                        <Card title="预算分配对比">
                            <Table
                                columns={columns}
                                dataSource={tableData}
                                rowKey="category_id"
                                pagination={false}
                            />
                        </Card>

                        {/* AI调优说明 */}
                        {data.ai_explanation && (
                            <Card title="AI调优说明">
                                <MarkdownRenderer content={data.ai_explanation} />
                            </Card>
                        )}
                    </>
                ) : (
                    <div className="py-8 text-center text-gray-400">暂无调优建议</div>
                )}
            </div>
        </div>
    );
}

