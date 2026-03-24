# Review Session Lifecycle

## Overview

A review session is the core learning loop in Temar. The user sees due items, answers AI-generated questions via a Lexical editor, receives AI-graded feedback, and confirms or overrides the suggested FSRS rating. Each completed review updates the spaced-repetition schedule for the next appearance.

### Key Source Files

| File | Purpose |
|------|---------|
| `apps/web/src/app/dashboard/reviews/_components/review-session.tsx` | ReviewSession component -- ResizablePanel layout for question + answer |
| `apps/web/src/app/dashboard/reviews/_components/reviews-tabs.tsx` | Tab switching ("Due Now" / "All Items") + due item filtering |
| `apps/web/src/lib/actions/analysis.ts` | `analyzeAnswer()` server action |
| `apps/web/src/lib/actions/review.ts` | `submitReview()`, `saveAnswerDraft()` server actions |
| `apps/web/src/lib/fetchers/recall-items.ts` | `getDueRecallItems()`, `getAllRecallItems()` fetchers |
| `apps/answer-analysis-service/src/app/services/answer-analysis.service.ts` | LLM answer evaluation against rubric |
| `apps/answer-analysis-service/src/app/services/llm.service.ts` | LLM provider abstraction for analysis |
| `apps/fsrs-service/src/app/services/review.service.ts` | `submitReview()` -- FSRS state transition + review_log insert |

---

## Full Review Cycle

```mermaid
sequenceDiagram
    actor User as Browser
    participant Page as /dashboard/reviews<br>(Server Component)
    participant FSRS as fsrs-service<br>GET /api/due
    participant DB as PostgreSQL
    participant Tabs as ReviewsTabs<br>(Client Component)
    participant Session as ReviewSession<br>(ResizablePanel)
    participant Editor as Lexical AnswerEditor<br>(Right Panel)
    participant Draft as saveAnswerDraft()<br>(Server Action)
    participant Analyze as analyzeAnswer()<br>(Server Action)
    participant AnalysisSvc as answer-analysis-service<br>POST /api/analyze
    participant LLM as LLM Provider<br>(OpenAI / Anthropic / Google)
    participant Review as submitReview()<br>(Server Action)
    participant FSRSReview as fsrs-service<br>POST /api/recall-items/{id}/review

    %% 1. Load due items
    User->>Page: Navigate to /dashboard/reviews
    Page->>FSRS: getDueRecallItems()<br>via fsrsServiceFetch('due', GET)
    FSRS->>DB: SELECT recall_item<br>JOIN chunk JOIN note JOIN topic<br>JOIN chunk_tracking<br>WHERE due <= now<br>AND tracking.status != 'untracked'
    DB-->>FSRS: due recall items with context
    FSRS-->>Page: dueItems[]

    %% 2. Render tabs
    Page->>Tabs: Render ReviewsTabs<br>with dueItems[]
    Note over Tabs: "Due Now" tab: shows due items for review<br>"All Items" tab: shows all items MINUS due items<br>(prevents answer leakage during active review)
    Tabs-->>User: Display due item list

    %% 3. Select item
    User->>Tabs: Select a due item
    Tabs->>Session: Mount ReviewSession<br>with selected recallItem

    %% 4. Display question
    Note over Session: Left Panel:<br>- Question title<br>- Markdown-rendered question text<br>- Rubric criteria (keyPoints hidden)<br>- Metadata (topic, note, chunk info)

    %% 5. User writes answer
    Note over Session: Right Panel:<br>Lexical AnswerEditor for user input
    User->>Editor: Type answer in rich text editor

    %% 6. Auto-save draft
    Editor->>Draft: saveAnswerDraft(recallItemId, answerJson)
    Draft->>DB: UPDATE recall_item<br>SET answer_draft_json = answerJson<br>WHERE id = recallItemId
    DB-->>Draft: updated
    Draft-->>Editor: Draft saved

    %% 7. Submit for analysis
    User->>Session: Click "Submit Answer"
    Session->>Analyze: analyzeAnswer(recallItemId, answer,<br>questionTitle, questionText, criteria, keyPoints)

    %% 8. Pass availability check
    Analyze->>Analyze: checkPassAvailability('answer_analysis')<br>BYOK? free. Else balance > 0? proceed.
    Analyze->>Analyze: Build AI headers<br>(x-ai-provider, x-ai-model, x-ai-api-key, x-byok)

    %% 9. Call analysis service
    Analyze->>AnalysisSvc: analysisServiceFetch('analyze', POST)<br>{ answer, questionTitle, questionText,<br>criteria, keyPoints }

    %% 10. LLM evaluation
    AnalysisSvc->>AnalysisSvc: AnswerAnalysisService.analyze()
    AnalysisSvc->>LLM: Evaluate answer against rubric<br>(system prompt: fair grading assistant<br>for spaced-repetition)
    LLM-->>AnalysisSvc: LLM response

    %% 11. Score and map to rating
    Note over AnalysisSvc: Parse response:<br>{ scorePercent: 0-100,<br>strengths[], weaknesses[], reasoning }
    Note over AnalysisSvc: Score -> FSRS Rating mapping:<br>0-25% = Again (1)<br>26-55% = Hard (2)<br>56-80% = Good (3)<br>81-100% = Easy (4)
    AnalysisSvc->>AnalysisSvc: recordUsage() for<br>answer_analysis operation
    AnalysisSvc-->>Analyze: { scorePercent, strengths,<br>weaknesses, reasoning, suggestedRating }
    Analyze-->>Session: Analysis result

    %% 12. Display analysis
    Note over Session: ReviewAnalysis component:<br>- Score bar (0-100%)<br>- Strengths list<br>- Weaknesses list<br>- Reasoning explanation
    Session-->>User: Show analysis + 4 rating buttons

    %% 13. User confirms or overrides rating
    User->>Session: Confirm suggested rating<br>OR override (Again / Hard / Good / Easy)

    %% 14. Submit review
    Session->>Review: submitReview(recallItemId, rating,<br>durationMs, answerJson, analysisJson)
    Review->>FSRSReview: fsrsServiceFetch(<br>'recall-items/{id}/review', POST)<br>{ rating, durationMs, answerJson, analysisJson }

    %% 15. FSRS state update
    FSRSReview->>FSRSReview: ReviewService.submitReview():<br>fetch card state<br>-> calculate elapsed_days<br>-> ts-fsrs applyRating
    FSRSReview->>DB: Transaction:<br>UPDATE recall_item (state, due,<br>stability, difficulty, scheduledDays,<br>reps, lapses, learningSteps, lastReview)<br>INSERT review_log (rating, state, due,<br>stability, difficulty, elapsedDays,<br>scheduledDays, durationMs,<br>answerJson, analysisJson)
    DB-->>FSRSReview: committed
    FSRSReview-->>Review: { newDue, state, stability, difficulty }
    Review-->>Session: Review recorded

    %% 16. Next item
    Session-->>User: Navigate to next due item
```

---

## Score-to-Rating Mapping

| Score Range | FSRS Rating | Label | Effect |
|-------------|-------------|-------|--------|
| 0--25% | 1 | Again | Card enters Learning/Relearning, short interval |
| 26--55% | 2 | Hard | Slightly reduced interval growth |
| 56--80% | 3 | Good | Normal interval progression |
| 81--100% | 4 | Easy | Accelerated interval, higher stability |

The user always sees the AI-suggested rating but can override it before submission. The override is what gets sent to the FSRS engine.

---

## Due Item Filtering (Answer Leakage Prevention)

The ReviewsTabs component maintains two views:

- **Due Now**: Items where `due <= now` and `tracking.status != 'untracked'` -- these are actively reviewable.
- **All Items**: All tracked recall items EXCLUDING those currently due. This prevents a user from seeing an item's full details (chunk content, previous answers) in the "All Items" tab while that same item is waiting to be reviewed in "Due Now".

---

## Auto-Save Draft

While the user is writing an answer, the editor periodically calls `saveAnswerDraft()` which writes the current Lexical editor state directly to `recall_item.answer_draft_json`. This allows the user to resume an interrupted review session without losing their in-progress answer.
