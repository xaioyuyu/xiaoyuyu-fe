'use client';

import { useEffect, useState } from 'react';
import {
    Card,
    Table,
    Button,
    Modal,
    Form,
    Input,
    message,
    Popconfirm,
    Select,
    Space,
    Tag,
    Switch,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, DeleteOutlined, HomeOutlined, EditOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import {
    createSystemConfig,
    deleteSystemConfig,
    getSystemConfigDetail,
    listSystemConfigs,
    updateSystemConfig,
} from '@/features/admin-system-config/api';
import type { SystemConfigItem } from '@/features/admin-system-config/types';

const { TextArea } = Input;

function formatConfigValue(value: SystemConfigItem['config_value']): string {
    if (value === null || value === undefined) {
        return '';
    }
    if (typeof value === 'string') {
        return value;
    }
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
}

function parseConfigValueInput(text: string): string | Record<string, unknown> | unknown[] {
    const trimmed = text.trim();
    if (!trimmed) {
        return '';
    }
    if (
        (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
        try {
            return JSON.parse(trimmed) as Record<string, unknown> | unknown[];
        } catch {
            return text;
        }
    }
    return text;
}

export default function AdminSystemConfigPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [list, setList] = useState<SystemConfigItem[]>([]);
    const [filterKey, setFilterKey] = useState('');
    const [filterActive, setFilterActive] = useState<number | undefined>(undefined);

    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [createForm] = Form.useForm();
    const [editForm] = Form.useForm();

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await listSystemConfigs({
                config_key: filterKey.trim() || undefined,
                is_active:
                    filterActive === 0 || filterActive === 1 ? (filterActive as 0 | 1) : undefined,
            });
            setList(data);
        } catch (error) {
            console.error(error);
            message.error('加载系统配置失败，请确认已使用管理员账号登录');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // 仅首屏加载全量；筛选通过「查询」触发
        // eslint-disable-next-line react-hooks/exhaustive-deps --  intentional
    }, []);

    const openCreate = () => {
        createForm.resetFields();
        createForm.setFieldsValue({ is_active: true });
        setCreateOpen(true);
    };

    const submitCreate = async () => {
        try {
            const values = await createForm.validateFields();
            await createSystemConfig({
                config_key: values.config_key.trim(),
                config_value: parseConfigValueInput(values.config_value ?? ''),
                description: values.description?.trim() || undefined,
                is_active: values.is_active ? 1 : 0,
            });
            message.success('创建成功');
            setCreateOpen(false);
            loadData();
        } catch (e) {
            if (e && typeof e === 'object' && 'errorFields' in e) return;
            console.error(e);
            message.error('创建失败');
        }
    };

    const openEdit = async (record: SystemConfigItem) => {
        setEditingId(record.id);
        setEditOpen(true);
        editForm.resetFields();
        try {
            const detail = await getSystemConfigDetail(record.id);
            editForm.setFieldsValue({
                config_key: detail.config_key,
                config_value: formatConfigValue(detail.config_value),
                description: detail.description ?? '',
                is_active: detail.is_active === 1,
            });
        } catch (error) {
            console.error(error);
            message.error('加载详情失败');
            setEditOpen(false);
            setEditingId(null);
        }
    };

    const submitEdit = async () => {
        if (editingId == null) return;
        try {
            const values = await editForm.validateFields();
            await updateSystemConfig({
                id: editingId,
                config_value: parseConfigValueInput(values.config_value ?? ''),
                description: values.description?.trim() || undefined,
                is_active: values.is_active ? 1 : 0,
            });
            message.success('更新成功');
            setEditOpen(false);
            setEditingId(null);
            loadData();
        } catch (e) {
            if (e && typeof e === 'object' && 'errorFields' in e) return;
            console.error(e);
            message.error('更新失败');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteSystemConfig(id);
            message.success('已删除');
            loadData();
        } catch (error) {
            console.error(error);
            message.error('删除失败');
        }
    };

    const columns: ColumnsType<SystemConfigItem> = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 72 },
        { title: '配置键', dataIndex: 'config_key', key: 'config_key', width: 200, ellipsis: true },
        {
            title: '配置值',
            dataIndex: 'config_value',
            key: 'config_value',
            ellipsis: true,
            render: (v: SystemConfigItem['config_value']) => {
                const s = formatConfigValue(v);
                return s.length > 80 ? `${s.slice(0, 80)}…` : s || '—';
            },
        },
        {
            title: '说明',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (d: string | null | undefined) => d || '—',
        },
        {
            title: '状态',
            dataIndex: 'is_active',
            key: 'is_active',
            width: 88,
            render: (active: number) =>
                active === 1 ? <Tag color="green">启用</Tag> : <Tag color="default">停用</Tag>,
        },
        {
            title: '操作',
            key: 'action',
            width: 168,
            render: (_: unknown, record) => (
                <Space size="small">
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
                        编辑
                    </Button>
                    <Popconfirm
                        title="确定删除该配置？"
                        description="删除后依赖该配置的客户端行为可能异常。"
                        onConfirm={() => handleDelete(record.id)}
                        okText="删除"
                        cancelText="取消"
                    >
                        <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                            删除
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="flex flex-1 flex-col bg-slate-50 p-6">
            <div className="mx-auto w-full max-w-7xl space-y-4">
                <Card
                    title="系统配置"
                    extra={
                        <Space wrap>
                            <Button type="default" icon={<HomeOutlined />} onClick={() => router.push('/admin')}>
                                返回首页
                            </Button>
                            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                                新增配置
                            </Button>
                        </Space>
                    }
                >
                    <Space wrap className="mb-4">
                        <Input
                            allowClear
                            placeholder="配置键模糊搜索"
                            value={filterKey}
                            onChange={(e) => setFilterKey(e.target.value)}
                            onPressEnter={() => loadData()}
                            style={{ width: 220 }}
                        />
                        <Select
                            allowClear
                            placeholder="启用状态"
                            style={{ width: 140 }}
                            value={filterActive}
                            onChange={(v) => setFilterActive(v)}
                            options={[
                                { label: '启用', value: 1 },
                                { label: '停用', value: 0 },
                            ]}
                        />
                        <Button type="primary" onClick={() => loadData()}>
                            查询
                        </Button>
                    </Space>
                    <Table<SystemConfigItem>
                        rowKey="id"
                        loading={loading}
                        columns={columns}
                        dataSource={list}
                        pagination={{ pageSize: 20 }}
                        scroll={{ x: 900 }}
                    />
                </Card>

                <Modal
                    title="新增系统配置"
                    open={createOpen}
                    onCancel={() => setCreateOpen(false)}
                    onOk={submitCreate}
                    okText="创建"
                    width={560}
                    destroyOnClose
                >
                    <Form form={createForm} layout="vertical" className="mt-2">
                        <Form.Item
                            label="配置键"
                            name="config_key"
                            rules={[{ required: true, message: '请输入配置键' }]}
                        >
                            <Input placeholder="例如：feature.xxx.enabled" />
                        </Form.Item>
                        <Form.Item
                            label="配置值"
                            name="config_value"
                            rules={[{ required: true, message: '请输入配置值' }]}
                            extra="支持普通字符串；若以 { } 或 [ ] 包裹且为合法 JSON，将按 JSON 提交。"
                        >
                            <TextArea rows={6} placeholder='字符串或 JSON，例如：true 或 {"a":1}' />
                        </Form.Item>
                        <Form.Item label="说明" name="description">
                            <Input placeholder="可选" />
                        </Form.Item>
                        <Form.Item label="启用" name="is_active" valuePropName="checked" initialValue>
                            <Switch />
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal
                    title="编辑系统配置"
                    open={editOpen}
                    onCancel={() => {
                        setEditOpen(false);
                        setEditingId(null);
                    }}
                    onOk={submitEdit}
                    okText="保存"
                    width={560}
                    destroyOnClose
                >
                    <Form form={editForm} layout="vertical" className="mt-2">
                        <Form.Item label="配置键" name="config_key">
                            <Input disabled />
                        </Form.Item>
                        <Form.Item
                            label="配置值"
                            name="config_value"
                            rules={[{ required: true, message: '请输入配置值' }]}
                            extra="支持普通字符串或 JSON。"
                        >
                            <TextArea rows={8} />
                        </Form.Item>
                        <Form.Item label="说明" name="description">
                            <Input placeholder="可选" />
                        </Form.Item>
                        <Form.Item label="启用" name="is_active" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </div>
    );
}
