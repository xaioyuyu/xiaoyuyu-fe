'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { recordsApi } from '@/features/records/api';
import type { Category, RecordItem, RecordType, Tag } from '@/features/records/types';

export default function EditRecordPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [recordTypes, setRecordTypes] = useState<RecordType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [record, setRecord] = useState<RecordItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [typeId, setTypeId] = useState<number | undefined>();
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [occurredAt, setOccurredAt] = useState<string>('');
  const [remark, setRemark] = useState<string>('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const typeOptions = useMemo(() => recordTypes, [recordTypes]);
  const categoryOptions = useMemo(() => {
    if (!typeId) return categories;
    return categories.filter((c) => c.type_id === typeId);
  }, [categories, typeId]);

  useEffect(() => {
    const init = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const [typesRes, categoriesRes, tagsRes, detailRes] = await Promise.all([
          recordsApi.getRecordTypes(),
          recordsApi.getCategories(),
          recordsApi.getTags(),
          recordsApi.getRecordDetail({ id }),
        ]);
        setRecordTypes(typesRes.list);
        setCategories(categoriesRes.list);
        setTags(tagsRes.list);
        const r = detailRes.record;
        setRecord(r);
        setTypeId(r.type_id);
        setAmount(r.amount.toString());
        setCategoryId(r.category_id);
        const occurred = new Date(r.occurred_at);
        const local = new Date(
          occurred.getTime() - occurred.getTimezoneOffset() * 60 * 1000,
        )
          .toISOString()
          .slice(0, 16);
        setOccurredAt(local);
        setRemark(r.remark ?? '');
        setSelectedTagIds(r.tag_ids ?? []);
      } catch (e) {
        const msg = e instanceof Error ? e.message : '初始化数据失败，请稍后重试';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, [id]);

  const handleToggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((x) => x !== tagId) : [...prev, tagId],
    );
  };

  const handleSubmit = async () => {
    if (!typeId || !categoryId || !occurredAt || !amount) {
      setError('请填写必填项（类型、金额、分类、时间）');
      return;
    }
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('金额必须大于 0');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const localDate = new Date(occurredAt);
      const utcIso = new Date(
        localDate.getTime() - localDate.getTimezoneOffset() * 60 * 1000,
      ).toISOString();

      await recordsApi.updateRecord({
        id,
        type_id: typeId,
        amount: parsedAmount,
        category_id: categoryId,
        occurred_at: utcIso,
        remark: remark || undefined,
        tag_ids: selectedTagIds.length ? selectedTagIds : undefined,
      });

      router.push(`/records/${id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '保存失败，请稍后重试';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col gap-4 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">编辑记账</h1>
        <button
          type="button"
          className="text-sm text-slate-500 hover:underline"
          onClick={() => router.back()}
        >
          返回
        </button>
      </div>

      <div className="mx-auto w-full max-w-xl rounded-lg bg-white p-4 shadow-sm">
        {loading && (
          <div className="mb-2 text-xs text-slate-400">数据加载中，请稍候...</div>
        )}
        {error && (
          <div className="mb-2 rounded border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}
        {!loading && !record && !error && (
          <div className="text-xs text-slate-400">未找到该记录。</div>
        )}

        {record && (
          <form
            className="space-y-4 text-sm"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSubmit();
            }}
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">类型*</label>
              <select
                className="rounded border border-slate-200 px-2 py-1"
                value={typeId ?? ''}
                onChange={(e) =>
                  setTypeId(e.target.value ? Number(e.target.value) : undefined)
                }
              >
                {typeOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">金额（元）*</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="rounded border border-slate-200 px-2 py-1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">分类*</label>
              <select
                className="rounded border border-slate-200 px-2 py-1"
                value={categoryId ?? ''}
                onChange={(e) =>
                  setCategoryId(e.target.value ? Number(e.target.value) : undefined)
                }
              >
                <option value="">请选择分类</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">发生时间*</label>
              <input
                type="datetime-local"
                className="rounded border border-slate-200 px-2 py-1"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
              />
              <p className="text-[11px] text-slate-400">
                按本地时间编辑，提交时会自动转换为 UTC 存储。
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">标签</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const active = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      className={`rounded-full border px-2 py-1 text-xs ${
                        active
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                      onClick={() => handleToggleTag(tag.id)}
                    >
                      {tag.name}
                    </button>
                  );
                })}
                {tags.length === 0 && (
                  <span className="text-[11px] text-slate-400">
                    暂无标签，可在标签管理页创建。
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">备注</label>
              <textarea
                rows={3}
                className="rounded border border-slate-200 px-2 py-1"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                className="cursor-pointer rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed"
                onClick={() => router.push(`/records/${id}`)}
                disabled={submitting}
              >
                取消
              </button>
              <button
                type="submit"
                className="rounded bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}


