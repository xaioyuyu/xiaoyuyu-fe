import { httpRequest } from '@/lib/http/request';
import type { BudgetListData, BudgetListParams, BudgetDetail, BudgetDetailParams } from './types';

// ---------- 预算列表 ----------
export const getBudgetList = async (
    params?: BudgetListParams,
): Promise<BudgetListData> => {
    return httpRequest<BudgetListData>({
        url: '/api/budgets/list',
        method: 'POST',
        data: params ?? {},
    });
};

// ---------- 预算详情 ----------
export const getBudgetDetail = async (
    params: BudgetDetailParams,
): Promise<BudgetDetail> => {
    const res = await httpRequest<{ budget?: BudgetDetail } | BudgetDetail>({
        url: '/api/budgets/detail',
        method: 'POST',
        data: params,
    });
    if (res && typeof res === 'object' && 'budget' in res && res.budget) {
        return res.budget;
    }
    return res as BudgetDetail;
};

// ---------- 创建预算 ----------
export type CreateBudgetPayload = {
    year_month: string; // 6位如 202403
    total_budget: number;
};

export const createBudget = async (payload: CreateBudgetPayload): Promise<void> => {
    return httpRequest<void>({
        url: '/api/budgets',
        method: 'POST',
        data: payload,
    });
};

// ---------- 删除预算 ----------
export const deleteBudget = async (id: number): Promise<void> => {
    return httpRequest<void>({
        url: '/api/budgets/delete',
        method: 'DELETE',
        data: { id },
    });
};

export const budgetApi = {
    getBudgetList,
    getBudgetDetail,
    createBudget,
    deleteBudget,
};
