import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/zh-cn';

// 扩展 dayjs 插件
dayjs.extend(utc);
dayjs.extend(timezone);

// 设置默认时区为中国时区（Asia/Shanghai，UTC+8）
dayjs.tz.setDefault('Asia/Shanghai');

// 设置默认语言为中文
dayjs.locale('zh-cn');

// 重新导出类型
export type { Dayjs } from 'dayjs';
export default dayjs;

