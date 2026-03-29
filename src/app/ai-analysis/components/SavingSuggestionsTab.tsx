'use client';

import { useState, useEffect } from 'react';
import { Card, DatePicker, Radio, Button, Table, Tag, Spin, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from '@/lib/utils/dayjs';
import { aiApi } from '@/features/ai/api';
import type { SavingSuggestionsResponse, IncreasedCategory } from '@/features/ai/types';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';

export default function SavingSuggestionsTab() {
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
    const [compareType, setCompareType] = useState<'month' | 'year'>('month');
    const [data, setData] = useState<SavingSuggestionsResponse | null>(null);
    const [expandedRows, setExpandedRows] = useState<number[]>([]);

    const loadData = async (forceRefresh = false) => {
        try {
            setLoading(true);
            const response = await aiApi.getSavingSuggestions({
                year: selectedDate.year(),
                month: selectedDate.month() + 1,
                compare_type: compareType,
                force_refresh: forceRefresh,
            });
            setData(response);
        } catch (error) {
            console.error('加载节省建议失败', error);
            message.error('加载节省建议失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate, compareType]);

    const handleRefresh = () => {
        loadData(true);
    };

    const columns = [
        {
            title: '分类名称',
            dataIndex: 'category_name',
            key: 'category_name',
        },
        {
            title: '当前金额',
            dataIndex: 'current_amount',
            key: 'current_amount',
            render: (amount: number) => `¥${amount.toFixed(2)}`,
        },
        {
            title: '上期金额',
            dataIndex: 'previous_amount',
            key: 'previous_amount',
            render: (amount: number) => `¥${amount.toFixed(2)}`,
        },
        {
            title: '增长幅度',
            dataIndex: 'increase_ratio',
            key: 'increase_ratio',
            render: (percent: number) => {
                const color = percent > 0 ? 'red' : 'green';
                const text = percent > 0 ? `+${percent.toFixed(2)}%` : `${percent.toFixed(2)}%`;
                return <Tag color={color}>{text}</Tag>;
            },
        },
        {
            title: '操作',
            key: 'action',
            render: (_: unknown, record: IncreasedCategory) => (
                <Button
                    type="link"
                    size="small"
                    onClick={() => {
                        if (expandedRows.includes(record.category_id)) {
                            setExpandedRows(expandedRows.filter((id) => id !== record.category_id));
                        } else {
                            setExpandedRows([...expandedRows, record.category_id]);
                        }
                    }}
                >
                    {expandedRows.includes(record.category_id) ? '收起' : '查看建议'}
                </Button>
            ),
        },
    ];

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

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">对比类型：</span>
                        <Radio.Group
                            value={compareType}
                            onChange={(e) => setCompareType(e.target.value)}
                            buttonStyle="solid"
                        >
                            <Radio.Button value="month">环比</Radio.Button>
                            <Radio.Button value="year">同比</Radio.Button>
                        </Radio.Group>
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

            {/* 建议列表 */}
            <Card title="节省建议">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Spin size="large" />
                    </div>
                ) : data && (data.comparison?.increased_categories?.length ?? 0) > 0 ? (
                    <div className="space-y-4">
                        <Table
                            columns={columns}
                            dataSource={data.comparison?.increased_categories ?? []}
                            rowKey="category_id"
                            pagination={false}
                            expandable={{
                                expandedRowKeys: expandedRows,
                                onExpand: (expanded, record) => {
                                    if (expanded) {
                                        setExpandedRows([...expandedRows, record.category_id]);
                                    } else {
                                        setExpandedRows(expandedRows.filter((id) => id !== record.category_id));
                                    }
                                },
                                expandedRowRender: (record: IncreasedCategory) => {
                                    const suggestionItem = data.suggestions.find(
                                        (s) => s.category_id === record.category_id,
                                    );
                                    const suggestionText = suggestionItem?.suggestion ?? '暂无建议';
                                    return (
                                        <Card className="mt-2 bg-gray-50">
                                            <div className="space-y-2">
                                                <div className="text-sm font-semibold text-gray-700">
                                                    {record.category_name} - AI建议
                                                </div>
                                                <MarkdownRenderer content={suggestionText} />
                                            </div>
                                        </Card>
                                    );
                                },
                            }}
                        />
                    </div>
                ) : (
                    <div className="py-8 text-center text-gray-400">暂无建议数据</div>
                )}
            </Card>
        </div>
    );
}

