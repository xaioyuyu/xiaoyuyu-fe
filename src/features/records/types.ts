// 账目记录模块相关的前端类型定义
// 尽量与后端 swagger 与补充设计文档（answer.md）保持一致

export type Pagination = {
    total: number;
    page: number;
    page_size: number;
};

// 记账类型（fs_record_types）
export type RecordType = {
    id: number;
    code: string; // 如 expense, income, transfer 等
    name: string; // 展示名称：支出 / 收入 / 转账 ...
    description?: string;
    sort_order?: number;
};

// 分类（fs_categories）
export type Category = {
    id: number;
    user_id: number | null;
    type_id: number;
    name: string;
    parent_id: number | null;
    icon?: string;
    color?: string;
    sort_order?: number;
    is_system: 0 | 1;
};

// 标签（fs_tags）
export type Tag = {
    id: number;
    user_id: number | null;
    name: string;
    color?: string;
    is_system: 0 | 1;
};

// 单条记账记录（fs_records）
export type RecordItem = {
    id: number;
    /** 后台审计列表等场景可能返回 */
    user_id?: number;
    type_id: number;
    amount: number;
    category_id: number;
    occurred_at: string; // ISO 字符串（UTC）
    remark?: string;
    tag_ids?: number[];

    // 可能由后端附带的冗余展示字段（可选，方便前端直接使用）
    category_name?: string;
    category_parent_id?: number | null;
    category_parent_name?: string | null;
    type_code?: string;
    type_name?: string;
    tags?: Tag[];
};

// GET /api/records 列表 data
export type RecordsListData = {
    list: RecordItem[];
    pagination: Pagination;
    summary: {
        total_amount: number;
    };
};

// GET /api/categories data
export type CategoriesListData = {
    list: Category[];
};

// GET /api/tags data
export type TagsListData = {
    list: Tag[];
};

// GET /api/record-types data
export type RecordTypesListData = {
    list: RecordType[];
};

// /api/records/summary data
export type RecordsSummaryItem = {
    date: string; // YYYY-MM-DD（按 group_by 不同代表天或月的第一天）
    total_amount: number;
};

export type RecordsSummaryData = {
    items: RecordsSummaryItem[];
};

// /api/records/summary-by-category data
export type RecordsSummaryByCategoryItem = {
    category_id: number;
    category_name: string;
    total_amount: number;
    percent: number; // 0-1
};

export type RecordsSummaryByCategoryData = {
    items: RecordsSummaryByCategoryItem[];
    total_amount: number;
};


