'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, DatePicker, Button, Spin, message } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from '@/lib/utils/dayjs';
import ReactECharts from 'echarts-for-react';
import { aiApi } from '@/features/ai/api';
import type { MonthlySummaryResponse } from '@/features/ai/types';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';

export default function MonthlySummaryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
    const [data, setData] = useState<MonthlySummaryResponse | null>(null);

    const loadData = async (forceRefresh = false) => {
        try {
            setLoading(true);
            const response = await aiApi.getMonthlySummary({
                year: selectedDate.year(),
                month: selectedDate.month() + 1,
                force_refresh: forceRefresh,
            });
            setData(response);
        } catch (error) {
            console.error('加载月度消费总结失败', error);
            message.error('加载月度消费总结失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate]);

    const handleRefresh = () => {
        loadData(true);
    };

    // 分类占比饼图配置
    const categoryChartOption = useMemo(() => {
        const dist = data?.category_distribution ?? [];
        if (!dist.length) return null;

        const top5 = dist.slice(0, 5);
        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

        return {
            title: {
                text: '分类占比（TOP 5）',
                left: 'center',
                textStyle: {
                    fontSize: 16,
                    fontWeight: 'normal',
                },
            },
            tooltip: {
                trigger: 'item',
                formatter: (params: unknown) => {
                    if (params && typeof params === 'object' && 'name' in params && 'value' in params && 'percent' in params) {
                        return `${params.name}<br/>金额: ¥${params.value}<br/>占比: ${params.percent}%`;
                    }
                    return '';
                },
            },
            legend: {
                orient: 'vertical',
                left: 'left',
                top: 'middle',
                formatter: (name: string) => {
                    const item = top5.find((i) => i.category_name === name);
                    return item ? `${name} (${(item.percent * 100).toFixed(2)}%)` : name;
                },
            },
            series: [
                {
                    name: '分类占比',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    center: ['60%', '50%'],
                    avoidLabelOverlap: false,
                    itemStyle: {
                        borderRadius: 10,
                        borderColor: '#fff',
                        borderWidth: 2,
                    },
                    label: {
                        show: false,
                        position: 'center',
                    },
                    emphasis: {
                        label: {
                            show: true,
                            fontSize: 20,
                            fontWeight: 'bold',
                        },
                    },
                    labelLine: {
                        show: false,
                    },
                    data: top5.map((item, index) => ({
                        value: item.amount,
                        name: item.category_name,
                        itemStyle: {
                            color: colors[index % colors.length],
                        },
                    })),
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
                <Card>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">选择月份：</span>
                            <DatePicker
                                picker="month"
                                value={selectedDate}
                                onChange={(date) => date && setSelectedDate(date)}
                                format="YYYY-MM"
                                style={{ width: 140 }}
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
                        {/* 统计卡片 */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <Card>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">总消费金额</p>
                                    <p className="mt-2 text-2xl font-bold text-red-600">
                                        ¥{data.summary?.total_amount?.toFixed(2) ?? '-'}
                                    </p>
                                </div>
                            </Card>
                            <Card>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">日均消费</p>
                                    <p className="mt-2 text-2xl font-bold text-blue-600">
                                        ¥{data.summary?.daily_average?.toFixed(2) ?? '-'}
                                    </p>
                                </div>
                            </Card>
                            <Card>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">记录数</p>
                                    <p className="mt-2 text-2xl font-bold text-gray-900">
                                        {data.summary?.record_count ?? '-'}
                                    </p>
                                </div>
                            </Card>
                        </div>

                        {/* 图表区域 */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* 分类占比饼图 */}
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

                            {/* 与上月对比概览 */}
                            <Card title={data.period ? `${data.period} 概览` : '概览'}>
                                <div className="flex h-64 flex-col items-center justify-center text-center">
                                    <p className="text-gray-600">
                                        {data.comparison?.change_type === 'increase' ? '较上月增长' : '较上月下降'}{' '}
                                        <span
                                            className={
                                                data.comparison?.change_type === 'increase'
                                                    ? 'font-bold text-red-600'
                                                    : 'font-bold text-green-600'
                                            }
                                        >
                                            {data.comparison?.change_type === 'increase' ? '+' : ''}
                                            {data.comparison?.change_ratio?.toFixed(2) ?? 0}%
                                        </span>
                                    </p>
                                    <p className="mt-2 text-sm text-gray-500">
                                        上月总消费 ¥{(data.comparison?.last_month_total ?? 0).toFixed(2)}
                                    </p>
                                </div>
                            </Card>
                        </div>

                        {/* 与上月对比 */}
                        <Card title="与上月对比">
                            <div className="text-center">
                                <p className="text-lg text-gray-600">
                                    {data.comparison?.change_type === 'increase' ? '增长' : '下降'}
                                </p>
                                <p
                                    className={`mt-2 text-3xl font-bold ${
                                        data.comparison?.change_type === 'increase'
                                            ? 'text-red-600'
                                            : 'text-green-600'
                                    }`}
                                >
                                    {data.comparison?.change_type === 'increase' ? '+' : ''}
                                    {data.comparison?.change_ratio?.toFixed(2) ?? 0}%
                                </p>
                                <p className="mt-2 text-sm text-gray-500">
                                    上月总消费：¥{(data.comparison?.last_month_total ?? 0).toFixed(2)}
                                </p>
                            </div>
                        </Card>

                        {/* AI生成的文字报告 */}
                        {data.ai_report && (
                            <Card title="AI月度消费总结报告">
                                <MarkdownRenderer content={data.ai_report} className="max-h-[min(8rem,50vh)]"/>
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

