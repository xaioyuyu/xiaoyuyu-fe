// AI分析模块相关的前端类型定义
// 与后端接口文档保持一致

// 分页类型（复用）
export type Pagination = {
    total: number;
    page: number;
    page_size: number;
};

// ========== 月度消费总结 ==========
export type MonthlySummaryRequest = {
    year?: number;
    month?: number;
    force_refresh?: boolean;
};

export type MonthlySummaryResponse = {
    period: string; // "YYYY-MM"
    summary: {
        record_count: number;
        total_amount: number;
        daily_average: number;
    };
    category_distribution: Array<{
        category_id: number;
        category_name: string;
        amount: number;
        percent: number;
    }>;
    comparison: {
        change_type: 'increase' | 'decrease';
        change_ratio: number; // 变化百分比
        last_month_total: number; // 上月总消费
    };
    ai_report: string; // Markdown格式的AI报告
};

// ========== 消费行为洞察 ==========
export type BehaviorInsightRequest = {
    start_date?: string; // YYYY-MM-DD
    end_date?: string; // YYYY-MM-DD
    force_refresh?: boolean;
};

export type BehaviorInsightResponse = {
    period: string; // "YYYY-MM-DD ~ YYYY-MM-DD"
    statistics: {
        avg_amount: number; // 平均单笔金额
        peak_hours: number[]; // 消费高峰时段（小时 0-23）
        top_categories: Array<{
            category_id: number;
            category_name: string;
            amount: number;
            count: number;
        }>;
        frequency_distribution: {
            total_days: number;
            avg_per_day: number;
            max_per_day: number;
        };
    };
    ai_insights: {
        habits?: string;
        trends?: string;
        preferences?: string;
    };
};

// ========== 节省建议 ==========
export type SavingSuggestionsRequest = {
    year?: number;
    month?: number;
    compare_type?: 'month' | 'year'; // month=环比，year=同比
    force_refresh?: boolean;
};

// 增长分类项（来自 comparison.increased_categories）
export type IncreasedCategory = {
    category_id: number;
    category_name: string;
    current_amount: number;
    previous_amount: number;
    increase_ratio: number; // 增长百分比
};

// 建议项（来自 suggestions）
export type SavingSuggestionItem = {
    category_id: number;
    category_name: string;
    suggestion: string;
};

export type SavingSuggestionsResponse = {
    period: string; // "YYYY-MM"
    comparison: {
        type: 'month' | 'year';
        increased_categories: IncreasedCategory[];
    };
    suggestions: SavingSuggestionItem[];
};

// ========== 消费预测 ==========
export type ConsumptionForecastRequest = {
    year?: number;
    month?: number;
    force_refresh?: boolean;
};

export type ConsumptionForecastResponse = {
    period: string; // "YYYY-MM"
    current_status: {
        days_passed: number; // 已过天数
        days_remaining: number; // 剩余天数
        consumed_amount: number; // 已消费金额
        daily_average: number; // 日均消费
    };
    forecast: {
        predicted_most_likely: number; // 最可能值
        predicted_min: number; // 最低预测
        predicted_max: number; // 最高预测
        confidence_level: 'high' | 'medium' | 'low'; // 置信度
    };
    ai_analysis: string; // Markdown格式的AI分析
};

// ========== 异常消费提醒 ==========
export type AnomalyAlert = {
    id: number;
    record_id?: number; // 关联的记录ID
    anomaly_type: string; // 异常类型
    alert_level: 'low' | 'medium' | 'high'; // 严重程度
    amount: number; // 异常金额
    occurred_at: string; // 发生时间
    ai_message: string; // AI提醒消息
    is_read: boolean; // 是否已读
    created_at: string;
};

export type AnomalyAlertsRequest = {
    page?: number;
    page_size?: number;
    is_read?: boolean;
    alert_level?: 'low' | 'medium' | 'high';
};

export type AnomalyAlertsResponse = {
    list: AnomalyAlert[];
    pagination: Pagination;
    unread_count: number; // 未读数量
};

export type MarkAnomalyAlertReadRequest = {
    alert_id?: number; // 可选，不传则标记所有未读
};

// ========== 异常检查 ==========
export type AnomalyCheckRequest = {
    record_id?: number; // 可选，如果提供则查询记录详情
    amount?: number; // 如果未提供record_id则必填
    category_id?: number; // 如果未提供record_id则必填
    occurred_at?: string; // 如果未提供record_id则必填，ISO格式
};

export type AnomalyCheckResponse = {
    is_anomaly: boolean;
    anomaly_type?: string;
    alert_level?: 'low' | 'medium' | 'high';
    ai_message?: string;
    alert_id?: number; // 如果创建了提醒，返回提醒ID
};

// ========== 预算调优建议 ==========
export type BudgetOptimizationRequest = {
    year?: number;
    month?: number;
    total_budget?: number; // 可选，不传则查询现有预算
    force_refresh?: boolean;
};

// 推荐分配中的分类项
export type RecommendedCategoryItem = {
    category_id: number;
    category_name: string;
    current_budget: number;
    recommended_budget: number;
    reason: string;
};

export type BudgetOptimizationResponse = {
    target_period: string; // "YYYY-MM"
    current_budget: {
        total: number;
        categories: Array<{ category_id: number; category_name?: string; amount: number }>;
    };
    recommended_allocation: {
        total: number;
        categories: RecommendedCategoryItem[];
    };
    ai_explanation: string; // Markdown格式的调优说明
};

