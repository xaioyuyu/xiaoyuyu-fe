'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Table, DatePicker, Select, Input, InputNumber, Button, message, Tag, Space } from 'antd';
import { SearchOutlined, HomeOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from '@/lib/utils/dayjs';
import { recordsApi, type GetRecordsParams } from '@/features/records/api';
import type { RecordsListData, RecordItem, RecordType, Pagination } from '@/features/records/types';

const { RangePicker } = DatePicker;
const { Option } = Select;

const DEFAULT_PAGE_SIZE = 50;

/** 兼容后端字段差异，避免缺 pagination/summary 时整页报错、表格空白 */
function normalizeRecordsListData(raw: unknown): RecordsListData {
    const emptyPagination: Pagination = {
        total: 0,
        page: 1,
        page_size: DEFAULT_PAGE_SIZE,
    };
    if (!raw || typeof raw !== 'object') {
        return { list: [], pagination: emptyPagination, summary: { total_amount: 0 } };
    }
    const o = raw as Record<string, unknown>;
    const list = (
        Array.isArray(o.list) ? o.list : Array.isArray(o.records) ? o.records : []
    ) as RecordItem[];
    let pagination: Pagination;
    const pag = o.pagination;
    if (pag && typeof pag === 'object') {
        const p = pag as Record<string, unknown>;
        pagination = {
            total: Number(p.total) >= 0 ? Number(p.total) : list.length,
            page: Number(p.page) || 1,
            page_size: Number(p.page_size) || DEFAULT_PAGE_SIZE,
        };
    } else {
        pagination = { total: list.length, page: 1, page_size: DEFAULT_PAGE_SIZE };
    }
    const sum = o.summary;
    let total_amount = 0;
    if (sum && typeof sum === 'object' && sum !== null && 'total_amount' in sum) {
        total_amount = Number((sum as { total_amount: unknown }).total_amount) || 0;
    }
    return { list, pagination, summary: { total_amount } };
}

function formatAmount(amount: unknown): string {
    const n = typeof amount === 'number' ? amount : Number(amount);
    return Number.isFinite(n) ? n.toFixed(2) : String(amount ?? '');
}

// TODO: 需要实现 admin 账目审计接口
// GET /api/admin/records - 支持跨用户查询
// POST /api/admin/records/history - 获取记录历史变更

type LoadOverrides = Partial<{
    dateRange: [Dayjs, Dayjs] | null;
    typeId: number | undefined;
    keyword: string;
    minAmount: number | undefined;
    maxAmount: number | undefined;
    page: number;
    pageSize: number;
}>;

export default function AdminRecordsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [recordsData, setRecordsData] = useState<RecordsListData | null>(null);
    const [recordTypes, setRecordTypes] = useState<RecordType[]>([]);

    // 筛选条件（仅点「查询」或「重置」后才会用于请求）
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
        dayjs().startOf('month'),
        dayjs().endOf('month'),
    ]);
    const [typeId, setTypeId] = useState<number | undefined>(undefined);
    const [keyword, setKeyword] = useState('');
    const [minAmount, setMinAmount] = useState<number | undefined>(undefined);
    const [maxAmount, setMaxAmount] = useState<number | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
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

    const loadData = async (overrides?: LoadOverrides) => {
        const dr = overrides?.dateRange !== undefined ? overrides.dateRange : dateRange;
        if (!dr || !dr[0] || !dr[1]) {
            message.warning('请选择完整的时间范围');
            return;
        }
        const tid = overrides?.typeId !== undefined ? overrides.typeId : typeId;
        const kw = overrides?.keyword !== undefined ? overrides.keyword : keyword;
        const minA = overrides?.minAmount !== undefined ? overrides.minAmount : minAmount;
        const maxA = overrides?.maxAmount !== undefined ? overrides.maxAmount : maxAmount;
        const p = overrides?.page ?? page;
        const ps = overrides?.pageSize ?? pageSize;

        try {
            setLoading(true);
            const [startDate, endDate] = [dr[0].format('YYYY-MM-DD'), dr[1].format('YYYY-MM-DD')];

            const params: GetRecordsParams = {
                page: p,
                page_size: ps,
                start_date: startDate,
                end_date: endDate,
                order_by: 'occurred_at',
                order: 'desc',
                ...(typeof tid === 'number' && { type_id: tid }),
                ...(kw.trim() && { keyword: kw.trim() }),
                ...(minA !== undefined && { min_amount: minA }),
                ...(maxA !== undefined && { max_amount: maxA }),
            };

            // TODO: 当前使用普通接口，未来需要改为 GET /api/admin/records 支持跨用户查询
            const res = await recordsApi.getRecords(params);
            setRecordsData(normalizeRecordsListData(res));
            setPage(p);
            setPageSize(ps);
        } catch (error) {
            console.error('加载数据失败', error);
            message.error('加载数据失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    /** 首屏按默认条件拉一次 */
    useEffect(() => {
        void loadData({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅挂载时加载
    }, []);

    const handleQuery = () => {
        void loadData({ page: 1 });
    };

    const handleReset = () => {
        const defaultRange: [Dayjs, Dayjs] = [dayjs().startOf('month'), dayjs().endOf('month')];
        setDateRange(defaultRange);
        setTypeId(undefined);
        setKeyword('');
        setMinAmount(undefined);
        setMaxAmount(undefined);
        setPage(1);
        setPageSize(DEFAULT_PAGE_SIZE);
        void loadData({
            dateRange: defaultRange,
            typeId: undefined,
            keyword: '',
            minAmount: undefined,
            maxAmount: undefined,
            page: 1,
            pageSize: DEFAULT_PAGE_SIZE,
        });
    };

    const columns: ColumnsType<RecordItem> = [
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
            render: (uid: number | undefined) => uid ?? '—',
            // TODO: 显示用户名（需要接口返回或关联查询）
        },
        {
            title: '时间',
            dataIndex: 'occurred_at',
            key: 'occurred_at',
            width: 180,
            render: (date: string) => {
                const d = dayjs(date);
                return d.isValid() ? d.format('YYYY-MM-DD HH:mm') : String(date ?? '—');
            },
        },
        {
            title: '类型',
            dataIndex: 'type_id',
            key: 'type_id',
            width: 100,
            render: (tid: number, record: RecordItem) => {
                const type = recordTypes.find((t) => t.id === tid);
                const label = record.type_name || type?.name || `类型${tid}`;
                return <Tag>{label}</Tag>;
            },
        },
        {
            title: '分类',
            dataIndex: 'category_name',
            key: 'category_name',
            render: (name: string | undefined, record: RecordItem) => name || record.category_id || '—',
        },
        {
            title: '金额',
            dataIndex: 'amount',
            key: 'amount',
            width: 120,
            render: (amount: unknown, record: RecordItem) => (
                <span
                    className={`font-semibold ${
                        record.type_id === 1 ? 'text-red-600' : 'text-green-600'
                    }`}
                >
                    {record.type_id === 1 ? '-' : '+'}¥{formatAmount(amount)}
                </span>
            ),
        },
        {
            title: '备注',
            dataIndex: 'remark',
            key: 'remark',
            ellipsis: true,
            render: (text: string | undefined) => text || '—',
        },
        {
            title: '操作',
            key: 'action',
            width: 150,
            render: (_: unknown, record: RecordItem) => (
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

                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">金额范围：</span>
                                    <InputNumber
                                        placeholder="最小金额"
                                        value={minAmount}
                                        onChange={(val) =>
                                            setMinAmount(
                                                val !== null && val !== undefined ? Number(val) : undefined,
                                            )
                                        }
                                        style={{ width: 120 }}
                                        min={0}
                                        prefix="¥"
                                    />
                                    <span className="text-gray-400">-</span>
                                    <InputNumber
                                        placeholder="最大金额"
                                        value={maxAmount}
                                        onChange={(val) =>
                                            setMaxAmount(
                                                val !== null && val !== undefined ? Number(val) : undefined,
                                            )
                                        }
                                        style={{ width: 120 }}
                                        min={0}
                                        prefix="¥"
                                    />
                                </div>
                                {/* TODO: 添加用户筛选 */}
                            </div>
                            <Space>
                                <Button
                                    type="primary"
                                    icon={<SearchOutlined />}
                                    loading={loading}
                                    onClick={handleQuery}
                                >
                                    查询
                                </Button>
                                <Button icon={<ReloadOutlined />} disabled={loading} onClick={handleReset}>
                                    重置
                                </Button>
                            </Space>
                        </div>
                    </div>

                    {recordsData && (
                        <div className="mb-4 text-sm text-gray-600">
                            共找到 {recordsData.pagination?.total ?? recordsData.list?.length ?? 0}{' '}
                            条记录，总金额：¥
                            {formatAmount(recordsData.summary?.total_amount ?? 0)}
                        </div>
                    )}

                    <Table<RecordItem>
                        columns={columns}
                        dataSource={recordsData?.list ?? []}
                        rowKey="id"
                        loading={loading}
                        pagination={{
                            current: page,
                            pageSize,
                            total: recordsData?.pagination?.total ?? 0,
                            showTotal: (total) => `共 ${total} 条`,
                            showSizeChanger: true,
                            pageSizeOptions: [20, 50, 100],
                            onChange: (p, ps) => {
                                void loadData({ page: p, pageSize: ps });
                            },
                        }}
                    />
                </Card>
            </div>
        </div>
    );
}

