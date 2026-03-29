'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, DatePicker, Button, Spin, message, Tabs } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from '@/lib/utils/dayjs';
import ReactECharts from 'echarts-for-react';
import { aiApi } from '@/features/ai/api';
import type { BehaviorInsightResponse } from '@/features/ai/types';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';

export default function BehaviorInsightPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
        dayjs().subtract(3, 'month'),
        dayjs(),
    ]);
    const [data, setData] = useState<BehaviorInsightResponse | null>(null);

    const loadData = async (forceRefresh = false) => {
        try {
            setLoading(true);
            const response = await aiApi.getBehaviorInsight({
                start_date: dateRange[0].format('YYYY-MM-DD'),
                end_date: dateRange[1].format('YYYY-MM-DD'),
                force_refresh: forceRefresh,
            });
            setData(response);
        } catch (error) {
            console.error('加载消费行为洞察失败', error);
            message.error('加载消费行为洞察失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange]);

    const handleRefresh = () => {
        loadData(true);
    };

    // TOP 消费分类柱状图配置
    const categoryChartOption = useMemo(() => {
        const topCategories = data?.statistics?.top_categories ?? [];
        if (!topCategories.length) return null;

        const categories = topCategories.map((item) => item.category_name);
        const amounts = topCategories.map((item) => item.amount);

        return {
            title: {
                text: 'TOP 消费分类',
                left: 'center',
                textStyle: { fontSize: 16, fontWeight: 'normal' },
            },
            tooltip: {
                trigger: 'axis',
                formatter: (params: unknown) => {
                    const param = Array.isArray(params) ? params[0] : params;
                    if (param && typeof param === 'object' && 'name' in param && 'value' in param) {
                        return `${param.name}<br/>金额: ¥${param.value}`;
                    }
                    return '';
                },
            },
            grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
            xAxis: {
                type: 'category',
                data: categories,
                axisLabel: { rotate: 45 },
            },
            yAxis: {
                type: 'value',
                axisLabel: { formatter: (value: number) => `¥${value}` },
            },
            series: [
                {
                    name: '消费金额',
                    type: 'bar',
                    data: amounts,
                    itemStyle: { color: '#10b981' },
                },
            ],
        };
    }, [data]);

    // 消费高峰时段柱状图（peak_hours）
    const peakHoursChartOption = useMemo(() => {
        const peakHours = data?.statistics?.peak_hours ?? [];
        if (!peakHours.length) return null;

        return {
            title: {
                text: '消费高峰时段',
                left: 'center',
                textStyle: { fontSize: 16, fontWeight: 'normal' },
            },
            tooltip: {
                trigger: 'axis',
                formatter: (params: unknown) => {
                    const param = Array.isArray(params) ? params[0] : params;
                    if (param && typeof param === 'object' && 'name' in param) {
                        return `${param.name} 为消费高峰时段`;
                    }
                    return '';
                },
            },
            grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
            xAxis: {
                type: 'category',
                data: peakHours.map((h) => `${h}时`),
            },
            yAxis: {
                type: 'value',
                show: false,
            },
            series: [
                {
                    name: '高峰',
                    type: 'bar',
                    data: peakHours.map(() => 1),
                    itemStyle: { color: '#3b82f6' },
                },
            ],
        };
    }, [data]);

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
                <Card style={{ marginBottom: '16px' }}>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">日期范围：</span>
                            <DatePicker.RangePicker
                                value={dateRange}
                                onChange={(dates) => {
                                    if (dates && dates[0] && dates[1]) {
                                        setDateRange([dates[0], dates[1]]);
                                    }
                                }}
                                format="YYYY-MM-DD"
                                style={{ width: 280 }}
                            />
                        </div>

                        <div className="ml-auto">
                            <Button
                                type="primary"
                                icon={<ReloadOutlined />}
                                onClick={handleRefresh}
                                loading={loading}
                            >
                                强制刷新
                            </Button>
                        </div>
                    </div>
                </Card>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Spin size="large" />
                    </div>
                ) : data ? (
                    <>
                        {/* 统计周期 */}
                        {/* {data.period && (
                            <Card>
                                <p className="text-sm text-gray-600">统计周期</p>
                                <p className="mt-2 text-lg font-semibold text-gray-900">{data.period}</p>
                            </Card>
                        )} */}

                        {/* 统计卡片 */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <Card>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">平均单笔金额</p>
                                    <p className="mt-2 text-2xl font-bold text-blue-600">
                                        ¥{data.statistics?.avg_amount?.toFixed(2) ?? '-'}
                                    </p>
                                </div>
                            </Card>
                            <Card>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">统计天数</p>
                                    <p className="mt-2 text-2xl font-bold text-gray-900">
                                        {data.statistics?.frequency_distribution?.total_days ?? '-'} 天
                                    </p>
                                </div>
                            </Card>
                            <Card>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">日均消费次数</p>
                                    <p className="mt-2 text-2xl font-bold text-gray-900">
                                        {data.statistics?.frequency_distribution?.avg_per_day?.toFixed(1) ?? '-'} 次
                                    </p>
                                </div>
                            </Card>
                            <Card>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">单日最高消费次数</p>
                                    <p className="mt-2 text-2xl font-bold text-gray-900">
                                        {data.statistics?.frequency_distribution?.max_per_day ?? '-'} 次
                                    </p>
                                </div>
                            </Card>
                        </div>

                        {/* 图表区域 */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* TOP 5消费分类柱状图 */}
                            <Card>
                                {categoryChartOption ? (
                                    <ReactECharts
                                        option={categoryChartOption}
                                        style={{ height: '400px', width: '100%' }}
                                        opts={{ renderer: 'svg' }}
                                    />
                                ) : (
                                    <div className="flex h-96 items-center justify-center text-gray-400">
                                        暂无数据
                                    </div>
                                )}
                            </Card>

                            {/* 消费高峰时段 */}
                            <Card>
                                {peakHoursChartOption ? (
                                    <ReactECharts
                                        option={peakHoursChartOption}
                                        style={{ height: '400px', width: '100%' }}
                                        opts={{ renderer: 'svg' }}
                                    />
                                ) : (
                                    <div className="flex h-96 items-center justify-center text-gray-400">
                                        暂无数据
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* AI洞察 */}
                        {(data.ai_insights?.habits || data.ai_insights?.trends || data.ai_insights?.preferences) && (
                            <Card title="AI消费行为洞察">
                                <Tabs
                                    defaultActiveKey="habits"
                                    items={[
                                        {
                                            key: 'habits',
                                            label: '消费习惯',
                                            children: data.ai_insights?.habits ? (
                                                <MarkdownRenderer
                                                    content={data.ai_insights.habits}
                                                    className="max-h-[min(16rem,50vh)]"
                                                />
                                            ) : (
                                                <div className="py-4 text-gray-400">暂无</div>
                                            ),
                                        },
                                        {
                                            key: 'trends',
                                            label: '消费趋势',
                                            children: data.ai_insights?.trends ? (
                                                <MarkdownRenderer
                                                    content={data.ai_insights.trends}
                                                    className="max-h-[min(16rem,50vh)]"
                                                />
                                            ) : (
                                                <div className="py-4 text-gray-400">暂无</div>
                                            ),
                                        },
                                        {
                                            key: 'preferences',
                                            label: '消费偏好',
                                            children: data.ai_insights?.preferences ? (
                                                <MarkdownRenderer
                                                    content={data.ai_insights.preferences}
                                                    className="max-h-[min(16rem,50vh)]"
                                                />
                                            ) : (
                                                <div className="py-4 text-gray-400">暂无</div>
                                            ),
                                        },
                                    ]}
                                />
                            </Card>
                        )}
                    </>
                ) : (
                    <div className="py-8 text-center text-gray-400">暂无数据</div>
                )}
            </div>
        </div>
    );
}

