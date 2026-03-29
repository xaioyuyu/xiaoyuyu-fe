'use client';

import { useState, useEffect } from 'react';
import { Card, DatePicker, Button, Spin, message, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from '@/lib/utils/dayjs';
import { aiApi } from '@/features/ai/api';
import type { ConsumptionForecastResponse } from '@/features/ai/types';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';

export default function ConsumptionForecastTab() {
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
    const [data, setData] = useState<ConsumptionForecastResponse | null>(null);

    const loadData = async (forceRefresh = false) => {
        try {
            setLoading(true);
            const response = await aiApi.getConsumptionForecast({
                year: selectedDate.year(),
                month: selectedDate.month() + 1,
                force_refresh: forceRefresh,
            });
            setData(response);
        } catch (error) {
            console.error('加载消费预测失败', error);
            message.error('加载消费预测失败，请稍后重试');
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

    // 置信度颜色映射
    const confidenceColorMap = {
        high: 'green',
        medium: 'orange',
        low: 'red',
    };

    const confidenceTextMap = {
        high: '高',
        medium: '中',
        low: '低',
    };

    return (
        <div className="space-y-4">
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
                    {/* 当前状态卡片 */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <Card>
                            <div className="text-center">
                                <p className="text-sm text-gray-600">已过天数</p>
                                <p className="mt-2 text-2xl font-bold text-gray-900">
                                    {data.current_status.days_passed}
                                </p>
                            </div>
                        </Card>
                        <Card>
                            <div className="text-center">
                                <p className="text-sm text-gray-600">剩余天数</p>
                                <p className="mt-2 text-2xl font-bold text-gray-900">
                                    {data.current_status.days_remaining}
                                </p>
                            </div>
                        </Card>
                        <Card>
                            <div className="text-center">
                                <p className="text-sm text-gray-600">已消费金额</p>
                                <p className="mt-2 text-2xl font-bold text-red-600">
                                    ¥{data.current_status.consumed_amount.toFixed(2)}
                                </p>
                            </div>
                        </Card>
                        <Card>
                            <div className="text-center">
                                <p className="text-sm text-gray-600">日均消费</p>
                                <p className="mt-2 text-2xl font-bold text-blue-600">
                                    ¥{data.current_status.daily_average.toFixed(2)}
                                </p>
                            </div>
                        </Card>
                    </div>

                    {/* 预测结果卡片 */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Card>
                            <div className="text-center">
                                <p className="text-sm text-gray-600">最可能值</p>
                                <p className="mt-2 text-2xl font-bold text-green-600">
                                    ¥{data.forecast.predicted_most_likely.toFixed(2)}
                                </p>
                            </div>
                        </Card>
                        <Card>
                            <div className="text-center">
                                <p className="text-sm text-gray-600">预测区间</p>
                                <p className="mt-2 text-lg font-semibold text-gray-900">
                                    ¥{data.forecast.predicted_min.toFixed(2)} - ¥
                                    {data.forecast.predicted_max.toFixed(2)}
                                </p>
                            </div>
                        </Card>
                        <Card>
                            <div className="text-center">
                                <p className="text-sm text-gray-600">置信度</p>
                                <p className="mt-2">
                                    <Tag
                                        color={confidenceColorMap[data.forecast.confidence_level]}
                                        style={{ fontSize: '16px', padding: '4px 12px' }}
                                    >
                                        {confidenceTextMap[data.forecast.confidence_level]}
                                    </Tag>
                                </p>
                            </div>
                        </Card>
                    </div>

                    {/* AI分析文字 */}
                    {data.ai_analysis && (
                        <Card title="AI分析">
                            <MarkdownRenderer content={data.ai_analysis} />
                        </Card>
                    )}
                </>
            ) : (
                <div className="py-8 text-center text-gray-400">暂无预测数据</div>
            )}
        </div>
    );
}

