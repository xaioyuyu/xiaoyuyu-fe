'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, message, Tag } from 'antd';
import { ArrowLeftOutlined, SendOutlined, RobotOutlined, UserOutlined, StopOutlined } from '@ant-design/icons';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';

type Role = 'user' | 'assistant';

interface ChatMessage {
    id: string;
    role: Role;
    content: string;
    finished: boolean;
}

export default function AgentChatDemoPage() {
    const router = useRouter();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorText, setErrorText] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed) {
            message.warning('请输入要发送的内容');
            return;
        }
        if (loading) {
            message.warning('当前正在生成回答，请稍候');
            return;
        }

        setErrorText(null);

        const userMessage: ChatMessage = {
            id: `${Date.now()}-user`,
            role: 'user',
            content: trimmed,
            finished: true,
        };

        const assistantId = `${Date.now()}-assistant`;
        const assistantMessage: ChatMessage = {
            id: assistantId,
            role: 'assistant',
            content: '',
            finished: false,
        };

        setMessages((prev) => [...prev, userMessage, assistantMessage]);
        setInput('');

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            setLoading(true);

            const response = await fetch('http://localhost:3030/api/agent/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: trimmed }),
                signal: controller.signal,
            });

            if (!response.ok || !response.body) {
                throw new Error('网络请求失败');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            const updateAssistant = (updater: (prev: ChatMessage) => ChatMessage) => {
                setMessages((prev) =>
                    prev.map((m) => {
                        if (m.id === assistantId) {
                            return updater(m);
                        }
                        return m;
                    }),
                );
            };

            const processEvent = (eventName: string, dataLine: string) => {
                if (!dataLine) return;
                try {
                    const payload = JSON.parse(dataLine);
                    if (eventName === 'message') {
                        const delta: string = payload.delta ?? '';
                        updateAssistant((m) => ({
                            ...m,
                            content: m.content + delta,
                            finished: false,
                        }));
                    } else if (eventName === 'end') {
                        const finished: boolean = payload.finished ?? true;
                        const fullText: string | undefined = payload.fullText;
                        updateAssistant((m) => ({
                            ...m,
                            content: fullText ?? m.content,
                            finished,
                        }));
                    } else if (eventName === 'error') {
                        const err: string = payload.error ?? 'Agent chat failed';
                        setErrorText(err);
                        message.error(err);
                        updateAssistant((m) => ({
                            ...m,
                            finished: true,
                        }));
                    }
                } catch (err) {
                    console.error('解析 SSE 数据失败', err);
                }
            };

            const processBuffer = () => {
                let separatorIndex: number;
                while ((separatorIndex = buffer.indexOf('\n\n')) !== -1) {
                    const rawEvent = buffer.slice(0, separatorIndex);
                    buffer = buffer.slice(separatorIndex + 2);

                    const lines = rawEvent
                        .split('\n')
                        .map((line) => line.trim())
                        .filter(Boolean);

                    let eventName = 'message';
                    let dataLine = '';

                    for (const line of lines) {
                        if (line.startsWith('event:')) {
                            eventName = line.slice('event:'.length).trim();
                        } else if (line.startsWith('data:')) {
                            const part = line.slice('data:'.length).trim();
                            dataLine = dataLine ? `${dataLine}${part}` : part;
                        }
                    }

                    processEvent(eventName, dataLine);
                }
            };

            // 读取 SSE 流
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                processBuffer();
            }

            // 处理缓冲区中剩余的事件
            if (buffer) {
                buffer += '\n\n';
                processBuffer();
            }
        } catch (err: unknown) {
            if ((err as Error)?.name === 'AbortError') {
                setErrorText('已手动中断本次回答');
                updateAssistant((m) => ({
                    ...m,
                    finished: true,
                }));
            } else {
                console.error('调用 Agent 接口失败', err);
                const msg = (err as Error)?.message || '调用 Agent 接口失败';
                setErrorText(msg);
                message.error(msg);
                updateAssistant((m) => ({
                    ...m,
                    finished: true,
                }));
            }
        } finally {
            setLoading(false);
            abortControllerRef.current = null;
        }
    };

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-1 flex-col bg-slate-50 p-6">
            <div className="mx-auto w-full max-w-5xl space-y-4">
                {/* 返回按钮 */}
                <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.push('/ai-analysis')}
                    className="mb-2"
                >
                    返回AI分析中心
                </Button>

                <Card>
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Agent 对话 Demo</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                基于后端 /api/agent/chat SSE 接口的流式对话示例
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {loading && (
                                <Tag color="processing">
                                    正在思考中...
                                </Tag>
                            )}
                            {errorText && (
                                <Tag color="error">
                                    {errorText}
                                </Tag>
                            )}
                        </div>
                    </div>

                    {/* 对话区域 */}
                    <div className="mb-4 h-196 space-y-3 overflow-y-auto rounded-md bg-slate-100 p-4">
                        {messages.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-sm text-gray-400">
                                请输入内容开始和 Agent 对话
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                                            msg.role === 'user'
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-white text-gray-900'
                                        }`}
                                    >
                                        <div className="mb-1 flex items-center gap-1 text-xs opacity-70">
                                            {msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                                            <span>{msg.role === 'user' ? '你' : 'Agent'}</span>
                                        </div>
                                        {msg.role === 'assistant' ? (
                                            msg.content ? (
                                                <MarkdownRenderer content={msg.content} />
                                            ) : (
                                                <span className="text-gray-400">正在生成...</span>
                                            )
                                        ) : (
                                            <div>{msg.content}</div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* 输入区域 */}
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="请输入要问 Agent 的问题，按 Enter 发送"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                        />
                        <Button
                            type="primary"
                            icon={<SendOutlined />}
                            onClick={handleSend}
                            loading={loading}
                        >
                            发送
                        </Button>
                        <Button
                            danger
                            icon={<StopOutlined />}
                            onClick={handleStop}
                            disabled={!loading}
                        >
                            停止
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}

