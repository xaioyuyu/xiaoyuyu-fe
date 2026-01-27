// 通用接口返回类型定义（占位文件）
// 例如：ApiResponse<T> 等

export type ApiResponse<T> = {
    code: number;
    message: string;
    data: T;
};


