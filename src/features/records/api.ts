import { httpRequest } from '@/lib/http/request';
import type {
    CategoriesListData,
    RecordItem,
    RecordTypesListData,
    RecordsListData,
    RecordsSummaryByCategoryData,
    RecordsSummaryData,
    TagsListData,
} from './types';

// ---------- 记录类型 ----------

export const getRecordTypes = async (): Promise<RecordTypesListData> => {
    return httpRequest<RecordTypesListData>({
        url: '/api/record-types',
        method: 'GET',
    });
};

// ---------- 后台管理：记录类型 ----------

export type CreateRecordTypePayload = {
    code: string; // 必填，唯一
    name: string; // 必填
    description?: string;
    sort_order?: number;
};

export const createRecordType = async (
    payload: CreateRecordTypePayload,
): Promise<void> => {
    await httpRequest<void>({
        url: '/api/admin/record-types',
        method: 'POST',
        data: payload,
    });
};

export type UpdateRecordTypePayload = {
    id: number; // 必填，在 body 中
    name?: string;
    description?: string;
    sort_order?: number;
    // code 不允许修改
};

export const updateRecordType = async (
    payload: UpdateRecordTypePayload,
): Promise<void> => {
    await httpRequest<void>({
        url: '/api/admin/record-types/update',
        method: 'PUT',
        data: payload,
    });
};

export type DeleteRecordTypePayload = {
    id: number; // 必填，在 body 中
};

export const deleteRecordType = async (
    payload: DeleteRecordTypePayload,
): Promise<void> => {
    await httpRequest<void>({
        url: '/api/admin/record-types/delete',
        method: 'DELETE',
        data: payload,
    });
};

// ---------- 分类 ----------

export type GetCategoriesParams = {
    type_id?: number;
};

export const getCategories = async (
    params?: GetCategoriesParams,
): Promise<CategoriesListData> => {
    return httpRequest<CategoriesListData>({
        url: '/api/categories',
        method: 'POST',
        data: params,
    });
};

export type CreateCategoryPayload = {
    name: string;
    type_id: number;
    parent_id?: number | null;
    icon?: string;
    color?: string;
    sort_order?: number;
};

export const createCategory = async (
    payload: CreateCategoryPayload,
): Promise<void> => {
    await httpRequest<void>({
        url: '/api/categories',
        method: 'POST',
        data: payload,
    });
};

export type UpdateCategoryPayload = {
    id: number;
    name?: string;
    parent_id?: number | null;
    icon?: string;
    color?: string;
    sort_order?: number;
};

export const updateCategory = async (
    payload: UpdateCategoryPayload,
): Promise<void> => {
    await httpRequest<void>({
        url: '/api/categories/update',
        method: 'PUT',
        data: payload,
    });
};

export type DeleteCategoryPayload = {
    id: number;
};

export const deleteCategory = async (
    payload: DeleteCategoryPayload,
): Promise<void> => {
    await httpRequest<void>({
        url: '/api/categories/delete',
        method: 'DELETE',
        data: payload,
    });
};

// ---------- 标签 ----------

export const getTags = async (): Promise<TagsListData> => {
    return httpRequest<TagsListData>({
        url: '/api/tags',
        method: 'GET',
    });
};

export type CreateTagPayload = {
    name: string;
    color?: string;
    is_system?: number;
};

export const createTag = async (payload: CreateTagPayload): Promise<void> => {
    await httpRequest<void>({
        url: '/api/tags',
        method: 'POST',
        data: payload,
    });
};

export type DeleteTagPayload = {
    id: number;
};

export const deleteTag = async (payload: DeleteTagPayload): Promise<void> => {
    await httpRequest<void>({
        url: '/api/tags/delete',
        method: 'DELETE',
        data: payload,
    });
};

// ---------- 记账记录 ----------

export type CreateRecordPayload = {
    type_id: number;
    amount: number;
    category_id: number;
    occurred_at: string; // UTC ISO 字符串
    remark?: string;
    tag_ids?: number[];
};

export const createRecord = async (
    payload: CreateRecordPayload,
): Promise<void> => {
    await httpRequest<void>({
        url: '/api/records',
        method: 'POST',
        data: payload,
    });
};

export type UpdateRecordPayload = {
    id: number;
    type_id?: number;
    amount?: number;
    category_id?: number;
    occurred_at?: string;
    remark?: string;
    tag_ids?: number[];
};

export const updateRecord = async (
    payload: UpdateRecordPayload,
): Promise<void> => {
    await httpRequest<void>({
        url: '/api/records/update',
        method: 'PUT',
        data: payload,
    });
};

export type DeleteRecordPayload = {
    id: number;
};

export const deleteRecord = async (
    payload: DeleteRecordPayload,
): Promise<void> => {
    await httpRequest<void>({
        url: '/api/records/delete',
        method: 'DELETE',
        data: payload,
    });
};

export type GetRecordDetailPayload = {
    id: number;
};

export type RecordDetailData = {
    record: RecordItem;
};

export const getRecordDetail = async (
    payload: GetRecordDetailPayload,
): Promise<RecordDetailData> => {
    return httpRequest<RecordDetailData>({
        url: '/api/records/detail',
        method: 'POST',
        data: payload,
    });
};

export type GetRecordsParams = {
    page?: number;
    page_size?: number;
    start_date?: string; // YYYY-MM-DD 格式
    end_date?: string; // YYYY-MM-DD 格式
    type_id?: number;
    category_id?: number;
    tag_id?: number;
    min_amount?: number;
    max_amount?: number;
    keyword?: string;
    order_by?: 'occurred_at' | 'amount' | 'created_at';
    order?: 'asc' | 'desc';
};

export const getRecords = async (
    params: GetRecordsParams,
): Promise<RecordsListData> => {
    return httpRequest<RecordsListData>({
        url: '/api/records/list',
        method: 'POST',
        data: params,
    });
};

// ---------- 统计 ----------

export type GetRecordsSummaryParams = {
    start_date: string; // YYYY-MM-DD
    end_date: string; // YYYY-MM-DD
    group_by?: 'day' | 'month';
    type_id?: number;
};

export const getRecordsSummary = async (
    params: GetRecordsSummaryParams,
): Promise<RecordsSummaryData> => {
    return httpRequest<RecordsSummaryData>({
        url: '/api/records/summary',
        method: 'POST',
        data: params,
    });
};

export type GetRecordsSummaryByCategoryParams = {
    start_date: string;
    end_date: string;
    type_id?: number;
};

export const getRecordsSummaryByCategory = async (
    params: GetRecordsSummaryByCategoryParams,
): Promise<RecordsSummaryByCategoryData> => {
    return httpRequest<RecordsSummaryByCategoryData>({
        url: '/api/records/summary-by-category',
        method: 'POST',
        data: params,
    });
};

export const recordsApi = {
    // 类型
    getRecordTypes,
    // 后台管理：类型
    createRecordType,
    updateRecordType,
    deleteRecordType,
    // 分类
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    // 标签
    getTags,
    createTag,
    deleteTag,
    // 记录
    createRecord,
    updateRecord,
    deleteRecord,
    getRecordDetail,
    getRecords,
    // 统计
    getRecordsSummary,
    getRecordsSummaryByCategory,
};


