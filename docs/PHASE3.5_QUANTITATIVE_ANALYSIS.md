# Soegih API - Phase 3.5: Quantitative Analysis

**Date:** March 1, 2026
**Status:** Ready for Phase 4 (Swagger/OpenAPI)
**Analysis Horizon:** 3 years (MVP → Growth → Scale)

---

## Table of Contents

1. [Scale Assumptions](#scale-assumptions)
2. [Performance Metrics & Latency Budget](#performance-metrics--latency-budget)
3. [Capacity Planning](#capacity-planning)
4. [Infrastructure & Cost Analysis](#infrastructure--cost-analysis)
5. [Growth Projections & Scaling Decision Points](#growth-projections--scaling-decision-points)
6. [Bottleneck Analysis & Optimization Roadmap](#bottleneck-analysis--optimization-roadmap)

---

## Scale Assumptions

### MVP Phase Assumptions

| Metric | Value | Rationale |
|--------|-------|-----------|
| **Registered Users** | 500 | Startup/beta phase (friends & family) |
| **Daily Active Users (DAU)** | 250 | 50% engagement rate (healthy for personal finance app) |
| **Transactions per DAU per day** | 7.5 | Midpoint of 5-10 (typical: expense + wallet check + review) |
| **Daily API Requests** | 1,875 | 250 DAU × 7.5 actions (auth, CRUD, list queries) |
| **Peak Multiplier** | 3x | Business hours concentrate activity (9am-6pm) |
| **Planning Horizon** | 3 years | MVP → Growth (Year 1-2) → Scale (Year 3) |
| **Yearly Growth Rate** | 50% | Moderate, predictable expansion |

### Assumptions Detail

**Daily Transactions Breakdown (per user):**
- Login: 1 request
- View wallets list: 2 requests (list + balance calculations)
- View transactions: 2 requests (list + filters)
- Create transaction: 1 request
- Update/delete: 0.5 request (occasional)
- **Total: 6.5 core API requests per DAU**

**Infrastructure Requests (metadata, logging, health checks):**
- Session validation: 1 per request (already counted in auth)
- Logging: 1 per request (async, not blocking)
- Total: ~7.5 API requests per DAU per day

---

## Performance Metrics & Latency Budget

### QPS (Requests Per Second) Calculation

**Average QPS:**
```
Daily requests: 1,875
Seconds per day: 86,400
Average QPS: 1,875 / 86,400 ≈ 0.022 QPS
```

**Peak QPS (business hours: 9am-6pm = 9 hours):**
```
Peak requests: 1,875 × 3x multiplier = 5,625 requests during 9 hours
Peak seconds: 9 hours × 3,600 = 32,400 seconds
Peak QPS: 5,625 / 32,400 ≈ 0.17 QPS
```

**Database QPS (avg 2-3 queries per request):**
```
Average: 0.022 × 2.5 ≈ 0.055 database QPS
Peak: 0.17 × 2.5 ≈ 0.425 database QPS
```

**Conclusion:** Extremely low load. Single database instance handles 100+ QPS easily.

---

### Latency Budget Allocation (p95 target: 2,000ms)

**Requirement:** API response time p95 ≤ 2 seconds (from SYSTEM_DESIGN.md)

| Layer | Allocated | Typical | Headroom |
|-------|-----------|---------|----------|
| **Network (request arrival)** | 50ms | 20ms | 30ms |
| **API Gateway / Router** | 10ms | 5ms | 5ms |
| **Authentication (JWT verify)** | 20ms | 10ms | 10ms |
| **Business Logic (service layer)** | 200ms | 50-100ms | 100ms |
| **Database Query** | 1,500ms | 50-200ms | 1,300ms |
| **Response Serialization** | 150ms | 30-50ms | 100ms |
| **Network (response return)** | 50ms | 20ms | 30ms |
| **Reserve (error handling, GC)** | 30ms | - | 30ms |
| **TOTAL** | 2,010ms | 175-385ms | 1,625ms |

**Analysis:**
- ✅ Database latency is bottleneck (~50-200ms of 2,000ms budget)
- ✅ Significant headroom for load spikes (1,625ms reserve)
- ✅ No caching required at MVP scale
- ⚠️ Watch transaction queries (balance calculations) — may need optimization

**Latency Targets by Endpoint:**

| Endpoint Type | p95 Target | Reason |
|---------------|-----------|--------|
| Auth (login/register) | 300ms | Password hashing (bcrypt) is expensive |
| GET list (categories, wallets) | 500ms | Filtering + pagination + derived data |
| GET single | 200ms | Direct lookup, minimal processing |
| POST create | 500ms | Insert + validation + response |
| PATCH update | 500ms | Query + update + cascade checks |
| DELETE single | 1,000ms | Soft delete check + count transactions |
| DELETE bulk | 2,000ms | Multiple deletes + validation |

---

## Capacity Planning

### Storage Estimation

**Data Size Per Entity:**

| Entity | Records per User | Bytes per Record | Size per User |
|--------|------------------|------------------|---------------|
| User | 1 | 200 | 200 bytes |
| Category | 30 | 150 | 4.5 KB |
| Wallet | 10 | 200 | 2 KB |
| Transaction Event | 500 | 150 | 75 KB |
| Posting | 750 | 80 | 60 KB |
| **TOTAL per user** | - | - | **141.7 KB** |

**MVP Phase (500 users):**
```
500 users × 141.7 KB = ~70 MB
PostgreSQL overhead (indexes, metadata): ~30% = 21 MB
Supabase overhead (replication, WAL): ~50% = 35 MB
Total: ~126 MB (easily fits in Supabase free tier)
```

**Growth Projections (3-year):**

| Year | Users | DAU | Transactions | Storage | Database Tier |
|------|-------|-----|--------------|---------|---------------|
| 1 (MVP) | 500 | 250 | 187,500/day | ~130 MB | Free Tier |
| 1.5 | 750 | 375 | 281,250/day | ~200 MB | Free Tier |
| 2 | 1,125 | 562 | 421,875/day | ~300 MB | Free Tier |
| 2.5 | 1,688 | 844 | 632,813/day | ~450 MB | Free Tier |
| 3 | 2,531 | 1,266 | 949,219/day | ~670 MB | Free Tier → $50/mo |

**Retention Strategy:**
- Keep 3 years of transaction data (default Supabase backup)
- Archive transactions >3 years old to S3 (cost: ~$0.50/month per year)
- Soft-deleted data kept indefinitely (required by business rules)

---

### Memory & CPU Requirements

**Node.js Application Server:**

```
Base memory (Node.js runtime): 50 MB
Express/NestJS framework: 30 MB
Prisma client + connection pool: 25 MB
Active request buffers (avg): 5 MB
Logger (Winston/Pino): 10 MB
Monitoring agent (if used): 10 MB
─────────────────────────────
Total baseline: ~130 MB
Headroom (for spikes): 200 MB (2x)
─────────────────────────────
Required: 512 MB - 1 GB RAM
```

**Recommended for MVP:**
- Instance type: AWS t3.micro or t3.small
- RAM: 1 GB
- CPU: 2 vCPU (burstable)
- Cost: $0.0104/hour = $7.58/month (t3.micro)

**CPU Usage:**
- Current workload: <1% CPU (0.17 QPS is negligible)
- Bursting: t3 instances can burst to full CPU when needed
- No autoscaling needed until QPS > 10

---

### Connection Pool Sizing

**PostgreSQL Connection Pool (pgBouncer/Supabase):**

```
Concurrent active connections: (Peak QPS × avg query duration)
= 0.425 QPS × 0.1s = 0.0425 concurrent queries

With overhead: 1-2 connections needed
Configured pool size: 5 connections (minimal)

Each connection uses: ~5-10 MB memory
5 connections: ~40 MB memory overhead
```

**Supabase Default:**
- Connection pooler: 20 connections (free tier)
- Sufficient for MVP scale

---

## Infrastructure & Cost Analysis

### Year 1: MVP Deployment (Months 1-12)

**Scenario 1: Supabase Hosting (Recommended for MVP)**

```
Service                 Cost/Month    Annual       Notes
──────────────────────────────────────────────────────
Supabase (Free Tier)    $0            $0           Includes:
                                                   - PostgreSQL 500MB
                                                   - Auth
                                                   - Real-time
                                                   - 1M req/month

API Server              $7.58         $90.96       AWS t3.micro
(t3.micro, burstable)                             1 GB RAM, 2 vCPU

Monitoring              $5.00         $60.00       Sentry (errors)
(Error tracking)                                  or similar

DNS & Domain            $0.50         $6.00        Route 53 or Namecheap

Bandwidth (5GB/mo)      $0.00         $0.00        Included in t3 tier

─────────────────────────────────────────────────
Total Year 1:                         $156.96      ~$0.31 per DAU/month

Year 1 Cumulative: $157
```

**Scenario 2: PaaS Alternative (Railway/Render)**

```
Railway:
- PostgreSQL (shared): $7/month
- Application server: $5/month
- Total: $12/month = $144/year

Render:
- Postgres Free: $0/month
- Node.js Free: $0/month
- Total: $0 for MVP (paid tiers start at $7/month)
```

**Recommendation:** Start with **Supabase Free + AWS t3.micro** ($156/year)
- Supabase free tier sufficient until 1M+ requests/month
- t3.micro can autoscale to t3.small when hitting CPU limits
- Cost remains <$20/month until 2-3K DAU

---

### Year 2: Growth Phase (Months 13-24)

**Projected Growth:** 500 → 1,125 users (125% growth, 50%/year)

**Database Needs:**
```
Current size: 200 MB
Growth: ~5 KB per new transaction event
1,125 users × 500 events = 562,500 total events
Size: ~450 MB + indexes + overhead = ~600 MB

Still within Supabase free tier (500 MB)
Begin monitoring disk usage
```

**API Server Needs:**
```
Peak QPS: 0.17 → 0.38 QPS
CPU usage: <1% → 2-3%
RAM: 512 MB → 768 MB

t3.micro performance: Still sufficient
Alternative: Upgrade to t3.small ($14.58/month)
```

**Cost Projection - Year 2:**

```
Service                 Cost/Month    Annual
─────────────────────────────────────────────
Supabase               $0-50         $0-600      Upgrade to Pro ($50/mo) if:
                                                 - >1M requests/month
                                                 - >1GB storage
                                                 - Need custom domains

API Server (t3.small)  $14.58        $174.96     Upgrade if CPU > 5%

Monitoring             $5.00         $60.00

Domain/DNS             $0.50         $6.00

─────────────────────────────────────────────
Year 2 Total:                        $240.96
```

---

### Year 3: Scale Phase (Months 25-36)

**Projected Growth:** 1,125 → 2,531 users (125% growth, 50%/year)

**Database Needs:**
```
Current size: 600 MB
Growth rate: ~5 KB/day per user × 2,531 users = ~38 MB/month
Year 3 addition: ~456 MB
Total: ~1 GB

Supabase Pro tier required: $50/month
- 8 GB PostgreSQL
- 50 GB bandwidth
- 100+ concurrent connections
```

**API Server Scaling:**
```
Peak QPS: 0.38 → 0.85 QPS
Concurrent users: 844 → 1,900 at peak

Single t3.small may struggle. Options:
1. Add load balancer + 2nd instance (cost: +$15/month)
2. Switch to auto-scaling group (cost: +$25/month setup)
3. Use managed container service (ECS, App Engine)

Recommendation: 2 × t3.small with load balancer
```

**Cost Projection - Year 3:**

```
Service                 Cost/Month    Annual
─────────────────────────────────────────────
Supabase Pro           $50.00        $600.00

API Servers (2×)       $29.16        $349.92
(2 × t3.small)

Load Balancer (ALB)    $16.20        $194.40

Monitoring             $10.00        $120.00
(Enhanced with APM)

Domain/DNS             $0.50         $6.00

─────────────────────────────────────────────
Year 3 Total:                        $1,270.32

Cost per user: $1,270 / 2,531 = $0.50/month/user
```

---

### 3-Year Cost Summary

| Year | Users | Tier | Monthly Cost | Annual Cost | Cost/User/Mo |
|------|-------|------|--------------|-------------|--------------|
| Year 1 | 500 | MVP | $13/mo | $157 | $0.31 |
| Year 2 | 1,125 | Growth | $20/mo | $241 | $0.18 |
| Year 3 | 2,531 | Scale | $106/mo | $1,270 | $0.50 |
| **3-Year Total** | - | - | - | **$1,668** | - |

**Cost to Break-Even:** ~$200/year until profitable with ads/premium features

---

## Growth Projections & Scaling Decision Points

### Scaling Triggers & Actions

#### Trigger 1: Database Storage > 500 MB

**Symptom:** Supabase free tier approaching limit

**Action:**
```
Option A: Supabase Pro ($50/month)
- 8 GB storage
- Better backup retention
- 100+ concurrent connections

Option B: Migrate to AWS RDS
- More control, easier partitioning
- Potential cost savings at scale
- Requires database ops expertise

Recommended: Supabase Pro (less ops overhead)
```

**Timeline:** Month 15-18 (estimated)

---

#### Trigger 2: API Peak QPS > 1

**Symptom:** Latency p95 > 500ms, CPU usage > 50%

**Action:**
```
1. Optimize database queries:
   - Add missing indexes
   - Optimize N+1 queries
   - Implement query caching

2. If optimization insufficient:
   - Add 2nd API instance
   - Deploy load balancer (AWS ALB: $16/month)
   - Configure auto-scaling

Cost impact: +$30-40/month
```

**Timeline:** Month 18-24 (if growth rate accelerates)

---

#### Trigger 3: Storage > 1 GB

**Symptom:** Monthly storage growth >10% of current size

**Action:**
```
1. Archive transactions >2 years old:
   - Export to S3 (cost: ~$0.50/month)
   - Keep recent 2 years on primary database
   - Reduces active DB size by 30-40%

2. Implement table partitioning:
   - Partition transactions by month/quarter
   - Improves query performance on old data
   - Enables faster purges

Cost impact: -$5-10/month (savings)
```

**Timeline:** Year 3 (Month 30+)

---

#### Trigger 4: Monthly Bill > Target Budget

**Symptom:** Infrastructure cost exceeds business target

**Action:**
```
1. Short-term (cost reduction):
   - Use AWS Reserved Instances (30% savings)
   - Example: 1 year reservation on t3.small
   - Saves $50/year

2. Medium-term (operational efficiency):
   - Implement caching layer (Redis: $5-15/month)
   - Cache frequently accessed queries
   - Reduce database load by 20-30%

3. Long-term (business model):
   - Introduce premium features or freemium tier
   - Offset infrastructure costs with revenue
```

**Timeline:** Continuous evaluation

---

### Multi-Year Scaling Roadmap

```
YEAR 1: MVP (0-500 users)
├─ Supabase Free + t3.micro
├─ Single API instance
├─ Manual deployments
├─ Basic monitoring (Sentry)
└─ Cost: $157/year

YEAR 2: Growth (500-1,125 users, +125%)
├─ Supabase Free → Pro (if >1M requests)
├─ t3.micro → t3.small (if CPU >5%)
├─ Add basic load testing
├─ Implement structured logging
├─ Set up CI/CD pipeline
└─ Cost: $241/year

YEAR 3: Scale (1,125-2,531 users, +125%)
├─ Supabase Pro (mandatory)
├─ 2× API instances + load balancer
├─ Auto-scaling groups
├─ Database read replicas (if needed)
├─ Redis caching layer (optional)
├─ Enhanced monitoring (DataDog/NewRelic)
└─ Cost: $1,270/year

POST-YEAR 3: Enterprise
├─ Multiple regions (if global)
├─ Advanced security (WAF, DDoS)
├─ Real-time analytics
├─ Revenue-generating features
└─ Cost: $2,000-5,000+/year
```

---

## Bottleneck Analysis & Optimization Roadmap

### Current Bottlenecks (MVP Phase)

#### 1. Database Query Performance

**Issue:** Derived balance calculation (SUM of postings) runs for every wallet fetch

**Current Impact:**
- Every wallet list request: 1 DB query + N balance calculations (N = wallet count)
- At 250 DAU, this is acceptable (~5-50 postings per wallet)
- But will hit limits at 10K+ users

**Optimization Roadmap:**

| Phase | Action | Cost | Impact | Timeline |
|-------|--------|------|--------|----------|
| MVP | Accept current approach | $0 | OK at <1K users | Now |
| Growth | Add database indexes | $0 | 20-30% faster | Month 12 |
| Growth | Implement query caching | $5/mo | 50-70% faster | Month 18 |
| Scale | Materialize balance view | $100 dev | 90% faster | Year 2-3 |

**Action Items (MVP):**
- ✅ Ensure `wallet_id` index on postings table
- ✅ Ensure `deleted_at` index (filter only active postings)
- ⏰ Monitor query time for balance calculation

---

#### 2. Authentication Performance

**Issue:** Every request validates JWT (bcrypt/HMAC operations)

**Current Impact:**
- JWT verification: ~10-20ms per request
- Not a bottleneck at 0.17 QPS but scales with load

**Optimization Roadmap:**

| Phase | Action | Cost | Impact | Timeline |
|-------|--------|------|--------|----------|
| MVP | Accept current approach | $0 | OK at <10K QPS | Now |
| Growth | Cache JWT validation | $0 | 50% faster | Month 12 |
| Growth | Use Redis session store | $5-15/mo | 70% faster | Month 18 |
| Scale | Implement API gateway (Kong) | $100+ dev | 80% faster + features | Year 3 |

**Action Items (MVP):**
- ✅ Use simple HMAC for JWT (faster than asymmetric)
- ⏰ Monitor auth latency, set alert at >50ms

---

#### 3. Network Bandwidth

**Issue:** API responses include full object graphs (categories, wallets in transactions)

**Current Impact:**
- Average transaction response: ~500 bytes
- 1,875 requests/day × 500 bytes = 937 KB/day
- Supabase free tier: 50 GB/month = 1.6 GB/day (massive headroom)

**Optimization (not needed until Year 3):**
- Implement field selection (only return needed fields)
- Compression (gzip already applied by default)
- GraphQL (instead of REST) — future consideration

---

#### 4. Soft Delete Query Filtering

**Issue:** Every query must include `deleted_at IS NULL` filter

**Current Impact:**
- Adds 1-2ms per query (negligible)
- May miss index optimization if not careful

**Optimization:**
- ✅ Ensure indexes include `deleted_at` field
- ⏰ Monitor if soft-deleted data causes query slowness

---

### Performance Monitoring & Alerting

**Metrics to Monitor (MVP):**

| Metric | Alert Threshold | Action |
|--------|-----------------|--------|
| API latency p95 | >500ms | Review slow queries, add indexes |
| Database QPS | >5 | Check for N+1 queries |
| CPU usage | >50% | Upgrade instance size |
| Memory usage | >70% | Check for memory leaks |
| Auth failures | >1% | Investigate security issue |
| Error rate | >0.5% | Check logs for patterns |

**Tools (MVP):**
- Sentry (error tracking): $0 free tier
- CloudWatch logs (AWS): $0.50/GB
- Custom metrics (NestJS + Winston): $0

**Tools (Growth):**
- DataDog: $15/month
- New Relic: $99/month
- Self-hosted Grafana: $0 + ops cost

---

## Summary & Recommendations

### Key Findings

✅ **Infrastructure is oversized for MVP** (great for reliability)
- 0.17 QPS is trivial load
- t3.micro can handle 100x current load
- Supabase free tier sufficient until Year 2-3

✅ **Latency targets easily achievable**
- 2,000ms budget with 1,625ms headroom
- Database is only potential bottleneck (50-200ms)
- No caching needed at MVP scale

✅ **Cost-effective growth path**
- Year 1: $157 (0.31/user/month)
- Year 2: $241 (0.18/user/month)
- Year 3: $1,270 (0.50/user/month)
- Total 3 years: $1,668 (very reasonable)

⚠️ **Watch for Query Performance at Scale**
- Derived balance calculations okay now
- May need optimization at 5K+ users
- Add indexes before they're needed

⚠️ **Plan for Storage Growth**
- 3-year projection: ~670 MB
- Supabase free tier adequate until Month 18-24
- Archive strategy needed by Year 2

### Recommendations for Implementation

**Phase 4 (Swagger) Implications:**

1. **Pagination:** Start with 10 items/page (acceptable latency)
   - Can increase to 100 if performance permits

2. **Filtering:** All list endpoints support `deleted_at` filtering
   - Include `include_deleted=true` in queries

3. **Sorting:** Implement on indexed fields only (name, created_at, occurred_at)
   - Avoid sorting on computed fields (balance)

4. **Response Time SLAs:**
   - Auth endpoints: <300ms p95 (bcrypt is expensive)
   - List endpoints: <500ms p95
   - Single resource: <200ms p95
   - Create/Update: <500ms p95
   - Bulk delete: <2,000ms p95

**Phase 5 (TDD) Implications:**

1. **Performance Tests:** Add baseline latency tests
   - Auth: <300ms
   - Query single: <200ms
   - Query list (10 items): <500ms

2. **Load Tests:** Simulate 3-month sustained load
   - 0.1 QPS (realistic for 250 DAU)
   - 10x spike (0.17 QPS during peak hours)

3. **Stress Tests:** Identify breaking points
   - At what QPS does latency exceed 500ms?
   - At what concurrent users does system degrade?

---

## Appendix: Assumptions & Sensitivities

### Key Assumptions

1. **50% DAU (Daily Active Users)** - Conservative for finance app
   - If actual DAU is 70%: +40% load increase
   - If actual DAU is 30%: -40% load decrease

2. **7.5 transactions per DAU per day** - Based on typical usage
   - If users are power traders (20/day): 3x load increase
   - If users are casual (2/day): 3x load decrease

3. **50% yearly growth** - Moderate, predictable
   - If viral (100%+ growth): Scaling decisions needed earlier
   - If slow (20% growth): Infrastructure can stay smaller longer

4. **3-year planning horizon** - Typical for MVP-to-growth
   - If pivot/shutdown possible: Scale only when needed
   - If aiming for Series A: Plan for 10x growth

### Sensitivity Analysis

**If DAU = 500 (70% of 750 users):**
- Peak QPS: 0.34 (instead of 0.17)
- Cost: Still on single server, <1% CPU
- Action: No change

**If DAU = 1,000 (10x current):**
- Peak QPS: 1.7
- Cost: May need t3.small
- Action: Upgrade instance, add monitoring

**If Growth = 100% yearly (aggressive):**
- Year 1: 1,000 users (instead of 500)
- Year 2: 4,000 users (instead of 1,125)
- Year 3: 16,000 users (instead of 2,531)
- Cost Year 3: $3,000-5,000+
- Action: Plan multi-region, consider CDN

---

## Next Steps: Phase 4 (Swagger/OpenAPI)

This quantitative analysis informs API design decisions:

1. **Endpoint response sizes** - Ensure <500ms for list endpoints
2. **Pagination defaults** - 10-100 items based on latency budget
3. **Error response format** - Keep compact (minimize serialization time)
4. **Rate limiting** - Not needed at MVP scale, but prepare for future
5. **Performance headers** - Return latency metrics in response (optional)

Ready to generate Phase 4: Swagger/OpenAPI 3.0 specification with NestJS decorators.

Would you like me to proceed, or refine any assumptions?
