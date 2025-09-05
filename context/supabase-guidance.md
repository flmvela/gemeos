# Supabase Guidance (Gemeos)

This doc tells Claude Code (and teammates) **how to read/write Gemeos data in Supabase** safely and consistently.

---

## Core Tables & Shared Conventions

We track **who/what created content** and enable a clean **human-in-the-loop** review flow across three key tables:

- `concepts`
- `learning_goals`
- `concept_relationships`

All three share these audit fields:

- `source generation_source NOT NULL DEFAULT 'ai'`  
  Allowed: `'ai' | 'human' | 'import'`
- `created_by uuid` — user who created the row (when known)
- `updated_by uuid` — user who last updated the row (when known)
- `reviewed_by uuid` — user who approved/rejected (human reviewer)
- `reviewed_at timestamptz` — when approval/rejection happened

### Status enums (human-in-the-loop)

We use a consistent status enum for reviewable content:

- `review_status`: `'suggested' | 'approved' | 'rejected' | 'pending'`

**Insert defaults**  
- AI generated: `status = 'suggested'`, `source = 'ai'`, `reviewed_* = NULL`
- Human/manual: `status = 'approved'` (or `'pending'` if you want a second review), `source = 'human'`, and set `reviewed_by/at` if approved immediately
- Imports: `source = 'import'` (status up to the import flow)

> Tip: When you’re writing new features, prefer using the **same enum values** in UI and code to avoid mapping bugs.

---

## Foreign Keys & IDs

- `domain_id` is a **UUID** across tables (not text). Always pass UUIDs.
- Avoid string slugs in FKs; resolve slugs → UUIDs at the edge (UI/server) then pass UUIDs to DB.

---

## RLS (Row Level Security)

RLS may be enabled. Follow these rules to avoid permission errors:

- **Client-side (anon/role: authenticated)**  
  - Normal reads and writes **for the current user** using policies.
  - For AI services or bulk data tasks, **don’t** use client keys.
- **Server-side tasks (AI, imports, backfills)**  
  - Use the **Supabase Service Key** (server only) or **edge functions** with elevated policies.
  - Keep service code out of the browser.

---

## Insert / Update Patterns

Below are canonical patterns for Claude to copy-paste. These assume `@supabase/supabase-js@2.x`, with a server/client initialized already.

### 1) Concepts

#### Insert (AI suggests a concept)
```ts
// Insert a suggested concept from AI (human will review)
await supabase
  .from('concepts')
  .insert({
    name,
    description,
    domain_id,               // UUID
    parent_concept_id,       // UUID or null
    status: 'suggested',     // review_status
    source: 'ai',
    created_by: userId ?? null, // if known (service may pass null)
  })
```

#### Insert (human creates a concept)
```ts
await supabase
  .from('concepts')
  .insert({
    name,
    description,
    domain_id,
    parent_concept_id: parentId ?? null,
    status: 'approved',       // or 'pending' if you want second pair of eyes
    source: 'human',
    created_by: userId,
    reviewed_by: userId,      // if approved now
    reviewed_at: new Date().toISOString(),
  })
```

#### Update (approve / reject concept)
```ts
// Approve
await supabase
  .from('concepts')
  .update({
    status: 'approved',
    reviewed_by: reviewerId,
    reviewed_at: new Date().toISOString(),
    updated_by: reviewerId,
  })
  .eq('id', conceptId)

// Reject
await supabase
  .from('concepts')
  .update({
    status: 'rejected',
    reviewed_by: reviewerId,
    reviewed_at: new Date().toISOString(),
    updated_by: reviewerId,
  })
  .eq('id', conceptId)
```

#### Update (change parent)
```ts
await supabase
  .from('concepts')
  .update({
    parent_concept_id: newParentId, // UUID or null
    updated_by: userId,
  })
  .eq('id', conceptId)
```

---

### 2) Learning Goals

#### Insert (AI suggestions)
```ts
await supabase
  .from('learning_goals')
  .insert({
    concept_id,                 // UUID
    goal_description,
    bloom_level,                // optional string
    goal_type,                  // optional (see “Goal Types” below)
    sequence_order,             // optional number
    status: 'suggested',
    source: 'ai',
    created_by: userId ?? null,
  })
```

#### Insert (human-created)
```ts
await supabase
  .from('learning_goals')
  .insert({
    concept_id,
    goal_description,
    bloom_level,
    goal_type,
    sequence_order,
    status: 'approved',
    source: 'human',
    created_by: userId,
    reviewed_by: userId,
    reviewed_at: new Date().toISOString(),
  })
```

#### Update (approve/reject goal)
```ts
await supabase
  .from('learning_goals')
  .update({
    status: 'approved',            // or 'rejected'
    reviewed_by: reviewerId,
    reviewed_at: new Date().toISOString(),
    updated_by: reviewerId,
  })
  .eq('id', goalId)
```

> **Goal Types**  
> If you plan to standardize types (e.g., “knowledge”, “skill”, “application”), back them with a lookup table like `learning_goal_types (id, code, label, description)` and reference by code or id. Until then, free-text is fine but less consistent.

---

### 3) Concept Relationships

We separate **hierarchy** (parent/child) from **non-hierarchical** relationships (e.g., “is_related_to”, “is_prerequisite_of”). Hierarchy is stored on `concepts.parent_concept_id`. Non-hierarchical links live in `concept_relationships`.

- `concept_a_id` and `concept_b_id` are the two endpoints (UUIDs).
- `relationship_kind` (enum) — use e.g. `'related' | 'prerequisite'` (as defined in your enum).
- `relationship_type` — free text or code (optional refinement, e.g. subtype/category).
- Unique constraints prevent duplicates and self-links.

#### Insert (create a link)
```ts
await supabase
  .from('concept_relationships')
  .insert({
    domain_id,                   // UUID
    concept_a_id,                // UUID
    concept_b_id,                // UUID (not equal to A)
    relationship_kind: 'related',// or 'prerequisite', per enum
    relationship_type: 'is_related_to', // optional
    status: 'suggested',         // start suggested if AI created
    source: 'ai',
    created_by: userId ?? null,
  })
```

#### Approve / Reject a relationship
```ts
await supabase
  .from('concept_relationships')
  .update({
    status: 'approved',              // or 'rejected'
    reviewed_by: reviewerId,
    reviewed_at: new Date().toISOString(),
    updated_by: reviewerId,
  })
  .eq('id', relationshipId)
```

> **Note:** Do **not** express parent/child here. That lives on `concepts.parent_concept_id`.

---

## Bulk Actions Patterns

#### Approve all AI-suggested concepts in a domain
```ts
const { data: ids } = await supabase
  .from('concepts')
  .select('id')
  .eq('domain_id', domainId)
  .eq('status', 'suggested')

if (ids?.length) {
  await supabase
    .from('concepts')
    .update({
      status: 'approved',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      updated_by: reviewerId,
    })
    .in('id', ids.map(r => r.id))
}
```

---

## Error Patterns & How to Avoid Them

- **“column X does not exist”**  
  Ensure migrations were applied. Keep DDL changes in a versioned SQL folder and run them on all environments before shipping code.
- **“invalid input value for enum …”**  
  Use allowed enum values exactly:  
  - `generation_source`: `'ai' | 'human' | 'import'`  
  - `review_status`: `'suggested' | 'approved' | 'rejected' | 'pending'`
- **UUID vs text**  
  `domain_id`, `concept_id` etc. are **UUIDs**. Convert/resolve slugs to UUIDs before insert.
- **RLS errors**  
  If a call works locally but fails in prod, you’re likely hitting RLS. Use edge functions / service key for AI/import flows.

---

## Server vs Client Calls

- **Client (browser)**: end-user interactions (create/edit by humans).  
  Use the standard Supabase client; pass `created_by/updated_by` as current user ID.
- **Server (AI, imports, batch jobs)**: use **service role key** in a server context (or Supabase Edge Functions).  
  Populate `source = 'ai' | 'import'`, and leave `reviewed_*` null until a human acts.

---

## Review Flow Cheat-Sheet

- AI creates: `status='suggested'`, `source='ai'`, `reviewed_* = null`
- Human approves: set `status='approved'`, `reviewed_by`, `reviewed_at`, `updated_by`
- Human rejects: set `status='rejected'`, `reviewed_by`, `reviewed_at`, `updated_by`
- Human creates directly approved: set `status='approved'`, `source='human'`, `created_by`, `reviewed_by`, `reviewed_at`

---

## Helpful SQL (Reference)

> **Create/ensure fields (already applied in your DB)**  
> Keep your migrations in code, but this shows what we expect to exist:

```sql
-- Concepts (fields of interest)
-- source generation_source default 'ai'
-- created_by, updated_by, reviewed_by uuid
-- reviewed_at timestamptz
-- parent_concept_id uuid (hierarchy)
-- status review_status

-- Learning Goals: same audit fields + status

-- Concept Relationships: same audit fields + status + relationship_kind enum
```

---

## Final Notes for Claude Code

- Prefer **small helper functions** (e.g., `approveConcept(id, reviewerId)`), each doing one thing and setting all required audit fields.
- Always set `updated_by` on updates.
- When you’re not sure who the user is (server cron/AI process), set `created_by/updated_by` to `null` and rely on `source`.
- Log the payloads you send to Supabase during integration tests to catch enum/UUID issues early.

---

If you need me to tailor this for a specific framework (Next.js RSC vs. Remix vs. Vite SPA) or add **edge function** samples, say the word and I’ll extend this doc.
