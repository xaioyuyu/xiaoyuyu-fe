'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Table, DatePicker, Select, Input, InputNumber, Button, message, Tag } from 'antd';
import { SearchOutlined, HomeOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { recordsApi } from '@/features/records/api';
import type { RecordsListData, RecordItem, RecordType } from '@/features/records/types';

const { RangePicker } = DatePicker;
const { Option } = Select;

// TODO: 需要实现 admin 账目审计接口
// GET /api/admin/records - 支持跨用户查询
// POST /api/admin/records/history - 获取记录历史变更

export default function AdminRecordsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [recordsData, setRecordsData] = useState<RecordsListData | null>(null);
    const [recordTypes, setRecordTypes] = useState<RecordType[]>([]);

    // 筛选条件
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
        dayjs().startOf('month'),
        dayjs().endOf('month'),
    ]);
    const [typeId, setTypeId] = useState<number | undefined>(undefined);
    const [keyword, setKeyword] = useState('');
    const [minAmount, setMinAmount] = useState<number | undefined>(undefined);
    const [maxAmount, setMaxAmount] = useState<number | undefined>(undefined);
    // TODO: 添加用户筛选（需要 admin 接口支持）

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

    const loadData = async () => {
        try {
            setLoading(true);
            const [startDate, endDate] = [
                dateRange[0].format('YYYY-MM-DD'),
                dateRange[1].format('YYYY-MM-DD'),
            ];

            // TODO: 当前使用普通接口，未来需要改为 GET /api/admin/records 支持跨用户查询
            const res = await recordsApi.getRecords({
                page: 1,
                page_size: 50,
                start_date: startDate,
                end_date: endDate,
                ...(typeId && { type_id: typeId }),
                ...(keyword && { keyword }),
                ...(minAmount !== undefined && { min_amount: minAmount }),
                ...(maxAmount !== undefined && { max_amount: maxAmount }),
                order_by: 'occurred_at',
                order: 'desc',
            });

            setRecordsData(res);
        } catch (error) {
            console.error('加载数据失败', error);
            message.error('加载数据失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [dateRange, typeId, keyword, minAmount, maxAmount]);

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: '用户ID',
            dataIndex: 'user_id',
            key: 'user_id',
            width: 100,
            // TODO: 显示用户名（需要接口返回或关联查询）
        },
        {
            title: '时间',
            dataIndex: 'occurred_at',
            key: 'occurred_at',
            width: 180,
            render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
        },
        {
            title: '类型',
            dataIndex: 'type_id',
            key: 'type_id',
            width: 100,
            render: (typeId: number) => {
                const type = recordTypes.find((t) => t.id === typeId);
                return <Tag>{type?.name || `类型${typeId}`}</Tag>;
            },
        },
        {
            title: '分类',
            dataIndex: 'category_name',
            key: 'category_name',
        },
        {
            title: '金额',
            dataIndex: 'amount',
            key: 'amount',
            width: 120,
            render: (amount: number, record: RecordItem) => (
                <span
                    className={`font-semibold ${
                        record.type_id === 1 ? 'text-red-600' : 'text-green-600'
                    }`}
                >
                    {record.type_id === 1 ? '-' : '+'}¥{amount.toFixed(2)}
                </span>
            ),
        },
        {
            title: '备注',
            dataIndex: 'remark',
            key: 'remark',
            ellipsis: true,
        },
        {
            title: '操作',
            key: 'action',
            width: 150,
            render: (_: any, record: RecordItem) => (
                <div className="flex gap-2">
                    <Button
                        type="link"
                        size="small"
                        className="cursor-pointer"
                        onClick={() => router.push(`/records/${record.id}`)}
                    >
                        查看
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => {
                            // TODO: 查看历史变更
                            message.info('历史变更功能待实现');
                        }}
                    >
                        历史
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="flex flex-1 flex-col bg-slate-50 p-6">
            <div className="mx-auto w-full max-w-7xl space-y-6">
                <Card
                    title="账目全局查询与风控审计"
                    extra={
                        <Button
                            type="default"
                            icon={<HomeOutlined />}
                            onClick={() => router.push('/admin')}
                        >
                            返回首页
                        </Button>
                    }
                >
                    <div className="mb-4 space-y-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">时间范围：</span>
                                <RangePicker
                                    value={dateRange}
                                    onChange={(dates) =>
                                        dates && setDateRange(dates as [Dayjs, Dayjs])
                                    }
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

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">关键字：</span>
                                <Input
                                    placeholder="搜索备注"
                                    prefix={<SearchOutlined />}
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    style={{ width: 200 }}
                                    allowClear
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">金额范围：</span>
                                <InputNumber
                                    placeholder="最小金额"
                                    value={minAmount}
                                    onChange={(val) => setMinAmount(val || undefined)}
                                    style={{ width: 120 }}
                                    min={0}
                                    prefix="¥"
                                />
                                <span className="text-gray-400">-</span>
                                <InputNumber
                                    placeholder="最大金额"
                                    value={maxAmount}
                                    onChange={(val) => setMaxAmount(val || undefined)}
                                    style={{ width: 120 }}
                                    min={0}
                                    prefix="¥"
                                />
                            </div>

                            {/* TODO: 添加用户筛选 */}
                        </div>
                    </div>

                    {recordsData && (
                        <div className="mb-4 text-sm text-gray-600">
                            共找到 {recordsData.pagination.total} 条记录，总金额：¥
                            {recordsData.summary.total_amount.toFixed(2)}
                        </div>
                    )}

                    <Table
                        columns={columns}
                        dataSource={recordsData?.list || []}
                        rowKey="id"
                        loading={loading}
                        pagination={{
                            pageSize: 50,
                            total: recordsData?.pagination.total || 0,
                            showTotal: (total) => `共 ${total} 条`,
                        }}
                    />
                </Card>
            </div>
        </div>
    );
}

