'use client';

import { useRouter } from 'next/navigation';
import { Card, Row, Col, Statistic } from 'antd';
import { DollarOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons';

export default function AdminDashboardPage() {
    const router = useRouter();
    return (
        <div className="flex flex-1 flex-col bg-slate-50 p-6">
            <div className="mx-auto w-full max-w-7xl space-y-6">
                <Card title="后台管理总览">
                    <Row gutter={16}>
                        <Col span={8}>
                            <Card>
                                <Statistic
                                    title="用户总数"
                                    value={0}
                                    prefix={<UserOutlined />}
                                />
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card>
                                <Statistic
                                    title="账目总数"
                                    value={0}
                                    prefix={<FileTextOutlined />}
                                />
                            </Card>
                        </Col>
                        <Col span={8}>
                            <Card>
                                <Statistic
                                    title="系统状态"
                                    value="正常"
                                    prefix={<DollarOutlined />}
                                />
                            </Card>
                        </Col>
                    </Row>
                </Card>

                <Card title="快捷入口">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <Card
                            hoverable
                            onClick={() => router.push('/admin/record-types')}
                            className="cursor-pointer"
                        >
                            <div className="text-center">
                                <p className="text-lg font-semibold">记账类型管理</p>
                                <p className="mt-2 text-sm text-gray-500">管理系统记账类型</p>
                            </div>
                        </Card>
                        <Card
                            hoverable
                            onClick={() => router.push('/admin/categories')}
                            className="cursor-pointer"
                        >
                            <div className="text-center">
                                <p className="text-lg font-semibold">系统分类管理</p>
                                <p className="mt-2 text-sm text-gray-500">管理系统预置分类</p>
                            </div>
                        </Card>
                        <Card
                            hoverable
                            onClick={() => router.push('/admin/tags')}
                            className="cursor-pointer"
                        >
                            <div className="text-center">
                                <p className="text-lg font-semibold">系统标签管理</p>
                                <p className="mt-2 text-sm text-gray-500">管理系统预置标签</p>
                            </div>
                        </Card>
                        <Card
                            hoverable
                            onClick={() => router.push('/admin/users')}
                            className="cursor-pointer"
                        >
                            <div className="text-center">
                                <p className="text-lg font-semibold">用户管理</p>
                                <p className="mt-2 text-sm text-gray-500">查看和管理用户</p>
                            </div>
                        </Card>
                        <Card
                            hoverable
                            onClick={() => router.push('/admin/records')}
                            className="cursor-pointer"
                        >
                            <div className="text-center">
                                <p className="text-lg font-semibold">账目审计</p>
                                <p className="mt-2 text-sm text-gray-500">全局账目查询与审计</p>
                            </div>
                        </Card>
                    </div>
                </Card>
            </div>
        </div>
    );
}

