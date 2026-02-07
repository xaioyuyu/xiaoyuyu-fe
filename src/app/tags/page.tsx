'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Table, Button, Modal, Form, Input, message, Popconfirm, Tag, ColorPicker } from 'antd';
import { PlusOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { recordsApi } from '@/features/records/api';
import type { Tag as TagType } from '@/features/records/types';

export default function TagsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [tags, setTags] = useState<TagType[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();

    // 加载数据
    const loadData = async () => {
        try {
            setLoading(true);
            const res = await recordsApi.getTags();
            setTags(res.list);
        } catch (error) {
            console.error('加载数据失败', error);
            message.error('加载数据失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // 打开新建弹窗
    const handleOpenModal = () => {
        setIsModalOpen(true);
        form.resetFields();
    };

    // 关闭弹窗
    const handleCloseModal = () => {
        setIsModalOpen(false);
        form.resetFields();
    };

    // 提交表单
    const handleSubmit = async (values: any) => {
        try {
            await recordsApi.createTag({
                name: values.name,
                color: values.color || undefined,
            });
            message.success('创建标签成功');
            handleCloseModal();
            loadData();
        } catch (error) {
            console.error('创建标签失败', error);
            message.error('创建标签失败，请稍后重试');
        }
    };

    // 删除标签
    const handleDelete = async (id: number) => {
        try {
            await recordsApi.deleteTag({ id });
            message.success('删除标签成功');
            loadData();
        } catch (error) {
            console.error('删除标签失败', error);
            message.error('删除标签失败，请稍后重试');
        }
    };

    // 表格列定义
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
            render: (name: string, record: TagType) => (
                <Tag color={record.color || '#1890FF'}>{name}</Tag>
            ),
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
            title: '系统预置',
            dataIndex: 'is_system',
            key: 'is_system',
            width: 100,
            render: (isSystem: number) =>
                isSystem === 1 ? (
                    <Tag color="blue">系统</Tag>
                ) : (
                    <Tag color="green">用户</Tag>
                ),
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            render: (_: any, record: TagType) => (
                <div>
                    {record.is_system !== 1 && (
                        <Popconfirm
                            title="确定要删除这个标签吗？"
                            description="删除标签不会删除已有账目，只是不再作为可选项出现。"
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
                    )}
                    {record.is_system === 1 && (
                        <span className="text-gray-400 text-sm">只读</span>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="flex flex-1 flex-col bg-slate-50 p-6">
            <div className="mx-auto w-full max-w-7xl">
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.push('/records')}
                    className="mb-4"
                >
                    返回记账中心
                </Button>
                <Card
                    title="标签管理"
                    extra={
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleOpenModal}
                        >
                            新建标签
                        </Button>
                    }
                >
                    <Table
                        columns={columns}
                        dataSource={tags}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 20 }}
                    />
                </Card>

                {/* 新建弹窗 */}
                <Modal
                    title="新建标签"
                    open={isModalOpen}
                    onCancel={handleCloseModal}
                    footer={null}
                    width={500}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                    >
                        <Form.Item
                            label="标签名称"
                            name="name"
                            rules={[{ required: true, message: '请输入标签名称' }]}
                        >
                            <Input placeholder="例如：工作" />
                        </Form.Item>

                        <Form.Item
                            label="颜色"
                            name="color"
                            getValueFromEvent={(color) => color?.toHexString()}
                        >
                            <ColorPicker
                                showText
                                format="hex"
                            />
                        </Form.Item>

                        <Form.Item>
                            <div className="flex justify-end gap-2">
                                <Button onClick={handleCloseModal}>取消</Button>
                                <Button type="primary" htmlType="submit">
                                    创建
                                </Button>
                            </div>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </div>
    );
}

