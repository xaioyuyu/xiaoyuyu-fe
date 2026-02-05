'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Table, Button, Modal, Form, Input, InputNumber, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, HomeOutlined } from '@ant-design/icons';
import { recordsApi } from '@/features/records/api';
import type { RecordType } from '@/features/records/types';

export default function AdminRecordTypesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [recordTypes, setRecordTypes] = useState<RecordType[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRecordType, setEditingRecordType] = useState<RecordType | null>(null);
    const [form] = Form.useForm();

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await recordsApi.getRecordTypes();
            setRecordTypes(res.list);
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

    const handleOpenModal = (recordType?: RecordType) => {
        setEditingRecordType(recordType || null);
        setIsModalOpen(true);
        if (recordType) {
            form.setFieldsValue({
                id: recordType.id,
                code: recordType.code,
                name: recordType.name,
                description: recordType.description,
                sort_order: recordType.sort_order,
            });
        } else {
            form.resetFields();
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRecordType(null);
        form.resetFields();
    };

    const handleSubmit = async (values: any) => {
        try {
            if (editingRecordType) {
                await recordsApi.updateRecordType({
                    id: editingRecordType.id,
                    name: values.name,
                    description: values.description,
                    sort_order: values.sort_order,
                });
                message.success('修改记账类型成功');
            } else {
                await recordsApi.createRecordType({
                    code: values.code,
                    name: values.name,
                    description: values.description,
                    sort_order: values.sort_order,
                });
                message.success('创建记账类型成功');
            }
            handleCloseModal();
            loadData();
        } catch (error) {
            console.error('保存记账类型失败', error);
            message.error('保存记账类型失败，请稍后重试');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await recordsApi.deleteRecordType({ id });
            message.success('删除记账类型成功');
            loadData();
        } catch (error) {
            console.error('删除记账类型失败', error);
            message.error('删除记账类型失败，请稍后重试');
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
            title: '代码',
            dataIndex: 'code',
            key: 'code',
        },
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            render: (desc: string) => desc || '-',
        },
        {
            title: '排序',
            dataIndex: 'sort_order',
            key: 'sort_order',
            width: 100,
        },
        {
            title: '操作',
            key: 'action',
            width: 150,
            render: (_: any, record: RecordType) => (
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
                        title="确定要删除这个记账类型吗？"
                        description="删除后已使用的类型仍可正常显示历史数据。"
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
                    title="系统记账类型管理"
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
                                onClick={() => handleOpenModal()}
                            >
                                新建类型
                            </Button>
                        </div>
                    }
                >
                    <Table
                        columns={columns}
                        dataSource={recordTypes}
                        rowKey="id"
                        loading={loading}
                        pagination={false}
                    />
                </Card>

                {/* 新建/编辑弹窗 */}
                <Modal
                    title={editingRecordType ? '编辑记账类型' : '新建记账类型'}
                    open={isModalOpen}
                    onCancel={handleCloseModal}
                    footer={null}
                    width={600}
                >
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        {editingRecordType && (
                            <Form.Item name="id" hidden>
                                <Input />
                            </Form.Item>
                        )}

                        <Form.Item
                            label="代码"
                            name="code"
                            rules={[
                                { required: !editingRecordType, message: '请输入代码' },
                                { pattern: /^[a-z_]+$/, message: '代码只能包含小写字母和下划线' },
                            ]}
                        >
                            <Input
                                placeholder="例如：borrow_in, borrow_out"
                                disabled={!!editingRecordType}
                            />
                        </Form.Item>

                        <Form.Item
                            label="名称"
                            name="name"
                            rules={[{ required: true, message: '请输入名称' }]}
                        >
                            <Input placeholder="例如：借入、借出" />
                        </Form.Item>

                        <Form.Item label="描述" name="description">
                            <Input.TextArea
                                rows={3}
                                placeholder="类型描述（可选）"
                            />
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
                                    {editingRecordType ? '保存' : '创建'}
                                </Button>
                            </div>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </div>
    );
}

