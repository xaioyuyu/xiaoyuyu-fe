'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, message, Popconfirm, Tag, ColorPicker } from 'antd';
import { PlusOutlined, DeleteOutlined, HomeOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { recordsApi } from '@/features/records/api';
import type { Tag as TagType } from '@/features/records/types';

export default function AdminTagsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [tags, setTags] = useState<TagType[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();

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

    const handleOpenModal = () => {
        setIsModalOpen(true);
        form.resetFields();
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        form.resetFields();
    };

    const handleSubmit = async (values: any) => {
        try {
            // TODO: 调用 admin 专用接口创建系统标签
            await recordsApi.createTag({
                name: values.name,
                color: values.color || undefined,
                is_system: 1,
            });
            message.success('创建系统标签成功');
            handleCloseModal();
            loadData();
        } catch (error) {
            console.error('创建标签失败', error);
            message.error('创建标签失败，请稍后重试');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            // TODO: 调用 admin 专用删除接口
            await recordsApi.deleteTag({ id });
            message.success('删除系统标签成功');
            loadData();
        } catch (error) {
            console.error('删除标签失败', error);
            message.error('删除标签失败，请稍后重试');
        }
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
            title: '操作',
            key: 'action',
            width: 100,
            render: (_: any, record: TagType) => (
                <div>
                    <Popconfirm
                        title="确定要删除这个系统标签吗？"
                        description="删除后所有用户将无法使用此标签。"
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

    return (
        <div className="flex flex-1 flex-col bg-slate-50 p-6">
            <div className="mx-auto w-full max-w-7xl">
                <Card
                    title="系统预置标签管理"
                    extra={
                        <div className="flex items-center gap-2">
                            <Button
                                type="default"
                                icon={<HomeOutlined />}
                                onClick={() => router.push('/admin')}
                            >
                                返回首页
                            </Button>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleOpenModal}
                            >
                                新建系统标签
                            </Button>
                        </div>
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

                <Modal
                    title="新建系统标签"
                    open={isModalOpen}
                    onCancel={handleCloseModal}
                    footer={null}
                    width={500}
                >
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
                            <ColorPicker showText format="hex" />
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

