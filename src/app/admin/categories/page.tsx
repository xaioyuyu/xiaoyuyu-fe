'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, InputNumber, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, HomeOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { recordsApi } from '@/features/records/api';
import type { Category, RecordType } from '@/features/records/types';

const { Option } = Select;

export default function AdminCategoriesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [recordTypes, setRecordTypes] = useState<RecordType[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [form] = Form.useForm();
    const [typeFilter, setTypeFilter] = useState<number | undefined>(undefined);

    const loadData = async () => {
        try {
            setLoading(true);
            const [categoriesRes, typesRes] = await Promise.all([
                recordsApi.getCategories(typeFilter ? { type_id: typeFilter } : undefined),
                recordsApi.getRecordTypes(),
            ]);
            setCategories(categoriesRes.list);
            setRecordTypes(typesRes.list);
        } catch (error) {
            console.error('加载数据失败', error);
            message.error('加载数据失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [typeFilter]);

    const handleOpenModal = (category?: Category) => {
        setEditingCategory(category || null);
        setIsModalOpen(true);
        if (category) {
            form.setFieldsValue({
                id: category.id,
                name: category.name,
                type_id: category.type_id,
                parent_id: category.parent_id,
                icon: category.icon,
                color: category.color,
                sort_order: category.sort_order,
            });
        } else {
            form.resetFields();
            if (typeFilter) {
                form.setFieldsValue({ type_id: typeFilter });
            }
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        form.resetFields();
    };

    const handleSubmit = async (values: any) => {
        try {
            // TODO: 这里应该调用 admin 专用接口，当前先用普通接口
            // 未来需要实现：POST /api/admin/categories 或 PUT /api/admin/categories/update
            const payload = {
                ...values,
                is_system: 1,
            };
            if (editingCategory) {
                await recordsApi.updateCategory(payload);
                message.success('修改系统分类成功');
            } else {
                await recordsApi.createCategory(payload);
                message.success('创建系统分类成功');
            }
            handleCloseModal();
            loadData();
        } catch (error) {
            console.error('保存分类失败', error);
            message.error('保存分类失败，请稍后重试');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            // TODO: 调用 admin 专用删除接口
            await recordsApi.deleteCategory({ id });
            message.success('删除系统分类成功');
            loadData();
        } catch (error) {
            console.error('删除分类失败', error);
            message.error('删除分类失败，请稍后重试');
        }
    };

    const getTypeName = (typeId: number) => {
        return recordTypes.find((t) => t.id === typeId)?.name || `类型${typeId}`;
    };

    const getParentName = (parentId: number | null) => {
        if (!parentId) return '-';
        const parent = categories.find((c) => c.id === parentId);
        return parent?.name || `ID: ${parentId}`;
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '类型',
            dataIndex: 'type_id',
            key: 'type_id',
            render: (typeId: number) => getTypeName(typeId),
        },
        {
            title: '父分类',
            dataIndex: 'parent_id',
            key: 'parent_id',
            render: (parentId: number | null) => getParentName(parentId),
        },
        {
            title: '图标',
            dataIndex: 'icon',
            key: 'icon',
            render: (icon: string) => icon || '-',
        },
        {
            title: '颜色',
            dataIndex: 'color',
            key: 'color',
            render: (color: string) =>
                color ? (
                    <div className="flex items-center gap-2">
                        <div
                            className="h-4 w-4 rounded border border-gray-300"
                            style={{ backgroundColor: color }}
                        />
                        <span>{color}</span>
                    </div>
                ) : (
                    '-'
                ),
        },
        {
            title: '排序',
            dataIndex: 'sort_order',
            key: 'sort_order',
            width: 80,
        },
        {
            title: '操作',
            key: 'action',
            width: 150,
            render: (_: any, record: Category) => (
                <div className="flex gap-2">
                    <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenModal(record)}
                    >
                        编辑
                    </Button>
                    <Popconfirm
                        title="确定要删除这个系统分类吗？"
                        description="删除后所有用户将无法使用此分类。"
                        onConfirm={() => handleDelete(record.id)}
                        okText="确定"
                        cancelText="取消"
                    >
                        <Button
                            type="link"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                        >
                            删除
                        </Button>
                    </Popconfirm>
                </div>
            ),
        },
    ];

    const filteredCategories = typeFilter
        ? categories.filter((c) => c.type_id === typeFilter)
        : categories;

    return (
        <div className="flex flex-1 flex-col bg-slate-50 p-6">
            <div className="mx-auto w-full max-w-7xl">
                <Card
                    title="系统预置分类管理"
                    extra={
                        <div className="flex items-center gap-4">
                            <Button
                                type="default"
                                icon={<HomeOutlined />}
                                onClick={() => router.push('/admin')}
                            >
                                返回首页
                            </Button>
                            <Select
                                value={typeFilter}
                                onChange={setTypeFilter}
                                allowClear
                                placeholder="筛选类型"
                                style={{ width: 150 }}
                            >
                                {recordTypes.map((type) => (
                                    <Option key={type.id} value={type.id}>
                                        {type.name}
                                    </Option>
                                ))}
                            </Select>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => handleOpenModal()}
                            >
                                新建系统分类
                            </Button>
                        </div>
                    }
                >
                    <Table
                        columns={columns}
                        dataSource={filteredCategories}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 20 }}
                    />
                </Card>

                <Modal
                    title={editingCategory ? '编辑系统分类' : '新建系统分类'}
                    open={isModalOpen}
                    onCancel={handleCloseModal}
                    footer={null}
                    width={600}
                >
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        {editingCategory && (
                            <Form.Item name="id" hidden>
                                <Input />
                            </Form.Item>
                        )}

                        <Form.Item
                            label="分类名称"
                            name="name"
                            rules={[{ required: true, message: '请输入分类名称' }]}
                        >
                            <Input placeholder="例如：餐饮" />
                        </Form.Item>

                        <Form.Item
                            label="记账类型"
                            name="type_id"
                            rules={[{ required: true, message: '请选择记账类型' }]}
                        >
                            <Select placeholder="请选择类型">
                                {recordTypes.map((type) => (
                                    <Option key={type.id} value={type.id}>
                                        {type.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item label="父分类" name="parent_id">
                            <Select placeholder="请选择父分类（可选）" allowClear>
                                {categories
                                    .filter((c) => !editingCategory || c.id !== editingCategory.id)
                                    .map((c) => (
                                        <Option key={c.id} value={c.id}>
                                            {c.name}
                                        </Option>
                                    ))}
                            </Select>
                        </Form.Item>

                        <Form.Item label="图标" name="icon">
                            <Input placeholder="例如：🍔" />
                        </Form.Item>

                        <Form.Item label="颜色" name="color">
                            <Input placeholder="例如：#FF9900" />
                        </Form.Item>

                        <Form.Item label="排序值" name="sort_order">
                            <InputNumber
                                min={0}
                                placeholder="数字越小越靠前"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>

                        <Form.Item>
                            <div className="flex justify-end gap-2">
                                <Button onClick={handleCloseModal}>取消</Button>
                                <Button type="primary" htmlType="submit">
                                    {editingCategory ? '保存' : '创建'}
                                </Button>
                            </div>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </div>
    );
}

