# Pass-Based Billing

## 1. Cost Computation Formula

```mermaid
flowchart TD
    Input["Input Tokens & Output Tokens\n(from LLM response)"]
    ModelPricing["Active Model Pricing\n(ai_model_pricing table)"]
    Markup["Active Markup Factor\n(ai_markup_config table)"]

    Input --> ComputeInput["inputCostUsd =\ninputTokens / 1,000,000\n* inputPricePer1M"]
    Input --> ComputeOutput["outputCostUsd =\noutputTokens / 1,000,000\n* outputPricePer1M"]
    ModelPricing --> ComputeInput
    ModelPricing --> ComputeOutput

    ComputeInput --> BaseCost["baseCostUsd =\ninputCostUsd + outputCostUsd"]
    ComputeOutput --> BaseCost

    BaseCost --> ApplyMarkup["computedCostUsd =\nbaseCostUsd * markupFactor"]
    Markup --> ApplyMarkup

    ApplyMarkup --> Deduct["passesToDeduct = computedCostUsd\n(balance is stored in USD)"]

    style Deduct fill:#fef3c7,stroke:#d97706

    Note["NOTE: pass_balance.balanceUsd stores USD directly.\ngetCostPerPassUsd() from env (default $0.05)\nis used for display conversion only."]
    style Note fill:#f0f9ff,stroke:#3b82f6
```

## 2. checkPassAvailability Flow

The pre-check is intentionally simple — no cost estimation. Actual costs are deducted after LLM calls via `recordUsage()`.

```mermaid
flowchart TD
    Start(["checkPassAvailability(operationType)"])

    Start --> BYOK{"Is BYOK enabled\nAND user has\nAPI key?"}

    BYOK -->|Yes| ReturnOK0["Return OK\npassToDeduct = 0\nisByok = true"]
    style ReturnOK0 fill:#d1fae5,stroke:#059669

    BYOK -->|No| FetchBalance["Fetch passBalance.balanceUsd\nfrom DB"]

    FetchBalance --> CheckBalance{"balanceUsd > 0?"}

    CheckBalance -->|Yes| ReturnOK["Return OK\npassToDeduct = 0\nisByok = false"]
    style ReturnOK fill:#d1fae5,stroke:#059669

    CheckBalance -->|No| ReturnInsufficient["Return insufficient_pass\n{ balance: 0, required: 1 }"]
    style ReturnInsufficient fill:#fee2e2,stroke:#dc2626
```

## 3. recordUsage Flow

```mermaid
sequenceDiagram
    participant Caller as Caller (pricing-service)
    participant Cache as In-Memory Cache
    participant DB as PostgreSQL

    Caller->>Cache: getActivePricing(modelId)
    alt Cache hit (< 60s TTL)
        Cache-->>Caller: cached pricing row
    else Cache miss
        Cache->>DB: SELECT * FROM ai_model_pricing<br/>WHERE modelId = ? AND effectiveTo IS NULL
        DB-->>Cache: active pricing row
        Cache-->>Caller: pricing row (now cached)
    end

    Caller->>Cache: getActiveMarkup(modelId)
    alt Cache hit (< 60s TTL)
        Cache-->>Caller: cached markup row
    else Cache miss
        Cache->>DB: SELECT * FROM ai_markup_config<br/>WHERE modelId = ? AND effectiveTo IS NULL
        DB-->>Cache: active markup row
        Cache-->>Caller: markup row (now cached)
    end

    Caller->>Caller: Compute actual costs from<br/>real token counts:<br/>computedCostUsd = (input + output) * markup

    Caller->>DB: BEGIN TRANSACTION

    Caller->>DB: INSERT ai_usage_log<br/>(userId, modelId, operationType,<br/>inputTokens, outputTokens,<br/>pricingSnapshot, markupSnapshot,<br/>computedCostUsd, amountChargedUsd, isByok)

    alt NOT BYOK
        Caller->>DB: UPDATE pass_balance<br/>SET balanceUsd = GREATEST(0, balanceUsd - amountChargedUsd)<br/>WHERE userId = ?
    end

    Caller->>DB: COMMIT

    DB-->>Caller: { amountChargedUsd, newBalance }
```

## 4. Pricing Cache Architecture

```mermaid
flowchart TD
    subgraph PricingService ["pricing-service (in-memory)"]
        PC["pricingCache\nMap&lt;modelId, {data, timestamp}&gt;"]
        MC["markupCache\nMap&lt;modelId, {data, timestamp}&gt;"]
        TTL["TTL: 60 seconds per entry"]
    end

    Request(["getActivePricing(modelId)\nor getActiveMarkup(modelId)"])

    Request --> CheckCache{"Entry exists in cache\nAND age < 60s?"}

    CheckCache -->|Hit| ReturnCached["Return cached data"]
    style ReturnCached fill:#d1fae5,stroke:#059669

    CheckCache -->|Miss| QueryDB["Query DB for active row\nWHERE effectiveTo IS NULL"]
    QueryDB --> StoreCache["Store in cache with\ncurrent timestamp"]
    StoreCache --> ReturnFresh["Return fresh data"]

    subgraph AdminUpdate ["Admin Price/Markup Update"]
        direction TB
        CloseActive["Close active row:\nSET effectiveTo = now()"]
        InsertNew["Insert new row:\neffectiveFrom = now(),\neffectiveTo = NULL"]
        Invalidate["Cache auto-expires\nafter 60s TTL"]

        CloseActive --> InsertNew --> Invalidate
    end

    style AdminUpdate fill:#f0f9ff,stroke:#3b82f6
```

---

## Key Source Files

| File | Purpose |
|------|---------|
| `apps/web/src/lib/actions/pass.ts` | checkPassAvailability, getPassBalance, creditPass |
| `libs/pricing-service/src/lib/pricing-service.ts` | recordUsage, getActivePricing, getActiveMarkup, cache |
| `libs/db-client/src/lib/ai-pricing-queries.ts` | queryActivePricing, queryActiveMarkup, insertUsageLog, decrementUserPassBalance |
| `libs/db-client/src/schema/pass-schema.ts` | pass_balance, pass_transaction |
| `libs/db-client/src/schema/ai-pricing-schema.ts` | ai_model_pricing, ai_markup_config, ai_usage_log, operation_configs |
