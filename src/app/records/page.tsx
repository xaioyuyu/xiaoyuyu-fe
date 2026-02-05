'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Table, DatePicker, Input, Button, Space, message, Modal, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { recordsApi, type GetRecordsParams } from '@/features/records/api';
import type { RecordItem, RecordsListData } from '@/features/records/types';

const DEFAULT_PAGE_SIZE = 20;

export default function RecordsListPage() {
    const router = useRouter();
    const [filters, setFilters] = useState<GetRecordsParams>({
        page: 1,
        page_size: DEFAULT_PAGE_SIZE,
    });
    const [data, setData] = useState<RecordsListData | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchData = async (params: GetRecordsParams) => {
        try {
            setLoading(true);
            const res = await recordsApi.getRecords(params);
            setData(res);
        } catch (e) {
            const msg = e instanceof Error ? e.message : '加载记录失败，请稍后重试';
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchData(filters);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.page, filters.page_size, filters.start_date, filters.end_date, filters.keyword]);

    const handleFilterChange = (field: keyof GetRecordsParams, value: unknown) => {
        setFilters((prev) => ({
            ...prev,
            [field]: value,
            page: 1,
        }));
    };

    const handleDelete = async (record: RecordItem) => {
        Modal.confirm({
            title: '确认删除',
            content: '确认删除该记录吗？',
            okText: '确认',
            cancelText: '取消',
            onOk: async () => {
                try {
                    await recordsApi.deleteRecord({ id: record.id });
                    message.success('删除成功');
                    void fetchData(filters);
                } catch (e) {
                    const msg = e instanceof Error ? e.message : '删除失败，请稍后重试';
                    message.error(msg);
                }
            },
        });
    };

    const columns: ColumnsType<RecordItem> = [
        {
            title: '日期',
            dataIndex: 'occurred_at',
            key: 'occurred_at',
            width: 180,
            render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
        },
        {
            title: '分类',
            dataIndex: 'category_name',
            key: 'category_name',
            render: (name: string, record: RecordItem) => name || record.category_id,
        },
        {
            title: '金额',
            dataIndex: 'amount',
            key: 'amount',
            align: 'right',
            width: 120,
            render: (amount: string) => (
                <span className="font-semibold">￥{amount}</span>
            ),
        },
        {
            title: '备注',
            dataIndex: 'remark',
            key: 'remark',
            ellipsis: true,
            render: (remark: string) => remark || '-',
        },
        {
            title: '操作',
            key: 'action',
            width: 180,
            render: (_: unknown, record: RecordItem) => (
                <Space size="small">
                    <Button
                        type="link"
                        size="small"
                        className="cursor-pointer p-0"
                        onClick={() => router.push(`/records/${record.id}`)}
                    >
                        查看
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        className="cursor-pointer p-0"
                        onClick={() => router.push(`/records/${record.id}/edit`)}
                    >
                        编辑
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        danger
                        className="cursor-pointer p-0"
                        onClick={() => void handleDelete(record)}
                    >
                        删除
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="flex h-full flex-1 flex-col gap-4 bg-slate-50 p-4">
            <Card
                title="账目记录"
                extra={
                    <Button
                        type="primary"
                        className="cursor-pointer"
                        onClick={() => router.push('/records/new')}
                    >
                        记一笔
                    </Button>
                }
            >
                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                        <label className="mb-1 block text-xs text-slate-500">起始日期</label>
                        <DatePicker
                            className="w-full"
                            format="YYYY-MM-DD"
                            value={filters.start_date ? dayjs(filters.start_date) : null}
                            onChange={(date: Dayjs | null) =>
                                handleFilterChange('start_date', date ? date.format('YYYY-MM-DD') : undefined)
                            }
                            allowClear
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs text-slate-500">结束日期</label>
                        <DatePicker
                            className="w-full"
                            format="YYYY-MM-DD"
                            value={filters.end_date ? dayjs(filters.end_date) : null}
                            onChange={(date: Dayjs | null) =>
                                handleFilterChange('end_date', date ? date.format('YYYY-MM-DD') : undefined)
                            }
                            allowClear
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs text-slate-500">备注关键字</label>
                        <Input
                            placeholder="例如：午饭、房租"
                            value={filters.keyword ?? ''}
                            onChange={(e) => handleFilterChange('keyword', e.target.value || undefined)}
                            allowClear
                        />
                    </div>
                </div>

                <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                        合计金额：{' '}
                        <Tag color="blue" className="font-semibold">
                            ￥{data?.summary?.total_amount ?? '0.00'}
                        </Tag>
                    </div>
                </div>

                <Table
                    columns={columns}
                    dataSource={data?.list || []}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: filters.page ?? 1,
                        pageSize: filters.page_size ?? DEFAULT_PAGE_SIZE,
                        total: data?.pagination.total ?? 0,
                        showTotal: (total) => `共 ${total} 条记录`,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        onChange: (page, pageSize) => {
                            setFilters((prev) => ({
                                ...prev,
                                page,
                                page_size: pageSize,
                            }));
                        },
                    }}
                />
            </Card>
        </div>
    );
}


