'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, DatePicker, Select, Button, Tabs, Spin, message } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { recordsApi } from '@/features/records/api';
import type {
    RecordsSummaryData,
    RecordsSummaryByCategoryData,
    RecordsListData,
    RecordItem,
} from '@/features/records/types';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

type ViewMode = 'time' | 'category';

export default function ReportsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('time');
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
        dayjs().startOf('month'),
        dayjs().endOf('month'),
    ]);
    const [typeId, setTypeId] = useState<number | undefined>(undefined);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
    const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

    // 数据
    const [timeSummary, setTimeSummary] = useState<RecordsSummaryData | null>(null);
    const [categorySummary, setCategorySummary] = useState<RecordsSummaryByCategoryData | null>(null);
    const [recordsList, setRecordsList] = useState<RecordItem[]>([]);
    const [recordTypes, setRecordTypes] = useState<Array<{ id: number; name: string }>>([]);

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

    // 加载统计数据
    const loadSummaryData = async () => {
        try {
            setLoading(true);
            const [startDate, endDate] = [
                dateRange[0].format('YYYY-MM-DD'),
                dateRange[1].format('YYYY-MM-DD'),
            ];

            const params = {
                start_date: startDate,
                end_date: endDate,
                ...(typeId && { type_id: typeId }),
            };

            if (viewMode === 'time') {
                const [dayRes, monthRes] = await Promise.all([
                    recordsApi.getRecordsSummary({ ...params, group_by: 'day' }),
                    recordsApi.getRecordsSummary({ ...params, group_by: 'month' }),
                ]);
                setTimeSummary(dayRes);
            } else {
                const res = await recordsApi.getRecordsSummaryByCategory(params);
                setCategorySummary(res);
            }
        } catch (error) {
            console.error('加载统计数据失败', error);
            message.error('加载统计数据失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    // 加载记录列表（根据筛选条件）
    const loadRecordsList = async () => {
        try {
            const [startDate, endDate] = [
                dateRange[0].format('YYYY-MM-DD'),
                dateRange[1].format('YYYY-MM-DD'),
            ];

            const params: any = {
                page: 1,
                page_size: 20,
                start_date: startDate,
                end_date: endDate,
                order_by: 'occurred_at',
                order: 'desc' as const,
                ...(typeId && { type_id: typeId }),
                ...(selectedCategoryId && { category_id: selectedCategoryId }),
            };

            // 如果选中了日期，进一步筛选
            if (selectedDate) {
                params.start_date = selectedDate;
                params.end_date = selectedDate;
            }

            const res = await recordsApi.getRecords(params);
            setRecordsList(res.list);
        } catch (error) {
            console.error('加载记录列表失败', error);
            message.error('加载记录列表失败，请稍后重试');
        }
    };

    // 初始加载和筛选条件变化时重新加载
    useEffect(() => {
        loadSummaryData();
    }, [viewMode, dateRange, typeId]);

    useEffect(() => {
        loadRecordsList();
    }, [dateRange, typeId, selectedCategoryId, selectedDate]);

    // 处理图表点击（时间视图）
    const handleTimeChartClick = (date: string) => {
        setSelectedDate(date);
        setSelectedCategoryId(undefined);
    };

    // 处理图表点击（分类视图）
    const handleCategoryChartClick = (categoryId: number) => {
        setSelectedCategoryId(categoryId);
        setSelectedDate(undefined);
    };

    // 清除筛选
    const clearFilters = () => {
        setSelectedDate(undefined);
        setSelectedCategoryId(undefined);
    };

    return (
        <div className="flex flex-1 flex-col bg-slate-50 p-6">
            <div className="mx-auto w-full max-w-7xl space-y-6">
                {/* 顶部筛选区 */}
                <Card>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">时间范围：</span>
                            <RangePicker
                                value={dateRange}
                                onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
                                format="YYYY-MM-DD"
                            />
                        </div>

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

                        {(selectedDate || selectedCategoryId) && (
                            <Button onClick={clearFilters}>清除筛选</Button>
                        )}
                    </div>
                </Card>

                {/* 视图切换 */}
                <Card>
                    <Tabs
                        activeKey={viewMode}
                        onChange={(key) => {
                            setViewMode(key as ViewMode);
                            clearFilters();
                        }}
                    >
                        <TabPane tab="按时间统计" key="time">
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <Spin size="large" />
                                </div>
                            ) : timeSummary && timeSummary.items.length > 0 ? (
                                <div className="space-y-6">
                                    <div className="h-80">
                                        <TimeBarChart
                                            data={timeSummary.items}
                                            onBarClick={handleTimeChartClick}
                                            selectedDate={selectedDate}
                                        />
                                    </div>
                                    {selectedDate && (
                                        <div className="text-sm text-gray-500">
                                            已筛选日期：{selectedDate}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex h-80 items-center justify-center text-gray-400">
                                    暂无数据
                                </div>
                            )}
                        </TabPane>
                        <TabPane tab="按分类统计" key="category">
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <Spin size="large" />
                                </div>
                            ) : categorySummary && categorySummary.items.length > 0 ? (
                                <div className="space-y-6">
                                    <div className="h-80">
                                        <CategoryBarChart
                                            data={categorySummary.items}
                                            onBarClick={handleCategoryChartClick}
                                            selectedCategoryId={selectedCategoryId}
                                        />
                                    </div>
                                    {selectedCategoryId && (
                                        <div className="text-sm text-gray-500">
                                            已筛选分类：ID {selectedCategoryId}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex h-80 items-center justify-center text-gray-400">
                                    暂无数据
                                </div>
                            )}
                        </TabPane>
                    </Tabs>
                </Card>

                {/* 记录列表 */}
                <Card title="记录列表">
                    {recordsList.length > 0 ? (
                        <div className="space-y-2">
                            {recordsList.map((record) => (
                                <div
                                    key={record.id}
                                    className="flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50 cursor-pointer"
                                    onClick={() => router.push(`/records/${record.id}`)}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-500">
                                            {dayjs(record.occurred_at).format('YYYY-MM-DD HH:mm')}
                                        </span>
                                        <span className="text-sm font-medium">
                                            {record.category_name || '未分类'}
                                        </span>
                                        {record.remark && (
                                            <span className="text-sm text-gray-400">{record.remark}</span>
                                        )}
                                    </div>
                                    <span
                                        className={`text-sm font-semibold ${
                                            record.type_id === 1 ? 'text-red-600' : 'text-green-600'
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
            </div>
        </div>
    );
}

// 时间条形图组件
function TimeBarChart({
    data,
    onBarClick,
    selectedDate,
}: {
    data: Array<{ date: string; total_amount: number }>;
    onBarClick: (date: string) => void;
    selectedDate?: string;
}) {
    if (data.length === 0) return null;

    const maxAmount = Math.max(...data.map((d) => d.total_amount));
    const barWidth = 100 / data.length;

    return (
        <div className="relative h-full w-full">
            <div className="flex h-full items-end gap-1">
                {data.map((item, index) => {
                    const height = (item.total_amount / maxAmount) * 100;
                    const isSelected = selectedDate === item.date;

                    return (
                        <div
                            key={index}
                            className="flex-1 cursor-pointer group relative"
                            onClick={() => onBarClick(item.date)}
                        >
                            <div
                                className={`w-full transition-all ${
                                    isSelected ? 'bg-emerald-600' : 'bg-emerald-400 group-hover:bg-emerald-500'
                                }`}
                                style={{ height: `${height}%` }}
                            />
                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-500 whitespace-nowrap">
                                {dayjs(item.date).format('MM-DD')}
                            </div>
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-700 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                                ¥{item.total_amount}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// 分类条形图组件
function CategoryBarChart({
    data,
    onBarClick,
    selectedCategoryId,
}: {
    data: Array<{ category_id: number; category_name: string; total_amount: number; percent: number }>;
    onBarClick: (categoryId: number) => void;
    selectedCategoryId?: number;
}) {
    if (data.length === 0) return null;

    const maxAmount = Math.max(...data.map((d) => d.total_amount));

    return (
        <div className="space-y-3">
            {data.map((item) => {
                const width = (item.total_amount / maxAmount) * 100;
                const isSelected = selectedCategoryId === item.category_id;

                return (
                    <div key={item.category_id} className="group">
                        <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-700">{item.category_name}</span>
                            <span className="text-gray-500">
                                ¥{item.total_amount} ({(item.percent * 100)}%)
                            </span>
                        </div>
                        <div
                            className={`h-8 cursor-pointer rounded transition-all ${
                                isSelected ? 'bg-emerald-600' : 'bg-emerald-400 group-hover:bg-emerald-500'
                            }`}
                            style={{ width: `${width}%` }}
                            onClick={() => onBarClick(item.category_id)}
                        />
                    </div>
                );
            })}
        </div>
    );
}

