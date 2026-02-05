'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Input, Button, message, Tag, Space } from 'antd';
import { SearchOutlined, HomeOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

// TODO: 需要实现 admin 用户管理接口
// GET /api/admin/users - 获取用户列表
// GET /api/admin/users/{id} - 获取用户详情
// POST /api/admin/users/update - 更新用户（禁用/启用等）

type User = {
    id: number;
    username: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
};

export default function AdminUsersPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [searchKeyword, setSearchKeyword] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            // TODO: 调用 GET /api/admin/users
            // const res = await adminApi.getUsers({ keyword: searchKeyword });
            // setUsers(res.list);
            
            // 临时占位数据
            setUsers([]);
            message.warning('用户管理接口尚未实现，请等待后端开发');
        } catch (error) {
            console.error('加载数据失败', error);
            message.error('加载数据失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [searchKeyword]);

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: '用户名',
            dataIndex: 'username',
            key: 'username',
        },
        {
            title: '邮箱',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: '角色',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => (
                <Tag color={role === 'admin' ? 'red' : 'blue'}>{role}</Tag>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag color={status === 'active' ? 'green' : 'red'}>{status}</Tag>
            ),
        },
        {
            title: '创建时间',
            dataIndex: 'created_at',
            key: 'created_at',
        },
        {
            title: '操作',
            key: 'action',
            width: 200,
            render: (_: any, record: User) => (
                <Space>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => {
                            // TODO: 查看用户详情
                            message.info('用户详情功能待实现');
                        }}
                    >
                        详情
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        danger
                        onClick={() => {
                            // TODO: 禁用/启用用户
                            message.info('用户管理功能待实现');
                        }}
                    >
                        {record.status === 'active' ? '禁用' : '启用'}
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="flex flex-1 flex-col bg-slate-50 p-6">
            <div className="mx-auto w-full max-w-7xl">
                <Card
                    title="用户管理"
                    extra={
                        <div className="flex items-center gap-2">
                            <Button
                                type="default"
                                icon={<HomeOutlined />}
                                onClick={() => router.push('/admin')}
                            >
                                返回首页
                            </Button>
                            <Input
                                placeholder="搜索用户名或邮箱"
                                prefix={<SearchOutlined />}
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                style={{ width: 300 }}
                                allowClear
                            />
                        </div>
                    }
                >
                    <Table
                        columns={columns}
                        dataSource={users}
                        rowKey="id"
                        loading={loading}
                        pagination={{ pageSize: 20 }}
                    />
                </Card>
            </div>
        </div>
    );
}

