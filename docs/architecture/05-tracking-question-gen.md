# Tracking & Question Generation Flow

This document covers the full lifecycle of tracking chunks for spaced repetition, generating questions via LLM, cascade operations, and regeneration with performance-aware prompting.

---

## 1. Main Tracking Flow

When a user clicks "Track" on a chunk in the Materials Browser, the following chain executes synchronously across three services.

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant W as Web App<br/>(Server Action)
    participant DB as PostgreSQL
    participant F as FSRS Service
    participant Q as Question-Gen Service
    participant LLM as LLM Provider<br/>(Google/OpenAI/Anthropic/DeepSeek)
    participant P as Pricing Service

    U->>W: trackChunk(chunkId, noteId, topicId)

    Note over W: Authentication & Pass Check
    W->>W: getLoggedInUser()
    W->>DB: SELECT contentMd FROM chunk WHERE id = chunkId
    DB-->>W: chunkRow.contentMd

    W->>W: passCheckForGeneration(inputText)
    W->>W: getUserAiConfig() + getAiSettings()
    Note over W: Resolve provider, modelId, isByok
    W->>DB: checkPassAvailability(operation, modelId, inputText, provider)
    Note over W: Estimate tokens, compute USD cost,<br/>check pass_balance >= requiredUsdCost
    DB-->>W: balanceUsd

    alt Insufficient pass balance
        W-->>U: { status: 'insufficient_pass', balance, required }
    end

    Note over W: Build AI Headers
    W->>W: getAiHeaders()
    Note over W: x-ai-provider, x-ai-model,<br/>x-ai-api-key, x-byok

    W->>F: POST /api/track/chunk/{chunkId}<br/>Headers: x-user-id, x-ai-provider,<br/>x-ai-model, x-ai-api-key, x-byok

    Note over F: RecallItemService.trackChunk()
    F->>DB: SELECT chunk_tracking WHERE<br/>chunkId + userId
    DB-->>F: existing row?

    alt Existing row with status='untracked'
        F->>DB: UPDATE chunk_tracking SET status='ready'
        F-->>W: { tracked: true, reactivated: true }
        W-->>U: { status: 'success' }
    else Already tracked (non-untracked status)
        F-->>W: { tracked: false, reason: 'already_tracked' }
    else No existing row
        F->>DB: INSERT chunk_tracking (status='pending')
        DB-->>F: trackingId

        Note over F: triggerQuestionGen()
        F->>Q: POST /api/generate/{chunkId}<br/>Headers: x-user-id, AI headers<br/>Body: { questionTypes?, questionCount? }

        Note over Q: QuestionGenerationService.generateForChunk()
        Q->>DB: UPDATE chunk_tracking SET status='generating'

        Q->>DB: SELECT chunk + note + topic content
        DB-->>Q: chunkRow (contentMd, description, contentJson)
        Note over Q: content = contentMd || description || JSON.stringify(contentJson)

        alt Empty content
            Q->>DB: UPDATE chunk_tracking SET status='failed',<br/>errorMessage='No content available'
            Q-->>F: { error: 'No content available' }
        end

        Note over Q: LLM Call with Exponential Backoff<br/>(5 retries, 5s base, 2^n * base + jitter)
        loop Per question type (round-robin distribution)
            Q->>Q: buildSystemPrompt(type, count)
            Q->>LLM: generateText({ model, schema, system, prompt })
            LLM-->>Q: { questions[], usage }
        end
        Note over Q: Promise.all() — parallel calls per type

        alt LLM returns questions
            Q->>Q: createEmptyCard() via ts-fsrs
            Q->>DB: INSERT recall_item[] (FSRS empty cards)<br/>with questionTitle, questionText, answerRubric,<br/>questionType, generationBatchId
            Q->>DB: UPDATE chunk_tracking SET status='ready'

            Q->>P: recordUsage({ userId, modelId,<br/>operationType: 'question_generation',<br/>inputTokens, outputTokens, isByok })
            Note over P: Atomic: INSERT ai_usage_log<br/>+ decrement pass_balance
            P-->>Q: { amountChargedUsd, newBalance }

            Q-->>F: { chunkId, batchId, questionsGenerated,<br/>recallItemIds, usage, newBalance }
        else LLM returns 0 questions
            Q->>DB: UPDATE chunk_tracking SET status='failed',<br/>errorMessage='LLM returned no questions'
            Q-->>F: { error: 'No questions generated' }
        else LLM error after all retries
            Q->>DB: UPDATE chunk_tracking SET status='failed',<br/>errorMessage (truncated to 500 chars)
            Q-->>F: throws error
        end

        F-->>W: { tracked: true, status, newBalance }
    end

    W->>W: revalidatePath('/dashboard', '/dashboard/materials')
    W-->>U: { status: 'success', data, newBalance (in passes) }
```

---

## 2. Cascade Operations

Topic and note tracking fan out to individual chunk tracking calls sequentially.

```mermaid
flowchart TD
    TT["trackTopic(topicId)"] --> CN["Query: SELECT notes<br/>WHERE topicId AND userId"]
    CN --> LN{"For each note<br/>(sequential)"}
    LN --> TN["trackNote(noteId)"]

    TN --> CC["Query: SELECT chunks<br/>WHERE noteId AND userId"]
    CC --> LC{"For each chunk<br/>(sequential)"}
    LC --> TC["trackChunk(chunkId)"]

    TC --> CHK{"chunk_tracking<br/>exists?"}

    CHK -->|"status = 'untracked'"| RA["Reactivate:<br/>SET status = 'ready'<br/>(preserves FSRS state)"]
    CHK -->|"other status"| SK["Skip:<br/>already_tracked"]
    CHK -->|"no row"| NEW["Insert chunk_tracking<br/>status = 'pending'"]

    NEW --> QG["triggerQuestionGen()"]
    QG --> QGEN["Question-Gen Service<br/>generateForChunk()"]

    style TT fill:#4a5568,color:#fff
    style TN fill:#4a5568,color:#fff
    style TC fill:#4a5568,color:#fff
    style QGEN fill:#2d3748,color:#fff

    subgraph "Web App (Server Action)"
        TT
    end

    subgraph "FSRS Service"
        CN
        LN
        TN
        CC
        LC
        TC
        CHK
        RA
        SK
        NEW
        QG
    end

    subgraph "Question-Gen Service"
        QGEN
    end
```

### Pass pre-check at the web layer

Before cascade operations reach the FSRS service, the web app counts **only untracked chunks** (via `getCascadeInfo()`) and estimates the pass cost for those. Already-tracked chunks are excluded from the cost estimate.

```mermaid
flowchart LR
    A["trackTopic(topicId)"] --> B["getCascadeInfo('topic', topicId)<br/>LEFT JOIN chunk_tracking"]
    B --> C{"untracked == 0?"}
    C -->|Yes| G["Return success:<br/>'All chunks already tracked'"]
    C -->|No| D["passCheckForGeneration('', untracked)"]
    D --> E{"passToDeduct * untracked<br/><= balance?"}
    E -->|Yes| F["Proceed to FSRS service"]
    E -->|No| H["Return insufficient_pass<br/>required * untracked"]

    style C fill:#744210,color:#fff
    style E fill:#744210,color:#fff
```

### Per-chunk tracking mode

When cascade tracking a topic or note, the UI offers two modes:

- **Same for all** (default): A single set of question types and count is applied to all new chunks via the cascade endpoint (`trackTopic`/`trackNote`).
- **Per chunk**: The user configures question types and count individually for each untracked chunk. The web app calls `trackChunksBatch()`, which tracks each chunk individually via separate `POST /api/track/chunk/{chunkId}` calls with per-chunk `questionTypes` and `questionCount`.

Already-tracked chunks are shown in the UI with an emerald indicator and are always skipped — they retain their existing question types and FSRS state.

---

## 3. Tracking Status Lifecycle

The `chunk_tracking.status` column governs the generation pipeline state machine.

```mermaid
stateDiagram-v2
    [*] --> pending : INSERT chunk_tracking

    pending --> generating : Question-gen service picks up chunk<br/>(SET status='generating', lastAttemptAt=now)

    generating --> ready : Questions generated successfully<br/>(recall_items inserted, errorMessage cleared)
    generating --> failed : Generation error<br/>(errorMessage set, retryCount++)

    failed --> pending : Retry triggered<br/>(errorMessage cleared)

    ready --> pending : Regeneration triggered<br/>(old recall_items archived + deleted,<br/>errorMessage cleared)

    pending --> untracked : User untracks
    generating --> untracked : User untracks
    ready --> untracked : User untracks
    failed --> untracked : User untracks

    untracked --> ready : User re-tracks<br/>(reactivated, FSRS state preserved)

    note right of untracked : Soft delete only.<br/>recall_item and review_log<br/>rows are preserved.

    note right of failed : errorMessage stores up to<br/>500 chars of the error.<br/>retryCount increments each attempt.

    note right of ready : recall_items exist with<br/>FSRS empty card state.<br/>Chunk is reviewable.
```

---

## 4. Regeneration Flow

When a user regenerates questions for a chunk (e.g., after all questions are retired or content has changed), the system preserves review history as a performance summary to guide the LLM toward the user's weak areas.

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant W as Web App<br/>(Server Action)
    participant F as FSRS Service
    participant DB as PostgreSQL
    participant Q as Question-Gen Service
    participant LLM as LLM Provider
    participant P as Pricing Service

    U->>W: regenerateChunkQuestions(chunkId)

    W->>W: getLoggedInUser()
    W->>DB: SELECT contentMd FROM chunk
    W->>W: passCheckForGeneration(inputText)

    alt Insufficient pass
        W-->>U: { status: 'insufficient_pass' }
    end

    W->>W: getAiHeaders()
    W->>F: POST /api/track/regenerate/{chunkId}<br/>Headers: x-user-id, AI headers

    Note over F: RecallItemService.regenerateChunk()

    rect rgb(60, 60, 80)
        Note over F,DB: Step 1: Build Performance Summary<br/>(BEFORE deleting — review_log cascades on delete)
        F->>DB: SELECT * FROM recall_item<br/>WHERE chunkId AND userId
        DB-->>F: items[]
        F->>DB: SELECT * FROM review_log<br/>WHERE recallItemId IN (itemIds)
        DB-->>F: logs[]

        Note over F: Compute per-question breakdown:<br/>- Rating distribution (Again/Hard/Good/Easy)<br/>- Knowledge level (STRONG/MODERATE/DEVELOPING/WEAK)<br/>- Good+Easy ratio, total lapses<br/>- Per-question: ratings, reps, lapses, stability<br/>- Strengths & weaknesses from analysisJson
    end

    rect rgb(80, 50, 50)
        Note over F,DB: Step 2: Archive & Delete Old Items
        F->>DB: INSERT INTO recall_item_archive<br/>(...oldItems, retiredAt=now)
        F->>DB: DELETE FROM recall_item<br/>WHERE chunkId AND userId
        Note over DB: CASCADE: review_log rows deleted
    end

    rect rgb(50, 70, 50)
        Note over F,DB: Step 3: Reset Tracking & Trigger Generation
        F->>DB: UPDATE chunk_tracking<br/>SET status='pending', errorMessage=null
        F->>Q: POST /api/generate/{chunkId}<br/>Body: { performanceSummary }
    end

    Note over Q: generateForChunk() with performanceSummary

    Q->>DB: UPDATE chunk_tracking SET status='generating'
    Q->>DB: SELECT chunk content
    Q->>Q: buildSystemPrompt() + performance context

    Note over Q: System prompt appends:<br/>"## Previous Performance Context"<br/>- WEAK → foundational questions<br/>- MODERATE → deeper connections<br/>- STRONG → synthesis & edge cases<br/>- Target identified GAPS<br/>- Avoid mastered questions<br/>- Vary angles from previous round

    Q->>LLM: generateText({ system: prompt + perfContext,<br/>prompt: content + performanceSummary })
    LLM-->>Q: { questions[], usage }

    Q->>DB: INSERT new recall_item[] (fresh FSRS cards)
    Q->>DB: UPDATE chunk_tracking SET status='ready'
    Q->>P: recordUsage()
    P-->>Q: { newBalance }
    Q-->>F: { chunkId, status, newBalance }
    F-->>W: { chunkId, status, newBalance }
    W-->>U: { status: 'success', newBalance (in passes) }
```

### Performance Summary Structure

The `buildPerformanceSummary()` method produces a structured text block passed to the LLM:

```
## User Performance Summary
Overall knowledge level: MODERATE
Total reviews: 14 | Rating distribution: Again=2, Hard=3, Good=7, Easy=2
Total lapses: 3 | Good+Easy ratio: 64%

### Per-Question Breakdown
- Q: "Explain Variable Declaration" | Ratings: [Good, Hard, Good] | Reps: 3, Lapses: 0, Stability: 12.5d
  Strengths: Understands basic syntax; Provides examples
  Weaknesses: Misses scope rules
- Q: "Compare let vs const" | Ratings: [Again, Hard, Good] | Reps: 3, Lapses: 1, Stability: 4.2d
  Weaknesses: Confuses block vs function scope; Omits temporal dead zone
```

Knowledge level thresholds:
- **STRONG**: Good+Easy ratio >= 80% AND total lapses <= 1
- **MODERATE**: Good+Easy ratio >= 60%
- **DEVELOPING**: Good+Easy ratio >= 35%
- **WEAK**: Good+Easy ratio < 35%

---

## 5. LLM Provider Resolution

The `LlmService.resolveModel()` method maps user configuration to a concrete AI SDK model instance.

```mermaid
flowchart TD
    A["resolveModel(aiConfig?)"] --> B{"provider =<br/>config.provider ||<br/>env.AI_PROVIDER ||<br/>'google'"}

    B --> C["pricingModelId =<br/>config.model || env.AI_MODEL || DEFAULT_MODEL_ID"]
    C --> D["providerModelId =<br/>queryProviderModelId(pricingModelId)<br/>(DB lookup: ai_models table)"]

    D --> E{"Provider?"}

    E -->|google| G["createGoogleGenerativeAI()"]
    E -->|openai| H["createOpenAI()"]
    E -->|anthropic| I["createAnthropic()"]
    E -->|deepseek| J["createDeepSeek()"]

    G --> K{"BYOK?<br/>(has apiKey)"}
    H --> K
    I --> K
    J --> K

    K -->|Yes| L["Use providerModelId || BYOK_FALLBACK_MODELS[provider]<br/>google: gemini-2.0-flash<br/>openai: gpt-4o-mini<br/>anthropic: claude-sonnet-4-20250514<br/>deepseek: deepseek-chat"]
    K -->|No| M["Use providerModelId from DB"]

    L --> N["Return { model, pricingModelId }"]
    M --> N

    style A fill:#4a5568,color:#fff
    style N fill:#2d3748,color:#fff
```

---

## 6. Question Type Schema (Structured Output)

The LLM uses `z.discriminatedUnion` on the `type` field to produce type-safe rubrics. Per-type schemas lock each LLM call to a single question type.

```mermaid
flowchart TD
    QT["Requested types:<br/>e.g. ['open_ended', 'mcq']"] --> DIST["Round-robin distribution<br/>count=4 → 2x open_ended, 2x mcq"]

    DIST --> PAR["Parallel LLM calls<br/>(Promise.all)"]

    PAR --> OE["Call 1: open_ended schema<br/>typeSchemasMap['open_ended']"]
    PAR --> MCQ["Call 2: mcq schema<br/>typeSchemasMap['mcq']"]

    OE --> OER["Rubric: { type: 'open_ended',<br/>sections[], criteria[], keyPoints[] }"]
    MCQ --> MCQR["Rubric: { type: 'mcq',<br/>choices[{label,text}],<br/>correctAnswer, explanation,<br/>keyPoints[] }"]

    OER --> MERGE["Merge: flatMap all questions"]
    MCQR --> MERGE

    MERGE --> SUM["Sum token usage across calls"]
    SUM --> RET["Return { questions[], usage, modelId }"]

    style PAR fill:#4a5568,color:#fff
    style MERGE fill:#2d3748,color:#fff
```

**Question types:**

| Type | Rubric Fields | Notes |
|------|--------------|-------|
| `open_ended` | `sections`, `criteria` (visible), `keyPoints` (hidden) | criteria must NOT reveal answers |
| `mcq` | `choices` (4x A-D), `correctAnswer`, `explanation`, `keyPoints` | explanation hidden until after answering |
| `leetcode` | `functionPrototype`, `examples` (2-3), `constraints`, `keyPoints` | LeetCode-style coding problems |

---

## Key Source Files

| File | Purpose |
|------|---------|
| `apps/web/src/lib/actions/tracking.ts` | Server actions: trackChunk/Note/Topic, trackChunksBatch, getCascadeInfo, untrack, regenerate |
| `apps/web/src/components/tracking-button.tsx` | TrackingButton UI with cascade info, batch/per-chunk mode toggle |
| `apps/web/src/lib/actions/pass.ts` | checkPassAvailability, balance queries |
| `apps/web/src/lib/actions/ai-settings.ts` | getAiHeaders, getUserAiConfig |
| `apps/fsrs-service/src/app/services/recall-item.service.ts` | trackChunk, cascades, regenerateChunk, buildPerformanceSummary |
| `apps/question-gen-service/src/app/services/question-generation.service.ts` | generateForChunk, retry logic, batch generation |
| `apps/question-gen-service/src/app/services/llm.service.ts` | resolveModel, buildSystemPrompt, generateQuestions, structured output schemas |
| `libs/pricing-service/src/lib/pricing-service.ts` | recordUsage (atomic: ai_usage_log + pass_balance decrement) |
