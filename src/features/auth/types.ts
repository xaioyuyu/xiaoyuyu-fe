// 认证相关类型定义（占位文件）
// 后续在此文件中统一维护 Auth 领域的 TypeScript 类型

export type AuthUser = {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
    role?: 'user' | 'admin'; // 用户角色
};
