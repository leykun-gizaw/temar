'use server';

import {
  dbClient,
  aiUsageLog,
  operationConfig,
  eq,
  and,
  gte,
  lte,
  desc,
  count,
} from '@temar/db-client';
import { getActiveModels } from '@temar/pricing-service';

const DEFAULT_PAGE_SIZE = 10;

interface UsageFilters {
  modelId?: string;
  operationType?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchUsageLogs(filters: UsageFilters) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (filters.modelId) {
    conditions.push(eq(aiUsageLog.modelId, filters.modelId));
  }
  if (filters.operationType) {
    conditions.push(eq(aiUsageLog.operationType, filters.operationType));
  }
  if (filters.userId) {
    conditions.push(eq(aiUsageLog.userId, filters.userId));
  }
  if (filters.dateFrom) {
    conditions.push(gte(aiUsageLog.createdAt, new Date(filters.dateFrom)));
  }
  if (filters.dateTo) {
    conditions.push(lte(aiUsageLog.createdAt, new Date(filters.dateTo + 'T23:59:59Z')));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [countResult]] = await Promise.all([
    dbClient
      .select()
      .from(aiUsageLog)
      .where(where)
      .orderBy(desc(aiUsageLog.createdAt))
      .limit(pageSize)
      .offset(offset),
    dbClient
      .select({ total: count() })
      .from(aiUsageLog)
      .where(where),
  ]);

  return {
    rows,
    total: countResult?.total ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((countResult?.total ?? 0) / pageSize),
  };
}

export async function fetchFilterOptions() {
  const [models, operations] = await Promise.all([
    getActiveModels(),
    dbClient.select().from(operationConfig),
  ]);

  return {
    models: models.map((m) => ({ id: m.modelId, label: m.label })),
    operations: operations.map((o) => ({
      type: o.operationType,
      label: o.label,
    })),
  };
}
