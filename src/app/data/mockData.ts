// 兼容旧引用:类型已迁移到服务层 services/types。
// 原始 mock 数据已迁移到 services/mockBackend,经打分流水线处理后由 services/client 提供。
export type {
  TrendItem,
  Platform,
  Category,
  TrendStatus,
} from '../services/types';
