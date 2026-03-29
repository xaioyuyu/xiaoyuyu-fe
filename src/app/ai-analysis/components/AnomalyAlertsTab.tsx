'use client';

import { useState, useEffect } from 'react';
import { Card, Radio, Select, Button, Table, Tag, Spin, message, Checkbox } from 'antd';
import { ReloadOutlined, CheckOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { aiApi } from '@/features/ai/api';
import type { AnomalyAlert, AnomalyAlertsRequest } from '@/features/ai/types';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';

const { Option } = Select;

interface AnomalyAlertsTabProps {
    onUnreadCountChange?: (count: number) => void;
}

export default function AnomalyAlertsTab({ onUnreadCountChange }: AnomalyAlertsTabProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<AnomalyAlertsRequest>({
        page: 1,
        page_size: 10,
    });
    const [data, setData] = useState<{ list: AnomalyAlert[]; pagination: any; unread_count: number } | null>(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const loadData = async () => {
        try {
            setLoading(true);
            const response = await aiApi.getAnomalyAlerts(filters);
            setData({
                list: response.list,
                pagination: response.pagination,
                unread_count: response.unread_count,
            });
            if (onUnreadCountChange) {
                onUnreadCountChange(response.unread_count);
            }
        } catch (error) {
            console.error('加载异常提醒失败', error);
            message.error('加载异常提醒失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    const handleFilterChange = (key: keyof AnomalyAlertsRequest, value: any) => {
        setFilters({ ...filters, [key]: value, page: 1 });
        setSelectedRowKeys([]);
    };

    const handleMarkRead = async (alertId?: number) => {
        try {
            await aiApi.markAnomalyAlertRead({ alert_id: alertId });
            message.success('标记成功');
            loadData();
        } catch (error) {
            console.error('标记已读失败', error);
            message.error('标记已读失败，请稍后重试');
        }
    };

    const handleBatchMarkRead = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning('请选择要标记的记录');
            return;
        }
        try {
            // 批量标记已读
            await Promise.all(
                selectedRowKeys.map((id) => aiApi.markAnomalyAlertRead({ alert_id: Number(id) })),
            );
            message.success('批量标记成功');
            setSelectedRowKeys([]);
            loadData();
        } catch (error) {
            console.error('批量标记失败', error);
            message.error('批量标记失败，请稍后重试');
        }
    };

    const alertLevelColorMap = {
        low: 'blue',
        medium: 'orange',
        high: 'red',
    };

    const alertLevelTextMap = {
        low: '低',
        medium: '中',
        high: '高',
    };

    const columns = [
        {
            title: '异常类型',
            dataIndex: 'anomaly_type',
            key: 'anomaly_type',
        },
        {
            title: '严重程度',
            dataIndex: 'alert_level',
            key: 'alert_level',
            render: (level: 'low' | 'medium' | 'high') => (
                <Tag color={alertLevelColorMap[level]}>{alertLevelTextMap[level]}</Tag>
            ),
        },
        {
            title: '异常金额',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number) => `¥${amount.toFixed(2)}`,
        },
        {
            title: '发生时间',
            dataIndex: 'occurred_at',
            key: 'occurred_at',
            render: (time: string) => new Date(time).toLocaleString('zh-CN'),
        },
        {
            title: '是否已读',
            dataIndex: 'is_read',
            key: 'is_read',
            render: (isRead: boolean) => (
                <Tag color={isRead ? 'green' : 'red'}>{isRead ? '已读' : '未读'}</Tag>
            ),
        },
        {
            title: '操作',
            key: 'action',
            render: (_: unknown, record: AnomalyAlert) => (
                <div className="flex gap-2">
                    {!record.is_read && (
                        <Button
                            type="link"
                            size="small"
                            icon={<CheckOutlined />}
                            onClick={() => handleMarkRead(record.id)}
                        >
                            标记已读
                        </Button>
                    )}
                    {record.record_id && (
                        <Button
                            type="link"
                            size="small"
                            onClick={() => router.push(`/records/${record.record_id}`)}
                        >
                            查看记录
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            {/* 筛选区 */}
            <Card>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">是否已读：</span>
                        <Radio.Group
                            value={filters.is_read}
                            onChange={(e) => handleFilterChange('is_read', e.target.value)}
                        >
                            <Radio.Button value={undefined}>全部</Radio.Button>
                            <Radio.Button value={false}>未读</Radio.Button>
                            <Radio.Button value={true}>已读</Radio.Button>
                        </Radio.Group>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">严重程度：</span>
                        <Select
                            value={filters.alert_level}
                            onChange={(value) => handleFilterChange('alert_level', value)}
                            allowClear
                            placeholder="全部"
                            style={{ width: 120 }}
                        >
                            <Option value="low">低</Option>
                            <Option value="medium">中</Option>
                            <Option value="high">高</Option>
                        </Select>
                    </div>

                    <div className="ml-auto flex gap-2">
                        {selectedRowKeys.length > 0 && (
                            <Button onClick={handleBatchMarkRead}>批量标记已读 ({selectedRowKeys.length})</Button>
                        )}
                        <Button
                            type="primary"
                            icon={<ReloadOutlined />}
                            onClick={loadData}
                            loading={loading}
                        >
                            刷新
                        </Button>
                    </div>
                </div>
            </Card>

            {/* 提醒列表 */}
            <Card title="异常提醒列表">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Spin size="large" />
                    </div>
                ) : data && data.list.length > 0 ? (
                    <Table
                        columns={columns}
                        dataSource={data.list}
                        rowKey="id"
                        rowSelection={{
                            selectedRowKeys,
                            onChange: setSelectedRowKeys,
                            getCheckboxProps: (record: AnomalyAlert) => ({
                                disabled: record.is_read,
                            }),
                        }}
                        pagination={{
                            current: filters.page,
                            pageSize: filters.page_size,
                            total: data.pagination.total,
                            showSizeChanger: true,
                            showTotal: (total) => `共 ${total} 条`,
                            onChange: (page, pageSize) => {
                                setFilters({ ...filters, page, page_size: pageSize });
                            },
                        }}
                        expandable={{
                            expandedRowRender: (record: AnomalyAlert) => (
                                <Card className="mt-2 bg-gray-50">
                                    <div className="space-y-2">
                                        <div className="text-sm font-semibold text-gray-700">AI提醒消息</div>
                                        <MarkdownRenderer content={record.ai_message} />
                                    </div>
                                </Card>
                            ),
                        }}
                    />
                ) : (
                    <div className="py-8 text-center text-gray-400">暂无异常提醒</div>
                )}
            </Card>
        </div>
    );
}

