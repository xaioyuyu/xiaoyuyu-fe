'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Select, Button, Spin, message, Radio, DatePicker } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs, { type Dayjs } from '@/lib/utils/dayjs';
import { utcToCST } from '@/lib/utils';
import { recordsApi } from '@/features/records/api';
import type {
    RecordsSummaryData,
    RecordsSummaryByCategoryData,
    RecordsListData,
    RecordItem,
} from '@/features/records/types';

const { Option } = Select;

type TimeDimension = 'year' | 'month' | 'day';

export default function DashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [timeDimension, setTimeDimension] = useState<TimeDimension>('month');
    const [typeId, setTypeId] = useState<number | undefined>(undefined);

    // 选择的日期/月份/年份
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

    // 统计数据
    const [summary, setSummary] = useState<RecordsSummaryData | null>(null);
    const [categorySummary, setCategorySummary] = useState<RecordsSummaryByCategoryData | null>(null);
    const [recordsData, setRecordsData] = useState<RecordsListData | null>(null);
    const [recordTypes, setRecordTypes] = useState<Array<{ id: number; name: string }>>([]);
    const [allRecords, setAllRecords] = useState<RecordItem[]>([]); // 用于按小时统计

    // 计算日期范围
    const getDateRange = (): [string, string] => {
        const baseDate = selectedDate || dayjs();
        let start: Dayjs;
        let end: Dayjs;

        if (timeDimension === 'year') {
            start = baseDate.startOf('year');
            end = baseDate.endOf('year');
        } else if (timeDimension === 'month') {
            start = baseDate.startOf('month');
            end = baseDate.endOf('month');
        } else {
            // day
            start = baseDate.startOf('day');
            end = baseDate.endOf('day');
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
                    group_by: timeDimension === 'year' ? 'month' : 'day',
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

            // 如果是按日视图，需要获取所有记录用于按小时统计
            if (timeDimension === 'day') {
                const allRecordsRes = await recordsApi.getRecords({
                    page: 1,
                    page_size: 1000, // 获取足够多的记录
                    start_date: startDate,
                    end_date: endDate,
                    order_by: 'occurred_at',
                    order: 'asc',
                    ...(typeId && typeId !== 0 && { type_id: typeId }),
                });
                setAllRecords(allRecordsRes.list || []);
            } else {
                setAllRecords([]);
            }
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
                const newTypes = [...types.list, { id: 0, name: '全部' }];
                setRecordTypes(newTypes);
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
    }, [timeDimension, typeId, selectedDate]);

    // 处理时间维度变化
    const handleTimeDimensionChange = (value: TimeDimension) => {
        setTimeDimension(value);
        // 切换时间维度时，重置为当前时间对应的默认值
        const now = dayjs();
        if (value === 'year') {
            // 切换到年视图时，默认选择当前年份
            setSelectedDate(now.startOf('year'));
        } else if (value === 'month') {
            // 切换到月视图时，默认选择当前年月
            setSelectedDate(now.startOf('month'));
        } else {
            // 切换到日视图时，默认选择当前日期
            setSelectedDate(now.startOf('day'));
        }
    };

    // 处理日期选择变化
    const handleDateChange = (date: Dayjs | null) => {
        if (date) {
            setSelectedDate(date);
        }
    };

    // 处理趋势图数据
    const trendChartData = useMemo(() => {
        if (!summary || !summary.items.length) {
            return { xAxis: [], series: [] };
        }

        if (timeDimension === 'year') {
            // 年视图：横坐标显示月份（1月-12月）
            const monthData = new Array(12).fill(0);
            summary.items.forEach((item) => {
                const month = dayjs(item.date).month(); // 0-11
                monthData[month] += item.total_amount;
            });

            return {
                xAxis: Array.from({ length: 12 }, (_, i) => `${i + 1}月`),
                series: monthData,
            };
        } else if (timeDimension === 'month') {
            // 月视图：横坐标显示日期（1日-31日/30日/28日）
            const baseDate = selectedDate || dayjs();
            const daysInMonth = baseDate.daysInMonth();
            const dayData = new Array(daysInMonth).fill(0);

            summary.items.forEach((item) => {
                const day = dayjs(item.date).date(); // 1-31
                if (day >= 1 && day <= daysInMonth) {
                    dayData[day - 1] += item.total_amount;
                }
            });

            return {
                xAxis: Array.from({ length: daysInMonth }, (_, i) => `${i + 1}日`),
                series: dayData,
            };
        } else {
            // 日视图：横坐标显示小时（0时-23时）
            const hourData = new Array(24).fill(0);
            // 使用 allRecords 按小时聚合数据
            allRecords.forEach((record) => {
                const hour = dayjs(record.occurred_at).hour(); // 0-23
                // 根据 type_id 决定金额的正负：1为支出（负），2为收入（正）
                let amount = record.amount;
                if (typeof record.amount === 'string') {
                    amount = Number(record.amount);
                }
                // const amount = record.type_id === 1 ? -record.amount : record.amount;
                hourData[hour] += amount;
            });

            return {
                xAxis: Array.from({ length: 24 }, (_, i) => `${i}时`),
                series: hourData,
            };
        }
    }, [summary, timeDimension, allRecords, selectedDate]);

    // 计算总支出、总收入、结余
    const calculateTotals = () => {
        if (!recordsData) return { expense: 0, income: 0, balance: 0 };

        let expense = 0;
        let income = 0;

        recordsData.list.forEach((record) => {
            let amount = record.amount;
            if (typeof record.amount === 'string') {
                amount = Number(record.amount);
            }
            // 假设 type_id 1 是支出，2 是收入
            if (record.type_id === 1) {
                expense += amount;
            } else if (record.type_id === 2) {
                income += amount;
            }
        });

        return {
            expense,
            income,
            balance: income - expense,
        };
    };

    const totals = calculateTotals();

    // 趋势图配置
    const trendChartOption = useMemo(() => {
        return {
            title: {
                text: '趋势图',
                left: 'center',
                textStyle: {
                    fontSize: 16,
                    fontWeight: 'normal',
                },
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
            grid: {
                left: '3%',
                right: '4%',
                bottom: '10%',
                containLabel: true,
            },
            xAxis: {
                type: 'category',
                data: trendChartData.xAxis,
                axisLabel: {
                    rotate: timeDimension === 'day' ? 45 : 0,
                    interval: timeDimension === 'day' ? 1 : 'auto',
                },
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    formatter: (value: number) => `¥${value}`,
                },
            },
            series: [
                {
                    name: '金额',
                    type: 'line',
                    data: trendChartData.series,
                    smooth: true,
                    itemStyle: {
                        color: '#10b981',
                    },
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [
                                { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
                                { offset: 1, color: 'rgba(16, 185, 129, 0.1)' },
                            ],
                        },
                    },
                },
            ],
        };
    }, [trendChartData, timeDimension]);

    // 分类占比图配置
    const categoryChartOption = useMemo(() => {
        if (!categorySummary || !categorySummary.items.length) {
            return null;
        }

        const colors = [
            '#10b981',
            '#3b82f6',
            '#f59e0b',
            '#ef4444',
            '#8b5cf6',
            '#ec4899',
            '#06b6d4',
            '#84cc16',
            '#f97316',
            '#6366f1',
        ];

        return {
            title: {
                text: '分类占比',
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
                    const item = categorySummary.items.find((i) => i.category_name === name);
                    return item ? `${name} (${(item.percent * 100).toFixed(2)}%)` : name;
                },
            },
            series: [
                {
                    name: '分类占比',
                    type: 'pie',
                    radius: ['40%', '70%'], // 环形图
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
                    data: categorySummary.items.map((item, index) => ({
                        value: item.total_amount,
                        name: item.category_name,
                        itemStyle: {
                            color: colors[index % colors.length],
                        },
                    })),
                },
            ],
        };
    }, [categorySummary]);

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

                {/* 顶部筛选区 */}
                <Card>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">时间维度：</span>
                            <Radio.Group
                                value={timeDimension}
                                onChange={(e) => handleTimeDimensionChange(e.target.value)}
                                buttonStyle="solid"
                            >
                                <Radio.Button value="year">年</Radio.Button>
                                <Radio.Button value="month">月</Radio.Button>
                                <Radio.Button value="day">日</Radio.Button>
                            </Radio.Group>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                                {timeDimension === 'year' ? '选择年份：' : timeDimension === 'month' ? '选择月份：' : '选择日期：'}
                            </span>
                            {timeDimension === 'year' ? (
                                <DatePicker
                                    picker="year"
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    format="YYYY年"
                                    style={{ width: 120 }}
                                />
                            ) : timeDimension === 'month' ? (
                                <DatePicker
                                    picker="month"
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    format="YYYY-MM"
                                    style={{ width: 140 }}
                                />
                            ) : (
                                <DatePicker
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    format="YYYY-MM-DD"
                                    style={{ width: 140 }}
                                />
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">类型：</span>
                            <Select
                                value={typeId}
                                onChange={setTypeId}
                                allowClear
                                style={{ width: 120 }}
                                defaultValue={0}
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

                        {/* 图表区域 */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* 趋势图 */}
                            <Card>
                                {trendChartData.series.length > 0 ? (
                                    <ReactECharts
                                        option={trendChartOption}
                                        style={{ height: '400px', width: '100%' }}
                                        opts={{ renderer: 'svg' }}
                                    />
                                ) : (
                                    <div className="flex h-96 items-center justify-center text-gray-400">
                                        暂无数据
                                    </div>
                                )}
                            </Card>

                            {/* 分类占比图 */}
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
                                                    {utcToCST(record.occurred_at, 'MM-DD HH:mm')}
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
