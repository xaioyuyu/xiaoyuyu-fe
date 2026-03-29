'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Card,
    DatePicker,
    InputNumber,
    Button,
    Table,
    Form,
    Select,
    Spin,
    message,
    Modal,
    Popconfirm,
} from 'antd';
import { ArrowLeftOutlined, PlusOutlined, ReloadOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from '@/lib/utils/dayjs';
import { recordsApi } from '@/features/records/api';
import { budgetApi } from '@/features/budget/api';
import type { Category } from '@/features/records/types';
import type { BudgetItem, BudgetDetail } from '@/features/budget/types';

export default function BudgetPage() {
    const router = useRouter();
    const [listLoading, setListLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
    const [categories, setCategories] = useState<Category[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();

    // 列表数据
    const [list, setList] = useState<BudgetItem[]>([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, page_size: 20 });

    // 筛选条件（表单展示）
    const [filters, setFilters] = useState<{ year?: number; month?: number }>({});
    // 实际请求参数（查询/重置/分页时更新，effect 依赖此项拉取列表）
    const [queryParams, setQueryParams] = useState<{ year?: number; month?: number; page: number; page_size: number }>({
        page: 1,
        page_size: 20,
    });

    // 详情弹窗
    const [detailVisible, setDetailVisible] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detail, setDetail] = useState<BudgetDetail | null>(null);

    // 加载分类
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await recordsApi.getCategories({ type_id: 1 });
                setCategories(response.list);
            } catch (error) {
                console.error('加载分类失败', error);
            }
        };
        loadCategories();
    }, []);

    // 列表查询
    const loadList = async () => {
        try {
            setListLoading(true);
            const res = await budgetApi.getBudgetList(queryParams);
            setList(res.list ?? []);
            setPagination(res.pagination ?? { total: 0, page: 1, page_size: 20 });
        } catch (error) {
            console.error('加载预算列表失败', error);
            message.error('加载预算列表失败，请稍后重试');
        } finally {
            setListLoading(false);
        }
    };

    useEffect(() => {
        loadList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryParams]);

    const handleQuery = () => {
        setQueryParams((prev) => ({
            ...prev,
            ...filters,
            page: 1,
        }));
    };

    const handleReset = () => {
        setFilters({});
        setQueryParams({ page: 1, page_size: pagination.page_size });
    };

    const handleTableChange = (page: number, pageSize: number) => {
        setQueryParams((prev) => ({ ...prev, page, page_size: pageSize }));
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
        form.resetFields();
        form.setFieldsValue({ year_month: selectedDate });
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        form.resetFields();
    };

    const handleSubmit = async (values: { year_month: Dayjs; total_budget: number }) => {
        try {
            const year_month = values.year_month.format('YYYYMM');
            await budgetApi.createBudget({
                year_month,
                total_budget: values.total_budget,
            });
            message.success('保存预算成功');
            handleCloseModal();
            setQueryParams((prev) => ({ ...prev }));
        } catch (error) {
            console.error('保存预算失败', error);
            message.error('保存预算失败，请稍后重试');
        }
    };

    const handleViewDetail = async (record: BudgetItem) => {
        try {
            setDetailVisible(true);
            setDetailLoading(true);
            setDetail(null);
            const data = await budgetApi.getBudgetDetail({ id: record.id });
            setDetail(data);
        } catch (error) {
            console.error('获取预算详情失败', error);
            message.error('获取预算详情失败，请稍后重试');
        } finally {
            setDetailLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await budgetApi.deleteBudget(id);
            message.success('删除成功');
            setQueryParams((prev) => ({ ...prev }));
        } catch (error) {
            console.error('删除预算失败', error);
            message.error('删除预算失败，请稍后重试');
        }
    };

    const formatYearMonth = (ym: string) => {
        if (ym.length === 6) {
            return `${ym.slice(0, 4)}年${ym.slice(4, 6)}月`;
        }
        return ym;
    };

    const budgetColumns = [
        {
            title: '年月',
            dataIndex: 'year_month',
            key: 'year_month',
            render: (ym: string) => formatYearMonth(ym),
        },
        {
            title: '总预算',
            dataIndex: 'total_budget',
            key: 'total_budget',
            render: (amount: number) => `¥${(amount ?? 0).toFixed(2)}`,
        },
        {
            title: '创建时间',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (time: string) => (time ? new Date(time).toLocaleString('zh-CN') : '-'),
        },
        {
            title: '操作',
            key: 'action',
            width: 180,
            render: (_: unknown, record: BudgetItem) => (
                <div className="flex gap-2">
                    <Button
                        type="link"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetail(record)}
                    >
                        查看详情
                    </Button>
                    <Popconfirm
                        title="确定要删除该预算吗？"
                        onConfirm={() => handleDelete(record.id)}
                        okText="确定"
                        cancelText="取消"
                    >
                        <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                            删除
                        </Button>
                    </Popconfirm>
                </div>
            ),
        },
    ];

    return (
        <div className="flex flex-1 flex-col bg-slate-50 p-6">
            <div className="mx-auto w-full max-w-7xl space-y-6">
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.push('/records')}
                    className="mb-2"
                >
                    返回记账中心
                </Button>

                <Card
                    title="预算设置"
                    extra={
                        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>
                            新建预算
                        </Button>
                    }
                >
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="text-sm text-gray-600">选择月份：</span>
                        <DatePicker
                            picker="month"
                            value={selectedDate}
                            onChange={(date) => date && setSelectedDate(date)}
                            format="YYYY-MM"
                            style={{ width: 140 }}
                        />
                        <Button
                            type="link"
                            icon={<ReloadOutlined />}
                            onClick={() => router.push('/ai-analysis/budget-optimization')}
                        >
                            获取AI调优建议
                        </Button>
                    </div>
                </Card>

                <Card title="预算列表">
                    <div className="mb-4 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">年份：</span>
                            <DatePicker
                                picker="year"
                                value={filters.year ? dayjs().year(filters.year) : null}
                                onChange={(date) =>
                                    setFilters((f) => ({ ...f, year: date ? date.year() : undefined }))
                                }
                                format="YYYY年"
                                style={{ width: 120 }}
                                placeholder="全部"
                                allowClear
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">月份：</span>
                            <Select
                                value={filters.month}
                                onChange={(month) => setFilters((f) => ({ ...f, month }))}
                                placeholder="全部"
                                allowClear
                                style={{ width: 100 }}
                                options={[
                                    { value: 1, label: '1月' },
                                    { value: 2, label: '2月' },
                                    { value: 3, label: '3月' },
                                    { value: 4, label: '4月' },
                                    { value: 5, label: '5月' },
                                    { value: 6, label: '6月' },
                                    { value: 7, label: '7月' },
                                    { value: 8, label: '8月' },
                                    { value: 9, label: '9月' },
                                    { value: 10, label: '10月' },
                                    { value: 11, label: '11月' },
                                    { value: 12, label: '12月' },
                                ]}
                            />
                        </div>
                        <Button type="primary" onClick={handleQuery} loading={listLoading}>
                            查询
                        </Button>
                        <Button onClick={handleReset} disabled={listLoading}>
                            重置
                        </Button>
                    </div>

                    <Table
                        columns={budgetColumns}
                        dataSource={list}
                        rowKey="id"
                        loading={listLoading}
                        pagination={{
                            current: pagination.page,
                            pageSize: pagination.page_size,
                            total: pagination.total,
                            showSizeChanger: true,
                            showTotal: (total) => `共 ${total} 条`,
                            onChange: handleTableChange,
                        }}
                        locale={{ emptyText: '暂无预算记录' }}
                    />
                </Card>

                <Modal
                    title="设置预算"
                    open={isModalOpen}
                    onCancel={handleCloseModal}
                    footer={null}
                    width={800}
                >
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        <Form.Item
                            label="年月"
                            name="year_month"
                            rules={[{ required: true, message: '请选择年月' }]}
                        >
                            <DatePicker
                                picker="month"
                                format="YYYY-MM"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                        <Form.Item
                            label="总预算"
                            name="total_budget"
                            rules={[{ required: true, message: '请输入总预算' }]}
                        >
                            <InputNumber
                                min={0}
                                precision={2}
                                style={{ width: '100%' }}
                                formatter={(value) =>
                                    `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                }
                                parser={
                                    ((value: string | undefined) => {
                                        const num = parseFloat(String(value ?? '').replace(/¥\s?|(,*)/g, ''));
                                        return Number.isNaN(num) ? 0 : num;
                                    }) as (displayValue: string | undefined) => number
                                }
                                placeholder="请输入总预算金额"
                            />
                        </Form.Item>
                        <Form.Item label="分类预算">
                            <Form.List name="category_budgets">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <div key={key} className="mb-2 flex gap-2">
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'category_id']}
                                                    rules={[{ required: true, message: '请选择分类' }]}
                                                    className="flex-1"
                                                >
                                                    <Select placeholder="选择分类">
                                                        {categories.map((cat) => (
                                                            <Select.Option key={cat.id} value={cat.id}>
                                                                {cat.name}
                                                            </Select.Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'amount']}
                                                    rules={[{ required: true, message: '请输入预算金额' }]}
                                                    className="flex-1"
                                                >
                                                    <InputNumber
                                                        min={0}
                                                        precision={2}
                                                        style={{ width: '100%' }}
                                                        formatter={(value) =>
                                                            `¥ ${value}`.replace(
                                                                /\B(?=(\d{3})+(?!\d))/g,
                                                                ',',
                                                            )
                                                        }
                                                        parser={
                                                            ((value: string | undefined) => {
                                                                const num = parseFloat(
                                                                    String(value ?? '').replace(
                                                                        /¥\s?|(,*)/g,
                                                                        '',
                                                                    ),
                                                                );
                                                                return Number.isNaN(num) ? 0 : num;
                                                            }) as (displayValue: string | undefined) => number
                                                        }
                                                        placeholder="预算金额"
                                                    />
                                                </Form.Item>
                                                <Button onClick={() => remove(name)}>删除</Button>
                                            </div>
                                        ))}
                                        <Button
                                            type="dashed"
                                            onClick={() => add()}
                                            block
                                            icon={<PlusOutlined />}
                                        >
                                            添加分类预算
                                        </Button>
                                    </>
                                )}
                            </Form.List>
                        </Form.Item>
                        <Form.Item>
                            <div className="flex justify-end gap-2">
                                <Button onClick={handleCloseModal}>取消</Button>
                                <Button type="primary" htmlType="submit">
                                    保存
                                </Button>
                            </div>
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal
                    title="预算详情"
                    open={detailVisible}
                    onCancel={() => {
                        setDetailVisible(false);
                        setDetail(null);
                    }}
                    footer={[
                        <Button
                            key="close"
                            onClick={() => {
                                setDetailVisible(false);
                                setDetail(null);
                            }}
                        >
                            关闭
                        </Button>,
                    ]}
                    width={560}
                >
                    {detailLoading ? (
                        <div className="flex justify-center py-8">
                            <Spin size="large" />
                        </div>
                    ) : detail ? (
                        <div className="space-y-4">
                            <div>
                                <span className="text-sm text-gray-600">年月：</span>
                                <span className="ml-2 font-medium">
                                    {formatYearMonth(detail.year_month)}
                                </span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600">总预算：</span>
                                <span className="ml-2 font-medium">
                                    ¥{(detail.total_budget ?? 0).toFixed(2)}
                                </span>
                            </div>
                            {detail.created_at && (
                                <div>
                                    <span className="text-sm text-gray-600">创建时间：</span>
                                    <span className="ml-2">
                                        {new Date(detail.created_at).toLocaleString('zh-CN')}
                                    </span>
                                </div>
                            )}
                            {detail.categories && detail.categories.length > 0 && (
                                <div>
                                    <span className="text-sm text-gray-600 mb-2 block">分类预算：</span>
                                    <ul className="list-inside list-disc space-y-1">
                                        {detail.categories.map((c) => (
                                            <li key={c.category_id}>
                                                {c.category_name ?? `分类${c.category_id}`}：¥
                                                {(c.amount ?? 0).toFixed(2)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-4 text-center text-gray-400">暂无详情</div>
                    )}
                </Modal>
            </div>
        </div>
    );
}
