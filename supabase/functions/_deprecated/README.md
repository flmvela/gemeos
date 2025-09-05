# Deprecated Supabase Edge Functions

This directory contains functions that have been deprecated and replaced with improved, consolidated versions.

## Deprecated Functions and Their Replacements

### Concept Import Functions (Consolidated)
- **`import-concepts-from-text`** → Replaced by `import-concepts-unified`
  - Previously imported hardcoded jazz concepts from embedded markdown
  - New unified function supports this via `source: 'hardcoded'`

- **`import-master-concepts`** → Replaced by `import-concepts-unified`
  - Previously downloaded master concept list from Google Cloud Storage
  - New unified function supports this via `source: 'gcs'`

- **`extract-concepts-with-duplicate-check`** → **KEPT ACTIVE** (but functionality also available in unified)
  - Core function for extracting concepts with duplicate detection
  - Functionality also available in unified function via `source: 'text'`

### Vertex AI Diagnostic Functions (Consolidated)
- **`vertex-ai-diagnostics`** → Replaced by `vertex-ai-diagnostics-unified`
  - Previously tested multiple models and regions with comprehensive reporting
  - New unified function supports this via `mode: 'comprehensive'`

- **`vertex-ai-smoke-test`** → Replaced by `vertex-ai-diagnostics-unified`  
  - Previously did simple connectivity test for single model/region
  - New unified function supports this via `mode: 'quick'`

## Migration Date
Functions deprecated on: 2024-09-02

## Usage Migration Guide

### For Concept Import
Replace calls to deprecated functions with the unified version:

```javascript
// Old import-concepts-from-text usage
POST /functions/v1/import-concepts-from-text
{ "domainId": "jazz-piano" }

// New unified usage
POST /functions/v1/import-concepts-unified
{ 
  "domainId": "jazz-piano",
  "source": "hardcoded"
}
```

```javascript
// Old import-master-concepts usage  
POST /functions/v1/import-master-concepts
{ "domainId": "jazz-piano" }

// New unified usage
POST /functions/v1/import-concepts-unified
{
  "domainId": "jazz-piano", 
  "source": "gcs",
  "gcsPath": "gs://gemeos-guidance/jazz-piano/guidance/concepts/master_concept_list.md"
}
```

### For Vertex AI Diagnostics
Replace calls to deprecated functions with the unified version:

```javascript
// Old vertex-ai-smoke-test usage
POST /functions/v1/vertex-ai-smoke-test
{ "location": "us-central1", "model": "gemini-2.5-flash" }

// New unified usage
POST /functions/v1/vertex-ai-diagnostics-unified
{
  "mode": "quick",
  "location": "us-central1",
  "model": "gemini-2.5-flash"
}
```

```javascript
// Old vertex-ai-diagnostics usage
POST /functions/v1/vertex-ai-diagnostics
{ "regions": ["us-central1"], "models": ["gemini-2.5-flash"] }

// New unified usage
POST /functions/v1/vertex-ai-diagnostics-unified
{
  "mode": "comprehensive",
  "regions": ["us-central1"],
  "models": ["gemini-2.5-flash"]
}
```

## Improvements in Unified Functions

### import-concepts-unified
- **Flexible source handling**: Supports hardcoded data, GCS downloads, and direct text input
- **Configurable duplicate checking**: Can be enabled/disabled per request
- **Better error handling**: More descriptive error messages and validation
- **Consistent status setting**: Configurable status for imported concepts
- **Enhanced metadata**: Tracks import source and timing in concept metadata

### vertex-ai-diagnostics-unified  
- **Dual mode operation**: Quick smoke test or comprehensive diagnostics in one function
- **Performance metrics**: Includes response time measurements
- **Better error reporting**: Distinguishes between different types of failures
- **Success rate analysis**: Provides statistical summary of test results
- **Actionable recommendations**: Suggests best performing models and regions to avoid

## Database Schema Fixes

The following functions have also been updated to fix database schema mismatches:

- **`enrich-and-save-learning-goals`**: Fixed references to non-existent `teacher_id` field (now uses `created_by`) and `metadata_json` field (now uses `metadata`)

## Restoration Instructions

If you need to restore any deprecated function:
1. Copy the function directory back to the main functions directory
2. Deploy the function using `supabase functions deploy <function-name>`
3. Update any client code to use the original function endpoints

## Safe to Delete?

These functions can be safely deleted after:
1. All client applications have been updated to use the new unified functions
2. No active deployments are calling the deprecated endpoints  
3. At least 30 days have passed since deprecation (current date: 2024-09-02)

**Recommended deletion date: 2024-10-02 or later**