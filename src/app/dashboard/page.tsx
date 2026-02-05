'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, DatePicker, Select, Button, Spin, message } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { recordsApi } from '@/features/records/api';
import type { RecordsSummaryData, RecordsSummaryByCategoryData, RecordsListData } from '@/features/records/types';

const { RangePicker } = DatePicker;
const { Option } = Select;

type TimeRange = 'today' | 'week' | 'month' | 'custom';

export default function DashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [timeRange, setTimeRange] = useState<TimeRange>('month');
    const [customDates, setCustomDates] = useState<[Dayjs, Dayjs] | null>(null);
    const [typeId, setTypeId] = useState<number | undefined>(undefined);

    // 统计数据
    const [summary, setSummary] = useState<RecordsSummaryData | null>(null);
    const [categorySummary, setCategorySummary] = useState<RecordsSummaryByCategoryData | null>(null);
    const [recordsData, setRecordsData] = useState<RecordsListData | null>(null);
    const [recordTypes, setRecordTypes] = useState<Array<{ id: number; name: string }>>([]);

    // 计算日期范围
    const getDateRange = (): [string, string] => {
        const today = dayjs();
        let start: Dayjs;
        let end: Dayjs = today;

        if (timeRange === 'today') {
            start = today.startOf('day');
        } else if (timeRange === 'week') {
            start = today.startOf('week');
        } else if (timeRange === 'month') {
            start = today.startOf('month');
        } else if (timeRange === 'custom' && customDates) {
            start = customDates[0].startOf('day');
            end = customDates[1].endOf('day');
        } else {
            start = today.startOf('month');
        }

        return [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')];
    };

    // 加载数据
    const loadData = async () => {
        try {
            setLoading(true);
            const [startDate, endDate] = getDateRange();

            // 并行请求统计数据
            const [summaryRes, categoryRes, recordsRes] = await Promise.all([
                recordsApi.getRecordsSummary({
                    start_date: startDate,
                    end_date: endDate,
                    group_by: 'day',
                    ...(typeId && { type_id: typeId }),
                }),
                recordsApi.getRecordsSummaryByCategory({
                    start_date: startDate,
                    end_date: endDate,
                    ...(typeId && { type_id: typeId }),
                }),
                recordsApi.getRecords({
                    page: 1,
                    page_size: 10,
                    start_date: startDate,
                    end_date: endDate,
                    order_by: 'occurred_at',
                    order: 'desc',
                    ...(typeId && { type_id: typeId }),
                }),
            ]);

            setSummary(summaryRes);
            setCategorySummary(categoryRes);
            setRecordsData(recordsRes);
        } catch (error) {
            console.error('加载数据失败', error);
            message.error('加载数据失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    // 加载记录类型
    useEffect(() => {
        const loadRecordTypes = async () => {
            try {
                const types = await recordsApi.getRecordTypes();
                setRecordTypes(types.list);
            } catch (error) {
                console.error('加载记录类型失败', error);
            }
        };
        loadRecordTypes();
    }, []);

    // 初始加载和筛选条件变化时重新加载
    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeRange, customDates, typeId]);

    // 计算总支出、总收入、结余
    const calculateTotals = () => {
        if (!recordsData) return { expense: 0, income: 0, balance: 0 };

        let expense = 0;
        let income = 0;

        recordsData.list.forEach((record) => {
            // 假设 type_id 1 是支出，2 是收入（需要根据实际后端定义调整）
            if (record.type_id === 1) {
                expense += record.amount;
            } else if (record.type_id === 2) {
                income += record.amount;
            }
        });

        return {
            expense,
            income,
            balance: income - expense,
        };
    };

    const totals = calculateTotals();

    // 处理时间范围变化
    const handleTimeRangeChange = (value: TimeRange) => {
        setTimeRange(value);
        if (value !== 'custom') {
            setCustomDates(null);
        }
    };

    // 处理自定义日期范围变化
    const handleCustomDateChange = (
        dates: [Dayjs | null, Dayjs | null] | null,
    ) => {
        if (dates && dates[0] && dates[1]) {
            setTimeRange('custom');
            setCustomDates([dates[0], dates[1]]);
        } else {
            setCustomDates(null);
        }
    };

    return (
        <div className="flex flex-1 flex-col bg-slate-50 p-6">
            <div className="mx-auto w-full max-w-7xl space-y-6">
                {/* 顶部筛选区 */}
                <Card>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">时间范围：</span>
                            <Select
                                value={timeRange}
                                onChange={handleTimeRangeChange}
                                style={{ width: 120 }}
                            >
                                <Option value="today">今天</Option>
                                <Option value="week">本周</Option>
                                <Option value="month">本月</Option>
                                <Option value="custom">自定义</Option>
                            </Select>
                        </div>

                        {timeRange === 'custom' && (
                            <RangePicker
                                value={customDates}
                                onChange={handleCustomDateChange}
                                format="YYYY-MM-DD"
                            />
                        )}

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">类型：</span>
                            <Select
                                value={typeId}
                                onChange={setTypeId}
                                allowClear
                                style={{ width: 120 }}
                                placeholder="全部"
                            >
                                {recordTypes.map((type) => (
                                    <Option key={type.id} value={type.id}>
                                        {type.name}
                                    </Option>
                                ))}
                            </Select>
                        </div>

                        <div className="ml-auto flex gap-2">
                            <Button type="primary" onClick={() => router.push('/records/new')}>
                                记一笔
                            </Button>
                            <Button onClick={() => router.push('/records')}>
                                查看全部账单
                            </Button>
                        </div>
                    </div>
                </Card>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Spin size="large" />
                    </div>
                ) : (
                    <>
                        {/* 总览卡片 */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <Card>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">总支出</p>
                                    <p className="mt-2 text-2xl font-bold text-red-600">
                                        ¥{totals.expense}
                                    </p>
                                </div>
                            </Card>
                            <Card>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">总收入</p>
                                    <p className="mt-2 text-2xl font-bold text-green-600">
                                        ¥{totals.income}
                                    </p>
                                </div>
                            </Card>
                            <Card>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">结余</p>
                                    <p
                                        className={`mt-2 text-2xl font-bold ${totals.balance >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}
                                    >
                                        ¥{totals.balance}
                                    </p>
                                </div>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* 趋势图 */}
                            <Card title="趋势图（按日）">
                                {summary && summary.items.length > 0 ? (
                                    <div className="h-64">
                                        <SimpleLineChart data={summary.items} />
                                    </div>
                                ) : (
                                    <div className="flex h-64 items-center justify-center text-gray-400">
                                        暂无数据
                                    </div>
                                )}
                            </Card>

                            {/* 分类占比饼图 */}
                            <Card title="分类占比">
                                {categorySummary && categorySummary.items.length > 0 ? (
                                    <div className="h-64">
                                        <SimplePieChart data={categorySummary.items} />
                                    </div>
                                ) : (
                                    <div className="flex h-64 items-center justify-center text-gray-400">
                                        暂无数据
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* 最近记录 */}
                        <Card title="最近记录">
                            {recordsData && recordsData.list.length > 0 ? (
                                <div className="space-y-2">
                                    {recordsData.list.map((record) => (
                                        <div
                                            key={record.id}
                                            className="flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50 cursor-pointer"
                                            onClick={() => router.push(`/records/${record.id}`)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-gray-500">
                                                    {dayjs(record.occurred_at).format('MM-DD HH:mm')}
                                                </span>
                                                <span className="text-sm font-medium">
                                                    {record.category_name || '未分类'}
                                                </span>
                                                {record.remark && (
                                                    <span className="text-sm text-gray-400">
                                                        {record.remark}
                                                    </span>
                                                )}
                                            </div>
                                            <span
                                                className={`text-sm font-semibold ${record.type_id === 1 ? 'text-red-600' : 'text-green-600'
                                                    }`}
                                            >
                                                {record.type_id === 1 ? '-' : '+'}¥{record.amount}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-gray-400">暂无记录</div>
                            )}
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}

// 简单的折线图组件（CSS 实现）
function SimpleLineChart({ data }: { data: Array<{ date: string; total_amount: number }> }) {
    if (data.length === 0) return null;

    const maxAmount = Math.max(...data.map((d) => d.total_amount));
    const minAmount = Math.min(...data.map((d) => d.total_amount));
    const range = maxAmount - minAmount || 1;

    return (
        <div className="relative h-full w-full">
            <svg viewBox="0 0 400 200" className="h-full w-full">
                <polyline
                    points={data
                        .map(
                            (d, i) =>
                                `${(i / (data.length - 1 || 1)) * 380 + 10},${200 - ((d.total_amount - minAmount) / range) * 180 - 10}`,
                        )
                        .join(' ')}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                />
                {data.map((d, i) => (
                    <circle
                        key={i}
                        cx={(i / (data.length - 1 || 1)) * 380 + 10}
                        cy={200 - ((d.total_amount - minAmount) / range) * 180 - 10}
                        r="3"
                        fill="#10b981"
                    />
                ))}
            </svg>
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
                <span>{data[0]?.date}</span>
                <span>{data[data.length - 1]?.date}</span>
            </div>
        </div>
    );
}

// 简单的饼图组件（CSS 实现）
function SimplePieChart({
    data,
}: {
    data: Array<{ category_name: string; total_amount: number; percent: number }>;
}) {
    const colors = [
        '#10b981',
        '#3b82f6',
        '#f59e0b',
        '#ef4444',
        '#8b5cf6',
        '#ec4899',
        '#06b6d4',
        '#84cc16',
    ];

    // 计算每个扇形的起始角度
    const calculateAngles = () => {
        let currentAngle = 0;
        return data.map((item) => {
            const startAngle = currentAngle;
            const angle = item.percent * 360;
            const endAngle = currentAngle + angle;
            currentAngle = endAngle;
            return { startAngle, endAngle, angle };
        });
    };

    const angles = calculateAngles();

    return (
        <div className="flex h-full items-center gap-6">
            <div className="relative h-48 w-48">
                <svg viewBox="0 0 200 200" className="h-full w-full">
                    {data.map((item, index) => {
                        const { startAngle, endAngle, angle } = angles[index];

                        const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
                        const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
                        const x2 = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
                        const y2 = 100 + 80 * Math.sin((endAngle * Math.PI) / 180);
                        const largeArc = angle > 180 ? 1 : 0;

                        return (
                            <path
                                key={index}
                                d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                fill={colors[index % colors.length]}
                                className="hover:opacity-80 cursor-pointer"
                            />
                        );
                    })}
                </svg>
            </div>
            <div className="flex-1 space-y-2">
                {data.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div
                            className="h-4 w-4 rounded"
                            style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <span className="text-sm text-gray-700">{item.category_name}</span>
                        <span className="ml-auto text-sm font-medium">
                            ¥{item.total_amount} ({(item.percent * 100)}%)
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

