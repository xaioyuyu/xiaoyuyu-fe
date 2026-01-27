'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Checkbox, Form, Input, Tabs, message } from 'antd';
import type { TabsProps } from 'antd';
import { useAuth } from '@/features/auth/hooks';

type RegisterFormValues = {
  username: string;
  email: string;
  password: string;
};

type LoginFormValues = {
  username: string;
  password: string;
  remember?: boolean;
};

const AuthPage = () => {
  const [activeKey, setActiveKey] = useState<'login' | 'register'>('login');
  const router = useRouter();
  const { login, register, loading, error, clearError, user, isAuthenticated } = useAuth();

  const handleLoginFinish = async (values: LoginFormValues) => {
    try {
      clearError();
      await login(values);
      message.success('登录成功');
      router.push('/');
    } catch {
      // 错误信息已在状态中存储并可通过 error 展示
    }
  };

  const handleRegisterFinish = async (values: RegisterFormValues) => {
    try {
      clearError();
      await register(values);
      message.success('注册并登录成功');
      router.push('/');
    } catch {
      // 错误信息已在状态中存储并可通过 error 展示
    }
  };

  const items: TabsProps['items'] = [
    {
      key: 'login',
      label: '登录',
      children: (
        <Form<LoginFormValues>
          layout="vertical"
          onFinish={handleLoginFinish}
          requiredMark={false}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item name="remember" valuePropName="checked">
            <Checkbox>记住我</Checkbox>
          </Form.Item>
          {error && (
            <div className="mb-3 text-xs text-red-500">
              {error}
            </div>
          )}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <Form<RegisterFormValues>
          layout="vertical"
          onFinish={handleRegisterFinish}
          requiredMark={false}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="例如：张三" />
          </Form.Item>
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="your@email.com" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          {error && (
            <div className="mb-3 text-xs text-red-500">
              {error}
            </div>
          )}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full"
            >
              注册并登录
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div className="flex h-full items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-md">
        <h1 className="mb-2 text-center text-xl font-semibold text-slate-900">
          智能化个人记账与消费分析系统
        </h1>
        <p className="mb-4 text-center text-xs text-slate-500">
          登录或注册后，开始管理你的收支与消费分析
        </p>
        {isAuthenticated && user && (
          <div className="mb-4 text-center text-sm text-emerald-600">
            当前登录用户：<span className="font-semibold">{user.username}</span>
          </div>
        )}
        <Tabs
          activeKey={activeKey}
          onChange={(key) => {
            clearError();
            setActiveKey(key as 'login' | 'register');
          }}
          items={items}
          centered
        />
      </div>
    </div>
  );
};

export default AuthPage;


