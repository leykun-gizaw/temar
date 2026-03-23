# Dashboard Data Pipeline

## 1. Data Fetching Overview

The dashboard overview page runs 9 parallel fetches via `Promise.all`. The `getDashboardStats` call is conditional on having a logged-in user and itself runs 10 internal parallel DB queries.

```mermaid
flowchart LR
    Page["page.tsx\nPromise.all"]

    subgraph Fetchers ["Parallel Fetches"]
        F1["getDueRecallItems\n{limit: 50}"]
        F2["getDueCount()"]
        F3["getAllRecallItems\n{limit: 10, offset: 0}"]
        F4["getAllRecallItems\n{limit: 500}"]
        F5["getTrackingStatus()"]
        F6["getTopicsCount()"]
        F7["getNotesCount()"]
        F8["getChunksCount()"]
        F9["getDashboardStats\n(userId)"]
    end

    subgraph Results ["Resolved Values"]
        R1["dueItems"]
        R2["dueCount"]
        R3["allItemsResult\n(recent 10)"]
        R4["scheduleItemsResult\n(up to 500)"]
        R5["trackedItems"]
        R6["topicsCount"]
        R7["notesCount"]
        R8["chunksCount"]
        R9["dashboardStats\n{growth, consistency}"]
    end

    Page --> F1 --> R1
    Page --> F2 --> R2
    Page --> F3 --> R3
    Page --> F4 --> R4
    Page --> F5 --> R5
    Page --> F6 --> R6
    Page --> F7 --> R7
    Page --> F8 --> R8
    Page --> F9 --> R9
```

## 2. getDashboardStats Internal Queries

The `getDashboardStats` function runs 10 DB queries in a single `Promise.all`, then derives higher-level metrics from the raw results.

```mermaid
flowchart TD
    Entry["getDashboardStats(userId)"]

    subgraph Queries ["10 Parallel DB Queries"]
        Q1["1. Total reviews\ncount(review_log)"]
        Q2["2. Mastery count\nrecall_items where\nstate >= 2"]
        Q3["3. Total recall items\ncount(recall_item)"]
        Q4["4. Average rating\navg(review_log.rating)"]
        Q5["5. Rating distribution\ngroup by rating 1-4"]
        Q6["6. Average stability\navg(recall_item.stability)"]
        Q7["7. This-week reviews\nlast 7 days count"]
        Q8["8. Last-week reviews\n7-14 days ago count"]
        Q9["9. 84-day activity grid\nreview_log grouped by\ndate (UTC timezone)"]
        Q10["10. Reviews today\ncount since todayStart"]
    end

    subgraph Derived ["Derived Metrics"]
        D1["masteryRate =\n(mastered / total) * 100"]
        D2["weekOverWeekTrend =\n((thisWeek - lastWeek)\n/ lastWeek) * 100"]
        D3["activityGrid[84] =\nfilled from activityMap\n(0 for missing days)"]
        D4["currentStreak =\nwalk grid backwards\nfrom today"]
        D5["longestStreak =\nmax consecutive days\nwith count > 0"]
    end

    subgraph Output ["Return Value"]
        G["growth:\ntotalReviews, masteryRate,\naverageRating, weekOverWeekTrend,\nratingDistribution, averageStability"]
        C["consistency:\ncurrentStreak, longestStreak,\nreviewsToday, activityGrid"]
    end

    Entry --> Q1 & Q2 & Q3 & Q4 & Q5 & Q6 & Q7 & Q8 & Q9 & Q10

    Q1 --> G
    Q2 & Q3 --> D1 --> G
    Q4 --> G
    Q5 --> G
    Q6 --> G
    Q7 & Q8 --> D2 --> G
    Q9 --> D3 --> D4 & D5 --> C
    Q10 --> C
```

## 3. UTC Date Alignment

The activity grid SQL uses `at time zone 'UTC'` for date grouping. JavaScript must use UTC methods to produce matching date strings, otherwise streak calculations and heatmap rendering break for users in non-UTC timezones.

```mermaid
flowchart TD
    subgraph SQL ["SQL Layer"]
        S1["date(reviewed_at\nat time zone 'UTC')"]
        S2["Returns: '2026-03-22'"]
    end

    subgraph JS ["JavaScript Layer"]
        J1["startOfDayUTC(date)"]
        J2["new Date(Date.UTC(\ny, m, d))"]
        J3["d.toISOString()\n.slice(0, 10)"]
        J4["Returns: '2026-03-22'"]
    end

    subgraph Gotchas ["Common Mistakes"]
        direction LR
        Bad1["setHours(0,0,0,0)\nuses local timezone"]
        Bad2["setDate()\nuses local timezone"]
        Bad3["getDay()\nuses local timezone"]

        Good1["setUTCDate()\nfor date arithmetic"]
        Good2["getUTCDay()\nfor day-of-week"]
        Good3["Date.UTC()\nfor midnight"]
    end

    S1 --> S2
    J1 --> J2 --> J3 --> J4

    S2 -. "must match" .-> J4
    Bad1 -. "replace with" .-> Good3
    Bad2 -. "replace with" .-> Good1
    Bad3 -. "replace with" .-> Good2
```

**Key rule:** Every date comparison between SQL results and JavaScript must go through UTC-only methods. The `startOfDayUTC` helper enforces this for the grid origin, and `setUTCDate` / `getUTCDate` are used for all subsequent arithmetic.

## 4. Component Data Flow

Shows how each resolved value from the page-level `Promise.all` maps to dashboard UI components.

```mermaid
flowchart TD
    subgraph PageData ["Page-Level Data"]
        dueItems["dueItems"]
        dueCount["dueCount"]
        recentItems["allItemsResult\n{items, total}"]
        scheduleItems["scheduleItemsResult\n{items}"]
        trackedItems["trackedItems"]
        topicsCount["topicsCount"]
        notesCount["notesCount"]
        chunksCount["chunksCount"]
        growth["dashboardStats\n.growth"]
        consistency["dashboardStats\n.consistency"]
    end

    subgraph MainColumn ["Main Column"]
        ES["EventsSummary"]
        TS["TopicStats"]
        NS["NoteStats"]
        CS["ChunkStats"]
        RIS["ReviewItemStats"]
        GO["GrowthOverview"]
        RTC["ReviewsTableCard"]
    end

    subgraph Sidebar ["Right Sidebar"]
        CC["ConsistencyCard\n(heatmap + streaks)"]
        US["UpcomingSessions\n(week navigation)"]
        GQC["GenerationQueueCard"]
    end

    dueItems --> ES
    topicsCount --> TS
    trackedItems --> TS
    notesCount --> NS
    chunksCount --> CS
    dueCount --> CS
    dueCount --> RIS
    growth --> GO
    recentItems --> RTC
    consistency --> CC
    scheduleItems --> US
    dueItems --> US
    dueCount --> US
    trackedItems --> GQC
```

### Component details

| Component | Props | Displays |
|-----------|-------|----------|
| **EventsSummary** | `dueItems` | Count of items due now |
| **TopicStats** | `topicsCount`, `trackedCount` | Total topics, tracked topics |
| **NoteStats** | `notesCount` | Total notes |
| **ChunkStats** | `chunksCount`, `dueCount` | Total chunks, due ratio |
| **ReviewItemStats** | `dueCount` | Due items count |
| **GrowthOverview** | `stats` (growth) | totalReviews, masteryRate, avgRating, ratingDistribution, avgStability, weekOverWeekTrend |
| **ConsistencyCard** | `stats` (consistency) | 84-day heatmap, currentStreak, longestStreak, reviewsToday |
| **ReviewsTableCard** | `items`, `total` | Paginated recall items table |
| **UpcomingSessions** | `allItems`, `dueItems`, `dueCount` | Week calendar with scheduled/past reviews |
| **GenerationQueueCard** | `initialItems` | Active tracking/generation queue |

## Key Source Files

| File | Purpose |
|------|---------|
| `apps/web/src/app/dashboard/(overview)/page.tsx` | Parallel data fetching, layout composition |
| `apps/web/src/lib/fetchers/dashboard-stats.ts` | `getDashboardStats` -- 10 parallel queries, UTC handling, streak computation |
| `apps/web/src/app/dashboard/_components/consistency-card.tsx` | 84-day heatmap rendering |
| `apps/web/src/app/dashboard/_components/growth-overview.tsx` | Growth stats display (ratings, mastery, stability) |
| `apps/web/src/app/dashboard/_components/upcoming-sessions.tsx` | Week navigation, past review log display |
