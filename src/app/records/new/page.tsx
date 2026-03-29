'use client';

// 新建页面：直接使用统一组件逻辑
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Form, Input, InputNumber, Select, DatePicker, Button, Card, Tag, message, Spin, Modal } from 'antd';
import dayjs, { type Dayjs } from '@/lib/utils/dayjs';
import { formatCSTForBackend } from '@/lib/utils';
import { recordsApi } from '@/features/records/api';
import { aiApi } from '@/features/ai/api';
import type { Category, RecordType, Tag as TagType } from '@/features/records/types';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';

type FormValues = {
  type_id?: number;
  amount?: number;
  category_id?: number;
  occurred_at?: Dayjs;
  remark?: string;
  tag_ids?: number[];
};

const { Option } = Select;
const { TextArea } = Input;

function NewRecordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromId = searchParams.get('from_id');
  const mode = fromId ? 'copy' : 'create';

  const [form] = Form.useForm();
  const [recordTypes, setRecordTypes] = useState<RecordType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [anomalyModalVisible, setAnomalyModalVisible] = useState(false);
  const [anomalyData, setAnomalyData] = useState<{
    anomaly_type: string;
    alert_level: 'low' | 'medium' | 'high';
    ai_message: string;
    alert_id?: number;
    record_id?: number;
  } | null>(null);

  const typeOptions = useMemo(() => recordTypes, [recordTypes]);

  const handleTypeChange = () => {
    form.setFieldsValue({ category_id: undefined });
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [typesRes, categoriesRes, tagsRes] = await Promise.all([
          recordsApi.getRecordTypes(),
          recordsApi.getCategories(),
          recordsApi.getTags(),
        ]);
        setRecordTypes(typesRes.list);
        setCategories(categoriesRes.list);
        setTags(tagsRes.list);

        if (!fromId) {
          const now = dayjs();
          form.setFieldsValue({
            occurred_at: now,
            type_id: typesRes.list.length > 0 ? typesRes.list[0].id : undefined,
          });
          return;
        }

        const detail = await recordsApi.getRecordDetail({ id: Number(fromId) });
        const record = detail.record;
        // 将 UTC 时间转换为中国时区的 dayjs 对象
        const occurred = dayjs.utc(record.occurred_at).tz('Asia/Shanghai');
        form.setFieldsValue({
          type_id: record.type_id,
          amount: record.amount,
          category_id: record.category_id,
          occurred_at: occurred,
          remark: record.remark || undefined,
          tag_ids: record.tag_ids || [],
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : '初始化数据失败，请稍后重试';
        message.error(msg);
      } finally {
        setLoading(false);
      }
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromId]);

  const handleSubmit = async (stayOnPage: boolean) => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // 将 dayjs 对象格式化为东8区时间字符串（带时区信息）
      const occurredAt = values.occurred_at as Dayjs;
      const cstTimeString = formatCSTForBackend(occurredAt);

      await recordsApi.createRecord({
        type_id: values.type_id!,
        amount: values.amount!,
        category_id: values.category_id!,
        occurred_at: cstTimeString,
        remark: values.remark || undefined,
        tag_ids: values.tag_ids && values.tag_ids.length > 0 ? values.tag_ids : undefined,
      });

      message.success('保存成功');

      // 检查异常消费（仅对支出类型检查）
      if (values.type_id === 1) {
        try {
          const anomalyCheck = await aiApi.checkAnomaly({
            amount: values.amount!,
            category_id: values.category_id!,
            occurred_at: cstTimeString,
          });
          if (anomalyCheck.is_anomaly && anomalyCheck.anomaly_type && anomalyCheck.alert_level && anomalyCheck.ai_message) {
            setAnomalyData({
              anomaly_type: anomalyCheck.anomaly_type,
              alert_level: anomalyCheck.alert_level,
              ai_message: anomalyCheck.ai_message,
              alert_id: anomalyCheck.alert_id,
            });
            setAnomalyModalVisible(true);
          }
        } catch (error) {
          // 异常检查失败不影响正常保存流程
          console.error('异常检查失败', error);
        }
      }

      if (stayOnPage) {
        form.setFieldsValue({
          amount: undefined,
          remark: undefined,
          tag_ids: [],
        });
        return;
      }

      // 如果有异常提醒，不自动跳转，让用户先查看提醒
      if (!anomalyModalVisible) {
        router.push('/records');
      }
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) {
        return;
      }
      const msg = e instanceof Error ? e.message : '保存失败，请稍后重试';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col gap-4 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">
          {mode === 'copy' ? '复制记账' : '新建记账'}
        </h1>
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
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={() => handleSubmit(false)}
              requiredMark={false}
            >
              <Form.Item
                label="类型"
                name="type_id"
                rules={[{ required: true, message: '请选择类型' }]}
              >
                <Select placeholder="请选择类型" onChange={handleTypeChange}>
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
                  { type: 'number', min: 0.01, message: '金额必须大于 0' },
                ]}
              >
                <InputNumber
                  placeholder="请输入金额"
                  min={0.01}
                  step={0.01}
                  precision={2}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues: FormValues, currentValues: FormValues) =>
                  prevValues?.type_id !== currentValues?.type_id
                }
              >
                {({ getFieldValue }) => {
                  const typeId = getFieldValue('type_id');
                  const filteredCategories = typeId
                    ? categories.filter((c) => c.type_id === typeId)
                    : [];
                  return (
                    <Form.Item
                      label="分类"
                      name="category_id"
                      rules={[{ required: true, message: '请选择分类' }]}
                    >
                      <Select placeholder="请选择分类" disabled={!typeId}>
                        {filteredCategories.map((c) => (
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
                extra="按本地时间填写，提交时会自动转换为 UTC 存储"
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  style={{ width: '100%' }}
                  placeholder="请选择发生时间"
                />
              </Form.Item>

              <Form.Item label="标签" name="tag_ids">
                <Select
                  mode="multiple"
                  placeholder="请选择标签（可选）"
                  allowClear
                  tagRender={(props) => {
                    const { label, value, closable, onClose } = props;
                    const tag = tags.find((t) => t.id === value);
                    return (
                      <Tag
                        color={tag?.color || '#1890FF'}
                        closable={closable}
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
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <Form.Item>
                <div className="flex items-center justify-end gap-3">
                  <Button onClick={() => router.back()} disabled={submitting}>
                    取消
                  </Button>
                  <Button
                    onClick={() => handleSubmit(true)}
                    disabled={submitting}
                    loading={submitting}
                  >
                    保存并继续记一笔
                  </Button>
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
            </Form>
          )}
        </Card>
      </div>

      {/* 异常提醒弹窗 */}
      <Modal
        title="异常消费提醒"
        open={anomalyModalVisible}
        onCancel={() => {
          setAnomalyModalVisible(false);
          setAnomalyData(null);
          router.push('/records');
        }}
        footer={[
          <Button
            key="mark-read"
            onClick={async () => {
              if (anomalyData?.alert_id) {
                try {
                  await aiApi.markAnomalyAlertRead({ alert_id: anomalyData.alert_id });
                  message.success('已标记为已读');
                } catch (error) {
                  console.error('标记已读失败', error);
                }
              }
              setAnomalyModalVisible(false);
              setAnomalyData(null);
              router.push('/records');
            }}
          >
            确认
          </Button>,
        ]}
        width={600}
      >
        {anomalyData && (
          <div className="space-y-4">
            <div>
              <span className="text-sm text-gray-600">异常类型：</span>
              <span className="ml-2 font-semibold">{anomalyData.anomaly_type}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">严重程度：</span>
              <Tag
                color={
                  anomalyData.alert_level === 'high'
                    ? 'red'
                    : anomalyData.alert_level === 'medium'
                      ? 'orange'
                      : 'blue'
                }
                className="ml-2"
              >
                {anomalyData.alert_level === 'high' ? '高' : anomalyData.alert_level === 'medium' ? '中' : '低'}
              </Tag>
            </div>
            <div>
              <span className="text-sm text-gray-600 mb-2 block">AI提醒消息：</span>
              <div className="bg-gray-50 p-4 rounded">
                <MarkdownRenderer content={anomalyData.ai_message} />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function NewRecordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <Spin size="large" />
        </div>
      }
    >
      <NewRecordPageContent />
    </Suspense>
  );
}
