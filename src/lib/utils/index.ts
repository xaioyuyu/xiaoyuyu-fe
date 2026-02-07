// 公共工具函数入口
import dayjs, { type Dayjs } from '@/lib/utils/dayjs';

/**
 * 将 UTC 时间字符串转换为中国时区（东8区）的时间字符串
 * @param utcTime UTC 时间字符串（ISO 格式）
 * @param format 输出格式，默认为 'YYYY-MM-DD HH:mm'
 * @returns 中国时区的时间字符串
 */
export const utcToCST = (utcTime: string, format: string = 'YYYY-MM-DD HH:mm'): string => {
    if (!utcTime) return '';
    // 将 UTC 时间转换为中国时区（Asia/Shanghai）
    return dayjs.utc(utcTime).tz('Asia/Shanghai').format(format);
};

/**
 * 将 UTC 时间字符串转换为中国时区的日期字符串（仅日期部分）
 * @param utcTime UTC 时间字符串（ISO 格式）
 * @returns 中国时区的日期字符串（YYYY-MM-DD）
 */
export const utcToCSTDate = (utcTime: string): string => {
    return utcToCST(utcTime, 'YYYY-MM-DD');
};

/**
 * 将中国时区的时间转换为 UTC 时间字符串
 * @param cstTime 中国时区的时间（dayjs 对象或时间字符串）
 * @returns UTC 时间字符串（ISO 格式）
 */
export const cstToUTC = (cstTime: string | Dayjs): string => {
    if (!cstTime) return '';
    return dayjs(cstTime).tz('Asia/Shanghai').utc().toISOString();
};

/**
 * 将 dayjs 对象格式化为东8区时间字符串（用于提交给后端）
 * 返回格式：YYYY-MM-DDTHH:mm:ss+08:00（ISO 8601 格式，带时区信息）
 * 这样后端可以正确识别这是东8区时间并转换为 UTC 存储
 * @param date dayjs 对象
 * @returns 东8区时间字符串（ISO 8601 格式）
 */
export const formatCSTForBackend = (date: Dayjs): string => {
    if (!date) return '';
    // 确保时间是在东8区，然后格式化为带时区的 ISO 字符串
    return date.tz('Asia/Shanghai').format('YYYY-MM-DDTHH:mm:ss+08:00');
};


