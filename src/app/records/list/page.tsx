'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Table, DatePicker, Input, Button, Space, message, Modal, Tag } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from '@/lib/utils/dayjs';
import { throttle } from 'lodash';
import { utcToCST } from '@/lib/utils';
import { recordsApi, type GetRecordsParams } from '@/features/records/api';
import type { RecordItem, RecordsListData } from '@/features/records/types';

const DEFAULT_PAGE_SIZE = 20;

export default function RecordsListPage() {
    const router = useRouter();
    // 查询参数（实际用于请求）
    const [queryParams, setQueryParams] = useState<GetRecordsParams>({
        page: 1,
        page_size: DEFAULT_PAGE_SIZE,
    });
    // 筛选条件（用于表单显示，不立即触发请求）
    const [filters, setFilters] = useState<GetRecordsParams>({
        page: 1,
        page_size: DEFAULT_PAGE_SIZE,
    });
    const [data, setData] = useState<RecordsListData | null>(null);
    const [loading, setLoading] = useState(false);
    // 查询触发器，用于强制触发查询
    const [searchTrigger, setSearchTrigger] = useState(0);

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

    // 只有查询触发器变化时才自动查询（统一由查询按钮触发）
    useEffect(() => {
        void fetchData(queryParams);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTrigger]);

    // 使用 ref 保存最新的 filters，以便节流函数能访问到最新值
    const filtersRef = useRef(filters);
    useEffect(() => {
        filtersRef.current = filters;
    }, [filters]);

    // 创建稳定的节流函数
    const handleSearchThrottled = useRef(
        throttle(() => {
            setQueryParams((prev) => {
                const newParams = {
                    ...prev,
                    ...filtersRef.current,
                    page: 1,
                };
                // 通过更新 searchTrigger 来强制触发查询
                setSearchTrigger((t) => t + 1);
                return newParams;
            });
        }, 1000)
    );

    // 组件卸载时清理节流函数
    useEffect(() => {
        const throttledFn = handleSearchThrottled.current;
        return () => {
            throttledFn.cancel();
        };
    }, []);

    const handleFilterChange = (field: keyof GetRecordsParams, value: unknown) => {
        // 直接更新筛选条件，不使用防抖
        setFilters((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSearch = () => {
        // 调用节流函数
        handleSearchThrottled.current();
    };

    const handleReset = () => {
        // 重置筛选条件为空
        const defaultFilters: GetRecordsParams = {
            page: 1,
            page_size: DEFAULT_PAGE_SIZE,
        };
        setFilters(defaultFilters);
        // 重置查询参数并触发查询
        setQueryParams(defaultFilters);
        setSearchTrigger((t) => t + 1);
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
                    void fetchData(queryParams);
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
            render: (date: string) => utcToCST(date),
        },
        {
            title: '类型',
            dataIndex: 'type_name',
            key: 'type_name',
            width: 120,
            render: (name: string, record: RecordItem) => name || record.type_id,
        },
        {
            title: '分类',
            dataIndex: 'category_name',
            key: 'category_name',
            width: 120,
            render: (name: string, record: RecordItem) => name || record.category_id,
        },
        {
            title: '金额',
            dataIndex: 'amount',
            key: 'amount',
            // align: 'right',
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
                        详情
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        className="cursor-pointer p-0"
                        onClick={() => router.push(`/records/${record.id}?mode=edit`)}
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
            <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push('/records')}
                className="mb-2 self-start"
            >
                返回记账中心
            </Button>
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
                <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end">
                    <div className="flex-1">
                        <label className="mb-1 block text-xs text-slate-500">起始日期</label>
                        <DatePicker
                            className="w-full"
                            format="YYYY-MM-DD"
                            value={filters.start_date ? dayjs(filters.start_date) : null}
                            onChange={(date: Dayjs | null) =>
                                handleFilterChange('start_date', date ? date.format('YYYY-MM-DD') : undefined)
                            }
                            allowClear
                            placeholder="选择起始日期"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="mb-1 block text-xs text-slate-500">结束日期</label>
                        <DatePicker
                            className="w-full"
                            format="YYYY-MM-DD"
                            value={filters.end_date ? dayjs(filters.end_date) : null}
                            onChange={(date: Dayjs | null) =>
                                handleFilterChange('end_date', date ? date.format('YYYY-MM-DD') : undefined)
                            }
                            allowClear
                            placeholder="选择结束日期"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="mb-1 block text-xs text-slate-500">备注关键字</label>
                        <Input
                            placeholder="例如：午饭、房租"
                            value={filters.keyword ?? ''}
                            onChange={(e) => handleFilterChange('keyword', e.target.value || undefined)}
                            allowClear
                        />
                    </div>
                    <div className="shrink-0 flex gap-2">
                        <Button
                            type="primary"
                            className="cursor-pointer min-w-[80px]"
                            onClick={handleSearch}
                            loading={loading}
                        >
                            查询
                        </Button>
                        <Button
                            className="cursor-pointer min-w-[80px]"
                            onClick={handleReset}
                            disabled={loading}
                        >
                            重置
                        </Button>
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
                        current: queryParams.page ?? 1,
                        pageSize: queryParams.page_size ?? DEFAULT_PAGE_SIZE,
                        total: data?.pagination.total ?? 0,
                        showTotal: (total) => `共 ${total} 条记录`,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        onChange: (page, pageSize) => {
                            // 只更新分页参数，不触发查询（统一由查询按钮触发）
                            setQueryParams((prev) => ({
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


