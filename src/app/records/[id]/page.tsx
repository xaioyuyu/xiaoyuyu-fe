'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { recordsApi } from '@/features/records/api';
import type { RecordItem } from '@/features/records/types';

export default function RecordDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const [record, setRecord] = useState<RecordItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const res = await recordsApi.getRecordDetail({ id });
        setRecord(res.record);
      } catch (e) {
        const msg = e instanceof Error ? e.message : '加载详情失败，请稍后重试';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    void fetchDetail();
  }, [id]);

  const handleDelete = async () => {
    if (!record) return;
    if (!window.confirm('确认删除该记录吗？')) return;
    try {
      await recordsApi.deleteRecord({ id: record.id });
      router.push('/records');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '删除失败，请稍后重试';
      setError(msg);
    }
  };

  const occurredStr =
    record &&
    new Date(record.occurred_at).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="flex h-full flex-1 flex-col gap-4 bg-slate-50 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">账目详情</h1>
        <button
          type="button"
          className="cursor-pointer text-sm text-slate-500 hover:underline"
          onClick={() => router.back()}
        >
          返回
        </button>
      </div>

      <div className="mx-auto w-full max-w-xl rounded-lg bg-white p-4 shadow-sm">
        {loading && (
          <div className="mb-2 text-xs text-slate-400">详情加载中...</div>
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
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-xs text-slate-500">金额</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                ￥{record.amount}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
              <div>
                <div className="text-[11px] text-slate-500">分类</div>
                <div className="mt-1 text-slate-800">
                  {record.category_name ?? record.category_id}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">时间</div>
                <div className="mt-1 text-slate-800">{occurredStr}</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">标签</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(record.tags ?? []).length ? (
                    record.tags?.map((tag) => (
                      <span
                        key={tag.id}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700"
                      >
                        {tag.name}
                      </span>
                    ))
                  ) : record.tag_ids && record.tag_ids.length ? (
                    <span className="text-[11px] text-slate-600">
                      {record.tag_ids.join(', ')}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">无</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500">记录 ID</div>
                <div className="mt-1 text-slate-800">{record.id}</div>
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-500">备注</div>
              <div className="mt-1 whitespace-pre-wrap rounded border border-slate-100 bg-slate-50 p-2 text-xs text-slate-700">
                {record.remark || '无'}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                className="cursor-pointer rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                onClick={() => router.push('/records')}
              >
                返回列表
              </button>
              <button
                type="button"
                className="cursor-pointer rounded border border-sky-500 px-3 py-1.5 text-xs font-medium text-sky-600 hover:bg-sky-50"
                onClick={() => router.push(`/records/${record.id}/edit`)}
              >
                编辑
              </button>
              <button
                type="button"
                className="cursor-pointer rounded border border-emerald-500 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
                onClick={() => router.push(`/records/new?from_id=${record.id}`)}
              >
                复制为新建
              </button>
              <button
                type="button"
                className="rounded border border-red-500 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                onClick={() => void handleDelete()}
              >
                删除
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


