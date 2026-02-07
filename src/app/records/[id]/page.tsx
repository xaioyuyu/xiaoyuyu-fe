'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Form, Input, InputNumber, Select, DatePicker, Button, Card, Tag, message, Spin, Modal } from 'antd';
import { EditOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from '@/lib/utils/dayjs';
import { formatCSTForBackend } from '@/lib/utils';
import { recordsApi } from '@/features/records/api';
import type { Category, RecordItem, RecordType, Tag as TagType } from '@/features/records/types';

type FormValues = {
  type_id?: number;
  amount?: number;
  category_id?: number;
  occurred_at?: Dayjs;
  remark?: string;
  tag_ids?: number[];
};

type Mode = 'view' | 'edit' | 'create' | 'copy';

const { Option } = Select;
const { TextArea } = Input;

export default function RecordPage() {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const searchParams = useSearchParams();
  const fromId = searchParams.get('from_id');
  const id = params.id ? Number(params.id) : undefined;
  // 检查是否是编辑模式：通过查询参数判断
  const isEditMode = searchParams.get('mode') === 'edit';

  // 判断模式
  const mode: Mode = useMemo(() => {
    if (fromId) return 'copy';
    if (id && isEditMode) return 'edit';
    if (id) return 'view';
    return 'create';
  }, [id, isEditMode, fromId]);

  const [form] = Form.useForm();
  const [recordTypes, setRecordTypes] = useState<RecordType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [record, setRecord] = useState<RecordItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeOptions = useMemo(() => recordTypes, [recordTypes]);

  // 监听类型变化，自动清空分类选择
  const handleTypeChange = () => {
    form.setFieldsValue({ category_id: undefined });
  };

  // 初始化数据
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        const [typesRes, categoriesRes, tagsRes] = await Promise.all([
          recordsApi.getRecordTypes(),
          recordsApi.getCategories(),
          recordsApi.getTags(),
        ]);
        setRecordTypes(typesRes.list);
        setCategories(categoriesRes.list);
        setTags(tagsRes.list);

        if (mode === 'create') {
          // 新建模式：设置默认值
          const now = dayjs();
          form.setFieldsValue({
            occurred_at: now,
            type_id: typesRes.list.length > 0 ? typesRes.list[0].id : undefined,
          });
          return;
        }

        if (mode === 'copy' && fromId) {
          // 复制模式：加载原记录数据
          const detail = await recordsApi.getRecordDetail({ id: Number(fromId) });
          const record = detail.record;
          // 将 UTC 时间转换为中国时区的 dayjs 对象
          const occurred = dayjs.utc(record.occurred_at).tz('Asia/Shanghai');
          // 确保金额是数字类型
          const amountValue = typeof record.amount === 'number' ? record.amount : Number(record.amount);

          // 先设置 type_id，确保分类选项已经准备好
          form.setFieldsValue({ type_id: record.type_id });

          // 使用 setTimeout 确保在下一个事件循环中设置其他值，让分类选项有时间更新
          setTimeout(() => {
            form.setFieldsValue({
              amount: amountValue,
              category_id: record.category_id,
              occurred_at: occurred,
              remark: record.remark || undefined,
              tag_ids: record.tag_ids || [],
            });
          }, 0);
          return;
        }

        if (mode === 'view' || mode === 'edit') {
          // 详情/编辑模式：加载记录数据
          if (!id) return;
          const detail = await recordsApi.getRecordDetail({ id });
          const r = detail.record;
          setRecord(r);

          // 详情和编辑模式都需要设置表单值，以便在表单中显示
          // 将 UTC 时间转换为中国时区的 dayjs 对象
          const occurred = dayjs.utc(r.occurred_at).tz('Asia/Shanghai');
          // 确保金额是数字类型，避免 InputNumber 组件验证失败
          const amountValue = typeof r.amount === 'number' ? r.amount : Number(r.amount);

          // 先设置 type_id，确保分类选项已经准备好
          form.setFieldsValue({ type_id: r.type_id });

          // 使用 setTimeout 确保在下一个事件循环中设置其他值，让分类选项有时间更新
          setTimeout(() => {
            form.setFieldsValue({
              amount: amountValue,
              category_id: r.category_id,
              occurred_at: occurred,
              remark: r.remark || undefined,
              tag_ids: r.tag_ids || [],
            });
          }, 0);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : '初始化数据失败，请稍后重试';
        setError(msg);
        message.error(msg);
      } finally {
        setLoading(false);
      }
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, mode, fromId]);

  const handleSubmit = async (stayOnPage: boolean) => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      setError(null);

      // 将 dayjs 对象格式化为东8区时间字符串（带时区信息）
      const occurredAt = values.occurred_at as Dayjs;
      const cstTimeString = formatCSTForBackend(occurredAt);

      if (mode === 'create' || mode === 'copy') {
        await recordsApi.createRecord({
          type_id: values.type_id!,
          amount: values.amount!,
          category_id: values.category_id!,
          occurred_at: cstTimeString,
          remark: values.remark || undefined,
          tag_ids: values.tag_ids && values.tag_ids.length > 0 ? values.tag_ids : undefined,
        });
        message.success('保存成功');

        if (stayOnPage) {
          // 保留类型和分类，清空其他字段
          form.setFieldsValue({
            amount: undefined,
            remark: undefined,
            tag_ids: [],
          });
          return;
        }

        router.push('/records');
      } else if (mode === 'edit' && id) {
        await recordsApi.updateRecord({
          id,
          type_id: values.type_id!,
          amount: values.amount!,
          category_id: values.category_id!,
          occurred_at: cstTimeString,
          remark: values.remark || undefined,
          tag_ids: values.tag_ids && values.tag_ids.length > 0 ? values.tag_ids : undefined,
        });
        message.success('保存成功');
        router.push(`/records/${id}`);
      }
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) {
        // Form 验证错误，不需要额外提示
        return;
      }
      const msg = e instanceof Error ? e.message : '保存失败，请稍后重试';
      setError(msg);
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!record || !id) return;
    Modal.confirm({
      title: '确认删除',
      content: '确认删除该记录吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await recordsApi.deleteRecord({ id });
          message.success('删除成功');
          router.push('/records');
        } catch (e) {
          const msg = e instanceof Error ? e.message : '删除失败，请稍后重试';
          message.error(msg);
        }
      },
    });
  };

  const handleEdit = () => {
    if (id) {
      router.push(`/records/${id}?mode=edit`);
    }
  };

  const handleCopy = () => {
    if (id) {
      router.push(`/records/new?from_id=${id}`);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'view':
        return '账目详情';
      case 'edit':
        return '编辑记账';
      case 'copy':
        return '复制记账';
      case 'create':
      default:
        return '新建记账';
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col gap-4 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">{getTitle()}</h1>
        <Button type="link" onClick={() => router.back()}>
          返回
        </Button>
      </div>

      <div className="mx-auto w-full max-w-xl">
        <Card>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spin size="large" />
            </div>
          ) : error && !record && mode !== 'create' && mode !== 'copy' ? (
            <div className="rounded border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          ) : (
            // 统一使用表单布局，详情模式下所有字段 disabled
            <Form
              form={form}
              layout="vertical"
              onFinish={() => handleSubmit(false)}
              requiredMark={false}
            >
              {error && (
                <div className="mb-4 rounded border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Form.Item
                label="类型"
                name="type_id"
                rules={[{ required: true, message: '请选择类型' }]}
              >
                <Select
                  placeholder="请选择类型"
                  onChange={handleTypeChange}
                  disabled={mode === 'view'}
                >
                  {typeOptions.map((t) => (
                    <Option key={t.id} value={t.id}>
                      {t.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="金额（元）"
                name="amount"
                rules={[
                  { required: true, message: '请输入金额' },
                  {
                    validator: (_, value) => {
                      if (value === undefined || value === null || value === '') {
                        return Promise.reject(new Error('请输入金额'));
                      }
                      const numValue = typeof value === 'number' ? value : Number(value);
                      if (isNaN(numValue) || numValue < 0.01) {
                        return Promise.reject(new Error('金额必须大于 0'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  placeholder="请输入金额"
                  min={0.01}
                  step={0.01}
                  precision={2}
                  style={{ width: '100%' }}
                  disabled={mode === 'view'}
                />
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues: FormValues, currentValues: FormValues) =>
                  prevValues?.type_id !== currentValues?.type_id
                }
                dependencies={['type_id']}
              >
                {({ getFieldValue }) => {
                  const typeId = getFieldValue('type_id');
                  const currentFilteredCategories = typeId
                    ? categories.filter((c) => c.type_id === typeId)
                    : [];
                  return (
                    <Form.Item
                      label="分类"
                      name="category_id"
                      rules={[{ required: true, message: '请选择分类' }]}
                    >
                      <Select
                        placeholder="请选择分类"
                        disabled={!typeId || mode === 'view'}
                        notFoundContent={typeId && currentFilteredCategories.length === 0 ? '该类型下暂无分类' : undefined}
                        showSearch
                        optionFilterProp="children"
                      >
                        {currentFilteredCategories.map((c) => (
                          <Option key={c.id} value={c.id}>
                            {c.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  );
                }}
              </Form.Item>

              <Form.Item
                label="发生时间"
                name="occurred_at"
                rules={[{ required: true, message: '请选择发生时间' }]}
                extra={mode !== 'view' ? '按本地时间填写，提交时会自动转换为 UTC 存储' : undefined}
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                  placeholder="请选择发生时间"
                  disabled={mode === 'view'}
                />
              </Form.Item>

              <Form.Item label="标签" name="tag_ids">
                <Select
                  mode="multiple"
                  placeholder="请选择标签（可选）"
                  allowClear
                  disabled={mode === 'view'}
                  tagRender={(props) => {
                    const { label, value, closable, onClose } = props;
                    const tag = tags.find((t) => t.id === value);
                    return (
                      <Tag
                        color={tag?.color || '#1890FF'}
                        closable={closable && mode !== 'view'}
                        onClose={onClose}
                        style={{ marginRight: 3 }}
                      >
                        {label}
                      </Tag>
                    );
                  }}
                >
                  {tags.map((tag) => (
                    <Option key={tag.id} value={tag.id}>
                      {tag.name}
                    </Option>
                  ))}
                </Select>
                {tags.length === 0 && (
                  <div className="text-xs text-gray-400 mt-1">
                    暂无标签，可在标签管理页创建。
                  </div>
                )}
              </Form.Item>

              <Form.Item label="备注" name="remark">
                <TextArea
                  rows={3}
                  placeholder="请输入备注（可选）"
                  showCount={mode !== 'view'}
                  maxLength={500}
                  disabled={mode === 'view'}
                />
              </Form.Item>

              {mode === 'view' ? (
                // 详情模式：显示操作按钮
                <Form.Item>
                  <div className="flex items-center justify-end gap-3">
                    <Button onClick={() => router.push('/records')}>
                      返回列表
                    </Button>
                    <Button
                      type="primary"
                      icon={<EditOutlined />}
                      onClick={handleEdit}
                    >
                      编辑
                    </Button>
                    <Button
                      icon={<CopyOutlined />}
                      onClick={handleCopy}
                    >
                      复制为新建
                    </Button>
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => void handleDelete()}
                    >
                      删除
                    </Button>
                  </div>
                </Form.Item>
              ) : (
                // 编辑/新建/复制模式：显示保存按钮
                <Form.Item>
                  <div className="flex items-center justify-end gap-3">
                    <Button onClick={() => router.back()} disabled={submitting}>
                      取消
                    </Button>
                    {(mode === 'create' || mode === 'copy') && (
                      <Button
                        onClick={() => handleSubmit(true)}
                        disabled={submitting}
                        loading={submitting}
                      >
                        保存并继续记一笔
                      </Button>
                    )}
                    <Button
                      type="primary"
                      htmlType="submit"
                      disabled={submitting}
                      loading={submitting}
                    >
                      保存
                    </Button>
                  </div>
                </Form.Item>
              )}
            </Form>
          )}
        </Card>
      </div>
    </div>
  );
}
