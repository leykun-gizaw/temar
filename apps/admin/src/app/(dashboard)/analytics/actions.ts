'use server';

import {
  dbClient,
  aiUsageLog,
  aiModel,
  eq,
  count,
  desc,
  sql,
} from '@temar/db-client';

export async function fetchAnalyticsSummary() {
  const [totalRequests] = await dbClient
    .select({ total: count() })
    .from(aiUsageLog);

  const [totalCost] = await dbClient
    .select({ total: sql<string>`sum(${aiUsageLog.computedCostUsd})` })
    .from(aiUsageLog);

  const [totalInputTokens] = await dbClient
    .select({ total: sql<string>`sum(${aiUsageLog.inputTokens})` })
    .from(aiUsageLog);

  const [totalOutputTokens] = await dbClient
    .select({ total: sql<string>`sum(${aiUsageLog.outputTokens})` })
    .from(aiUsageLog);

  const [uniqueUsers] = await dbClient
    .select({ total: sql<number>`count(distinct ${aiUsageLog.userId})` })
    .from(aiUsageLog);

  const [totalPasses] = await dbClient
    .select({ total: sql<string>`sum(${aiUsageLog.amountChargedUsd})` })
    .from(aiUsageLog);

  return {
    totalRequests: totalRequests?.total ?? 0,
    totalCostUsd: parseFloat(String(totalCost?.total ?? '0')),
    totalInputTokens: parseInt(String(totalInputTokens?.total ?? '0'), 10),
    totalOutputTokens: parseInt(String(totalOutputTokens?.total ?? '0'), 10),
    uniqueUsers: Number(uniqueUsers?.total ?? 0),
    totalPasses: parseFloat(String(totalPasses?.total ?? '0')),
  };
}

export async function fetchTopModelsByUsage() {
  const rows = await dbClient
    .select({
      modelId: aiUsageLog.modelId,
      requests: count(),
      totalCost: sql<string>`sum(${aiUsageLog.computedCostUsd})`,
    })
    .from(aiUsageLog)
    .groupBy(aiUsageLog.modelId)
    .orderBy(desc(count()))
    .limit(10);

  return rows.map((r) => ({
    modelId: r.modelId,
    requests: r.requests,
    totalCost: parseFloat(String(r.totalCost ?? '0')),
  }));
}

export async function fetchTopOperationsByUsage() {
  const rows = await dbClient
    .select({
      operationType: aiUsageLog.operationType,
      requests: count(),
      totalCost: sql<string>`sum(${aiUsageLog.computedCostUsd})`,
    })
    .from(aiUsageLog)
    .groupBy(aiUsageLog.operationType)
    .orderBy(desc(count()))
    .limit(10);

  return rows.map((r) => ({
    operationType: r.operationType,
    requests: r.requests,
    totalCost: parseFloat(String(r.totalCost ?? '0')),
  }));
}

export async function fetchTopUsersByUsage() {
  const rows = await dbClient
    .select({
      userId: aiUsageLog.userId,
      requests: count(),
      totalCost: sql<string>`sum(${aiUsageLog.computedCostUsd})`,
      totalPasses: sql<string>`sum(${aiUsageLog.amountChargedUsd})`,
    })
    .from(aiUsageLog)
    .groupBy(aiUsageLog.userId)
    .orderBy(desc(count()))
    .limit(10);

  return rows.map((r) => ({
    userId: r.userId,
    requests: r.requests,
    totalCost: parseFloat(String(r.totalCost ?? '0')),
    totalPasses: parseFloat(String(r.totalPasses ?? '0')),
  }));
}

export async function fetchModelCount() {
  const [active] = await dbClient
    .select({ total: count() })
    .from(aiModel)
    .where(eq(aiModel.isActive, true));

  const [all] = await dbClient.select({ total: count() }).from(aiModel);

  return {
    active: active?.total ?? 0,
    total: all?.total ?? 0,
  };
}
