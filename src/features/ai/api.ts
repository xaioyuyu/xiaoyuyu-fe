import { httpRequest } from '@/lib/http/request';
import type {
    MonthlySummaryRequest,
    MonthlySummaryResponse,
    BehaviorInsightRequest,
    BehaviorInsightResponse,
    SavingSuggestionsRequest,
    SavingSuggestionsResponse,
    ConsumptionForecastRequest,
    ConsumptionForecastResponse,
    AnomalyAlertsRequest,
    AnomalyAlertsResponse,
    MarkAnomalyAlertReadRequest,
    AnomalyCheckRequest,
    AnomalyCheckResponse,
    BudgetOptimizationRequest,
    BudgetOptimizationResponse,
} from './types';

// ========== 月度消费总结 ==========
export const getMonthlySummary = async (
    params?: MonthlySummaryRequest,
): Promise<MonthlySummaryResponse> => {
    return httpRequest<MonthlySummaryResponse>({
        url: '/api/ai/monthly-summary',
        method: 'POST',
        data: params || {},
    });
};

// ========== 消费行为洞察 ==========
export const getBehaviorInsight = async (
    params?: BehaviorInsightRequest,
): Promise<BehaviorInsightResponse> => {
    return httpRequest<BehaviorInsightResponse>({
        url: '/api/ai/behavior-insight',
        method: 'POST',
        data: params || {},
    });
};

// ========== 节省建议 ==========
export const getSavingSuggestions = async (
    params?: SavingSuggestionsRequest,
): Promise<SavingSuggestionsResponse> => {
    return httpRequest<SavingSuggestionsResponse>({
        url: '/api/ai/saving-suggestions',
        method: 'POST',
        data: params || {},
    });
};

// ========== 消费预测 ==========
export const getConsumptionForecast = async (
    params?: ConsumptionForecastRequest,
): Promise<ConsumptionForecastResponse> => {
    return httpRequest<ConsumptionForecastResponse>({
        url: '/api/ai/consumption-forecast',
        method: 'POST',
        data: params || {},
    });
};

// ========== 异常消费提醒 ==========
export const getAnomalyAlerts = async (
    params?: AnomalyAlertsRequest,
): Promise<AnomalyAlertsResponse> => {
    return httpRequest<AnomalyAlertsResponse>({
        url: '/api/ai/anomaly-alerts',
        method: 'POST',
        data: params,
    });
};

export const markAnomalyAlertRead = async (
    params?: MarkAnomalyAlertReadRequest,
): Promise<void> => {
    return httpRequest<void>({
        url: '/api/ai/anomaly-alerts/read',
        method: 'POST',
        data: params || {},
    });
};

// ========== 异常检查 ==========
export const checkAnomaly = async (
    params: AnomalyCheckRequest,
): Promise<AnomalyCheckResponse> => {
    return httpRequest<AnomalyCheckResponse>({
        url: '/api/ai/anomaly-check',
        method: 'POST',
        data: params,
    });
};

// ========== 预算调优建议 ==========
export const getBudgetOptimization = async (
    params?: BudgetOptimizationRequest,
): Promise<BudgetOptimizationResponse> => {
    return httpRequest<BudgetOptimizationResponse>(
        {
        url: '/api/ai/budget-optimization',
        method: 'POST',
        data: params || {},
        }, 
        {
            errorMessage: true,
        }
    );
};

// 统一导出
export const aiApi = {
    getMonthlySummary,
    getBehaviorInsight,
    getSavingSuggestions,
    getConsumptionForecast,
    getAnomalyAlerts,
    markAnomalyAlertRead,
    checkAnomaly,
    getBudgetOptimization,
};

