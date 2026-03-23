# 10 -- AI Provider Routing

How the platform resolves which LLM provider, model, and API key to use for
question generation and answer analysis, and how those choices propagate from
the web app through the microservice chain.

---

## 1. Provider Resolution Chain

Both `question-gen-service` and `answer-analysis-service` share an identical
`resolveModel()` method in their respective `LlmService` classes. The logic
below applies to both.

```mermaid
flowchart TD
    START([resolveModel called]) --> P1{x-ai-provider<br/>header present?}
    P1 -- yes --> PROV[provider = header value]
    P1 -- no --> P2{AI_PROVIDER<br/>env var set?}
    P2 -- yes --> PROV2[provider = env var]
    P2 -- no --> PROV3["provider = 'google' (default)"]

    PROV --> MODEL_RES
    PROV2 --> MODEL_RES
    PROV3 --> MODEL_RES

    MODEL_RES([Resolve model]) --> M1{x-ai-model<br/>header present?}
    M1 -- yes --> MID[pricingModelId = header value]
    M1 -- no --> M2{AI_MODEL<br/>env var set?}
    M2 -- yes --> MID2[pricingModelId = env var]
    M2 -- no --> MID3["pricingModelId = DEFAULT_MODEL_ID<br/>('gemini-3-flash')"]

    MID --> DBLOOKUP
    MID2 --> DBLOOKUP
    MID3 --> DBLOOKUP

    DBLOOKUP[/"queryProviderModelId(pricingModelId)<br/>DB lookup: ai_models table"/] --> DBRESULT{providerModelId<br/>found in DB?}
    DBRESULT -- yes --> PMID[providerModelId = DB value]
    DBRESULT -- no --> PMID2[providerModelId = pricingModelId as-is]

    PMID --> BYOK_CHECK
    PMID2 --> BYOK_CHECK

    BYOK_CHECK{User supplied<br/>own API key?} -- yes --> BYOK_MODEL{providerModelId<br/>resolved?}
    BYOK_MODEL -- yes --> SDK_ID[sdkModelId = providerModelId]
    BYOK_MODEL -- no --> FALLBACK[/"sdkModelId = BYOK_FALLBACK_MODELS[provider]"/]
    BYOK_CHECK -- no --> SDK_ID2[sdkModelId = providerModelId]

    SDK_ID --> FACTORY
    FALLBACK --> FACTORY
    SDK_ID2 --> FACTORY

    FACTORY([SDK Factory Selection]) --> F1{provider?}
    F1 -- google --> G["createGoogleGenerativeAI({ apiKey })"]
    F1 -- openai --> O["createOpenAI({ apiKey })"]
    F1 -- anthropic --> A["createAnthropic({ apiKey })"]
    F1 -- deepseek --> D["createDeepSeek({ apiKey })"]

    G --> RETURN["Return { model: sdk(sdkModelId), pricingModelId }"]
    O --> RETURN
    A --> RETURN
    D --> RETURN

    style START fill:#f5f5f5,stroke:#333
    style RETURN fill:#d4edda,stroke:#28a745
    style DBLOOKUP fill:#fff3cd,stroke:#856404
    style FACTORY fill:#f5f5f5,stroke:#333
    style MODEL_RES fill:#f5f5f5,stroke:#333
```

### BYOK Fallback Models

When a user provides their own API key (`x-ai-api-key` header) but no explicit
model was resolved from the DB, the service falls back to a sensible default
per provider:

| Provider    | Fallback Model               |
|-------------|------------------------------|
| `google`    | `gemini-2.0-flash`           |
| `openai`    | `gpt-4o-mini`                |
| `anthropic` | `claude-sonnet-4-20250514`   |
| `deepseek`  | `deepseek-chat`              |

### SDK Factory Selection

Each provider maps to a dedicated `@ai-sdk/*` package constructor. Notably,
DeepSeek uses its own `@ai-sdk/deepseek` package (`createDeepSeek`) rather than
`createOpenAI` with a custom `baseURL` -- the latter was broken in AI SDK v5.

---

## 2. Header Propagation Chain

The full journey of AI configuration from user preferences in the database to
the final LLM API call.

```mermaid
sequenceDiagram
    participant DB as PostgreSQL<br/>(user table)
    participant Web as Next.js Web App<br/>(Server Actions)
    participant FSRS as FSRS Service<br/>(:3334)
    participant QGen as Question-Gen Service<br/>(:3335)
    participant Analysis as Answer-Analysis Service<br/>(:3336)
    participant LLM as LLM Provider API<br/>(Google / OpenAI / etc.)

    Note over Web,DB: Step 1: Read user preferences

    Web->>DB: getAiSettings()<br/>SELECT aiProvider, aiModel,<br/>aiApiKeyEncrypted, useByok
    DB-->>Web: { provider, model, hasApiKey, useByok }

    Web->>DB: getUserAiConfig()<br/>(only if useByok=true && hasApiKey)
    DB-->>Web: { aiApiKeyEncrypted }
    Note over Web: decrypt(aiApiKeyEncrypted)<br/>AES-256-GCM via<br/>TOKEN_ENCRYPTION_KEY

    Note over Web: Step 2: Build headers (getAiHeaders)

    Note over Web: x-ai-provider = config?.provider || settings.provider<br/>x-ai-model = config?.model || settings.model || DEFAULT_MODEL_ID<br/>x-ai-api-key = config?.apiKey (only if BYOK)<br/>x-byok = 'true' / 'false'

    alt Question Generation (track/regenerate)
        Note over Web,FSRS: Step 3a: Web -> FSRS -> QGen

        Web->>FSRS: POST /api/track/chunk/:id<br/>+ x-ai-provider, x-ai-model,<br/>x-ai-api-key, x-byok, x-user-id
        Note over FSRS: Extracts headers into aiConfig object,<br/>forwards SAME headers to question-gen

        FSRS->>QGen: POST /api/generate/:chunkId<br/>+ x-ai-provider, x-ai-model,<br/>x-ai-api-key, x-byok, x-user-id
        Note over QGen: extractAiConfig() from headers<br/>-> resolveModel(aiConfig)

        QGen->>LLM: generateText({ model, system, prompt })
        LLM-->>QGen: { questions, usage }
        QGen-->>FSRS: { questions, usage, modelId }
        FSRS-->>Web: { success, newBalance }

    else Answer Analysis
        Note over Web,Analysis: Step 3b: Web -> Analysis (direct)

        Web->>Analysis: POST /api/analyze<br/>+ x-ai-provider, x-ai-model,<br/>x-ai-api-key, x-byok, x-user-id
        Note over Analysis: extractAiConfig() from headers<br/>-> resolveModel(aiConfig)

        Analysis->>LLM: generateText({ model, system, prompt })
        LLM-->>Analysis: { analysis, usage }
        Analysis-->>Web: { scorePercent, strengths, weaknesses, ... }
    end
```

### Key Points

- **Provider fallback**: `getAiHeaders()` uses `config?.provider || settings.provider`,
  meaning even when BYOK is off, the user's selected provider preference (from
  settings) is still sent. This allows non-BYOK users to choose a provider while
  using platform-managed API keys.

- **Model always sent**: `x-ai-model` always has a value (falls back to
  `DEFAULT_MODEL_ID = 'gemini-3-flash'`), ensuring services can always record
  usage against a known pricing model.

- **API key only when BYOK**: `getUserAiConfig()` returns `undefined` entirely
  when `useByok` is false or no encrypted key exists. The `x-ai-api-key` header
  is only set when a decrypted key is available.

- **FSRS is a pass-through**: The FSRS service does not interpret AI config; it
  extracts headers into an `aiConfig` object and forwards them identically when
  calling question-gen-service.

---

## 3. Dual Model ID System (pricingModelId vs providerModelId)

The platform maintains two distinct model identifiers to decouple billing from
provider API details.

```mermaid
flowchart LR
    subgraph "Our Internal System"
        PID["pricingModelId<br/><i>e.g. 'gemini-3-flash'</i>"]
        PRICING[("ai_model_pricing table<br/>inputPricePer1M<br/>outputPricePer1M")]
        MARKUP[("ai_markup_config table<br/>markupFactor")]
        USAGE[("ai_usage_log table<br/>modelId = pricingModelId")]
    end

    subgraph "ai_models table"
        AIMTBL["id = pricingModelId<br/>providerModelId (nullable)<br/>provider<br/>displayName<br/>isActive"]
    end

    subgraph "Provider API"
        PROVID["providerModelId<br/><i>e.g. 'gemini-2.0-flash-001'</i>"]
        API["LLM API Call<br/>model = providerModelId"]
    end

    PID -->|"lookup"| AIMTBL
    AIMTBL -->|"providerModelId set?"| DECISION{providerModelId<br/>exists?}
    DECISION -- yes --> PROVID
    DECISION -- "no (null)" --> FALLBACK_PID["Use pricingModelId<br/>as providerModelId"]
    FALLBACK_PID --> API
    PROVID --> API

    PID -->|"cost lookup"| PRICING
    PID -->|"markup lookup"| MARKUP
    PID -->|"recorded as"| USAGE

    style PID fill:#cce5ff,stroke:#004085
    style PROVID fill:#d4edda,stroke:#155724
    style AIMTBL fill:#fff3cd,stroke:#856404
    style DECISION fill:#f8d7da,stroke:#721c24
```

### Why Two IDs?

| Concept | `pricingModelId` | `providerModelId` |
|---|---|---|
| **Purpose** | Internal billing and cost tracking | Actual model name sent to provider API |
| **Example** | `gemini-3-flash` | `gemini-2.0-flash-001` |
| **Stored in** | `ai_usage_log.modelId`, headers, settings | `ai_models.providerModelId` |
| **Stability** | Stable across provider version bumps | Changes when provider releases new versions |
| **Lookup** | Direct (it IS the primary key) | `queryProviderModelId()` DB lookup |

This separation allows the platform to:

1. **Bump provider model versions** (e.g., `gemini-2.0-flash-001` ->
   `gemini-2.0-flash-002`) by updating a single `ai_models` row, without
   changing any pricing records or usage logs.

2. **Keep billing stable** -- all cost calculations reference `pricingModelId`,
   so provider-side version changes do not affect user billing.

3. **Fall back gracefully** -- when no `providerModelId` override is set, the
   `pricingModelId` is used directly as the API model name (works when they
   happen to match).

---

## Key Source Files

| File | Role |
|---|---|
| `apps/question-gen-service/src/app/services/llm.service.ts` | `resolveModel()`, BYOK fallbacks, SDK factory selection |
| `apps/answer-analysis-service/src/app/services/llm.service.ts` | Identical `resolveModel()` for answer analysis |
| `apps/web/src/lib/actions/tracking.ts` | `getAiHeaders()` for question-gen calls via FSRS |
| `apps/web/src/lib/actions/analysis.ts` | `getAiHeaders()` for answer-analysis calls |
| `apps/web/src/lib/actions/ai-settings.ts` | `getAiSettings()`, `getUserAiConfig()` (crypto decrypt) |
| `apps/fsrs-service/src/app/services/recall-item.service.ts` | `callQuestionGenService()` -- header forwarding |
| `apps/fsrs-service/src/app/controllers/tracking.controller.ts` | Header extraction from inbound requests |
| `libs/db-client/src/lib/ai-pricing-queries.ts` | `queryProviderModelId()` DB lookup |
| `libs/db-client/src/lib/crypto.ts` | AES-256-GCM `encrypt()`/`decrypt()` for API keys |
| `libs/shared-types/src/lib/ai-pricing-types.ts` | `DEFAULT_MODEL_ID = 'gemini-3-flash'` |
