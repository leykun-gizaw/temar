# Payment & Subscription Lifecycle

## 1. Checkout Flow

```mermaid
sequenceDiagram
    participant User as User (Browser)
    participant Billing as /dashboard/billing
    participant SA as Server Action
    participant Provider as Payment Provider<br/>(Paddle / Dodo)
    participant DB as PostgreSQL

    User->>Billing: Visit /dashboard/billing
    Billing->>SA: syncSubscription()
    SA->>DB: Get user providerKey (default 'paddle')
    SA->>Provider: getProvider(providerKey).syncSubscription(email, providerCustomerId)
    Provider-->>SA: Current subscription state
    SA->>DB: Update user plan/status if changed
    SA-->>Billing: SubscriptionInfo

    Billing->>SA: getActiveProvider().getCheckoutConfig()
    SA-->>Billing: CheckoutConfig<br/>(priceIds, clientToken, environment,<br/>plans, topupPacks)

    Billing->>User: Render BillingClient<br/>(plan cards + top-up options)

    User->>Billing: Click subscribe / top-up
    Billing->>Billing: useCheckout hook
    Billing->>Provider: Paddle/Dodo client SDK<br/>opens overlay with<br/>customData: { userId }
    User->>Provider: Complete payment
    Provider-->>User: Payment confirmation
    Provider--)SA: Webhook (async)
```

## 2. Webhook Processing

```mermaid
sequenceDiagram
    participant Provider as Payment Provider
    participant Route as Webhook Route<br/>(/api/webhooks/paddle or /dodo)
    participant Adapter as Provider Adapter
    participant Handler as Shared Event Handler<br/>(event-handler.ts)
    participant DB as PostgreSQL

    Provider->>Route: POST /api/webhooks/paddle
    Route->>Route: Read raw body + headers

    Route->>Adapter: getProvider('paddle')<br/>.verifyAndParseWebhook(rawBody, headers)

    Adapter->>Adapter: Verify PADDLE_WEBHOOK_SECRET<br/>signature
    Adapter->>Adapter: Unmarshal provider-specific payload
    Adapter->>Adapter: Normalize to PaymentEvent[]
    Adapter-->>Route: PaymentEvent[]

    loop For each PaymentEvent
        Route->>Handler: processPaymentEvent(event)
        Handler->>DB: Execute event-specific logic<br/>(see Event Processing below)
        DB-->>Handler: Result
        Handler-->>Route: Processed
    end

    Route-->>Provider: 200 OK
```

## 3. Event Processing

```mermaid
flowchart TD
    Event(["processPaymentEvent(event)"])

    Event --> Switch{"event.type"}

    Switch -->|subscription.activated| Activated["Update user:\n- plan = event.plan\n- providerCustomerId\n- providerSubscriptionId\n- passResetAt = now"]
    Activated --> ResetPass["resetMonthlyPass(userId, plan)\nApply allocation + rollover"]

    Switch -->|subscription.updated| Updated["Update user:\n- plan\n- providerSubscriptionId"]

    Switch -->|subscription.canceled| Canceled["Update user:\n- plan = 'free'\n- clear providerSubscriptionId\n- clear passResetAt"]

    Switch -->|subscription.renewed| Renewed["Link customerId if needed"]
    Renewed --> ResetPassR["resetMonthlyPass(userId, plan)\nApply allocation + rollover"]
    Note1["Source: TransactionCompleted\nwith subscriptionId"]
    Note1 -.- Renewed

    Switch -->|topup.completed| TopUp["Link customerId if needed"]
    TopUp --> CreditPass["creditPass(userId, topupPassAmount)"]
    Note2["Source: TransactionCompleted\nwithout subscriptionId"]
    Note2 -.- TopUp

    Switch -->|refund.subscription| RefundSub["Downgrade user to free"]
    RefundSub --> DebitPassSub["debitPass(userId)\nReverse original credit\nfrom pass_transaction"]
    Note3["Source: AdjustmentCreated\n(approved, with subscriptionId)"]
    Note3 -.- RefundSub

    Switch -->|refund.topup| RefundTopUp["debitPass(userId)\nReverse original credit\nfrom pass_transaction"]
    Note4["Source: AdjustmentCreated\n(approved, without subscriptionId)"]
    Note4 -.- RefundTopUp

    style Activated fill:#d1fae5,stroke:#059669
    style ResetPass fill:#d1fae5,stroke:#059669
    style Updated fill:#dbeafe,stroke:#3b82f6
    style Canceled fill:#fee2e2,stroke:#dc2626
    style Renewed fill:#d1fae5,stroke:#059669
    style ResetPassR fill:#d1fae5,stroke:#059669
    style TopUp fill:#fef3c7,stroke:#d97706
    style CreditPass fill:#fef3c7,stroke:#d97706
    style RefundSub fill:#fee2e2,stroke:#dc2626
    style DebitPassSub fill:#fee2e2,stroke:#dc2626
    style RefundTopUp fill:#fee2e2,stroke:#dc2626
```

## 4. Monthly Pass Reset & Rollover

```mermaid
flowchart TD
    Start(["resetMonthlyPass(userId, plan)"])

    Start --> Constants["Plan Constants"]

    subgraph Allocations ["PLAN_PASS_ALLOCATIONS (passes)"]
        Free1["free = 0"]
        Starter1["starter = 100"]
        Hobbyist1["hobbyist = 200"]
        Scholar1["scholar = 300"]
    end

    subgraph Rollovers ["PLAN_PASS_ROLLOVER_CAPS (passes)"]
        Free2["free = 0"]
        Starter2["starter = 30"]
        Hobbyist2["hobbyist = 60"]
        Scholar2["scholar = 100"]
    end

    Constants --> Allocations
    Constants --> Rollovers

    Allocations --> ConvertAlloc["allocationUsd =\npassAllocation * COST_PER_PASS_USD\n(COST_PER_PASS_USD = $0.05)"]
    Rollovers --> ConvertCap["rolloverCapUsd =\nrolloverCap * COST_PER_PASS_USD"]

    ConvertAlloc --> Compute
    ConvertCap --> Compute

    FetchBalance["Fetch current\npass_balance.balanceUsd"] --> Compute

    Compute["rolledOver =\nmin(currentBalanceUsd, rolloverCapUsd)"]

    Compute --> NewBalance["newBalanceUsd =\nrolledOver + allocationUsd"]

    NewBalance --> UpdateDB["UPDATE pass_balance\nSET balanceUsd = newBalanceUsd\nWHERE userId = ?"]

    style NewBalance fill:#fef3c7,stroke:#d97706
    style UpdateDB fill:#d1fae5,stroke:#059669
```

### Example: Hobbyist Plan Reset

| Step | Passes | USD ($0.05/pass) |
|------|--------|-------------------|
| Current balance | 150 passes | $7.50 |
| Rollover cap | 60 passes | $3.00 |
| Rolled over | min(150, 60) = 60 | $3.00 |
| Monthly allocation | +200 | +$10.00 |
| **New balance** | **260 passes** | **$13.00** |

## 5. syncSubscription Flow

```mermaid
sequenceDiagram
    participant Page as Billing Page Load
    participant SA as syncSubscription()<br/>Server Action
    participant DB as PostgreSQL
    participant Registry as Provider Registry
    participant Provider as Payment Provider API

    Page->>SA: syncSubscription()

    SA->>DB: Get user record<br/>(providerKey, providerCustomerId, email)
    DB-->>SA: User { providerKey: 'paddle', providerCustomerId, email }

    SA->>Registry: getProvider(providerKey)
    Registry-->>SA: PaddleAdapter (or DodoAdapter)

    SA->>Provider: syncSubscription(email, providerCustomerId)
    Provider->>Provider: Poll provider API<br/>for active subscription

    alt Active subscription found
        Provider-->>SA: { plan, status, nextBilledAt, ... }
        SA->>DB: Update user:<br/>plan, status, nextBilledAt,<br/>providerSubscriptionId
    else No active subscription
        Provider-->>SA: null
        SA->>SA: No DB update needed
    end

    SA->>DB: Ensure pass_balance row exists<br/>(INSERT ON CONFLICT DO NOTHING)
    DB-->>SA: pass_balance row

    SA-->>Page: SubscriptionInfo<br/>{ plan, status, nextBilledAt,<br/>passBalance, ... }
```

---

## Key Source Files

| File | Purpose |
|------|---------|
| `apps/web/src/app/api/webhooks/paddle/route.ts` | Thin webhook route for Paddle |
| `apps/web/src/app/api/webhooks/dodo/route.ts` | Dodo webhook stub |
| `libs/payment-provider/src/lib/event-handler.ts` | processPaymentEvent, resetMonthlyPass, creditPass, debitPass |
| `libs/payment-provider/src/lib/adapters/paddle/paddle-adapter.ts` | Paddle implementation |
| `libs/payment-provider/src/lib/adapters/paddle/paddle-plans.ts` | Plan mappings |
| `libs/payment-provider/src/lib/types.ts` | PaymentEvent, CheckoutConfig, SubscriptionInfo |
| `libs/payment-provider/src/lib/registry.ts` | getProvider, getActiveProvider |
| `apps/web/src/lib/actions/subscription-sync.ts` | syncSubscription server action |
| `apps/web/src/hooks/use-checkout.ts` | Client-side checkout hook |
| `apps/web/src/app/dashboard/billing/_components/billing-client.tsx` | Billing UI |
