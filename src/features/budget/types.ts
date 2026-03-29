// 预算模块类型定义，与后端接口文档一致

export type Pagination = {
    total: number;
    page: number;
    page_size: number;
};

// 预算列表项
export type BudgetItem = {
    id: number;
    year_month: string; // 6位如 202403
    total_budget: number;
    created_at?: string;
    updated_at?: string;
};

// 预算详情（含分类预算等）
export type BudgetCategoryItem = {
    category_id: number;
    category_name?: string;
    amount: number;
};

export type BudgetDetail = {
    id: number;
    year_month: string;
    total_budget: number;
    categories?: BudgetCategoryItem[];
    created_at?: string;
    updated_at?: string;
};

// 列表查询参数
export type BudgetListParams = {
    year?: number;
    month?: number;
    page?: number;
    page_size?: number;
};

// 列表响应
export type BudgetListData = {
    list: BudgetItem[];
    pagination: Pagination;
};

// 详情请求：id 与 year_month 二选一
export type BudgetDetailParams = {
    id?: number;
    year_month?: string; // 6位如 202403
};
