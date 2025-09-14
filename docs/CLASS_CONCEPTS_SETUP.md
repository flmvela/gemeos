# Class Concepts System - Setup Guide

## Overview
The Class Concepts System enables dynamic calculation of class difficulty levels based on assigned concepts. Each concept has a difficulty level (1-10), and classes automatically calculate their overall difficulty from their assigned concepts.

## Migration Instructions

### Step 1: Apply Database Migration

1. Navigate to the Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/jfolpnyipoocflcrachg/editor
   ```

2. Copy the entire contents of:
   ```
   /Users/fabiovelardi/gemeos/supabase/migrations/20250111_class_concepts_system.sql
   ```

3. Paste into the SQL Editor and click "Run"

4. Verify the following tables were created:
   - `class_concepts` - Junction table linking classes to concepts
   - `class_difficulty_cache` - Cached difficulty calculations
   - `concept_history` - Audit trail for concept changes
   - `class_concept_history` - Audit trail for class-concept assignments

### Step 2: Test the Implementation

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to a class concepts test page:
   ```
   http://localhost:8080/teacher/classes/{CLASS_ID}/concepts
   ```
   Replace `{CLASS_ID}` with an actual class ID from your database.

## Features Implemented

### 1. Difficulty Levels
Concepts now have 10 difficulty levels:
- **Level 1**: 🌱 Beginner - Foundation level
- **Level 2**: 🌿 Elementary - Basic concepts  
- **Level 3**: 🍃 Easy - Simple applications
- **Level 4**: ⭐ Moderate - Standard level
- **Level 5**: 🌟 Intermediate - Complex concepts
- **Level 6**: 💫 Challenging - Advanced applications
- **Level 7**: 🔥 Difficult - Expert level
- **Level 8**: 🚀 Advanced - Professional level
- **Level 9**: 💎 Expert - Master level
- **Level 10**: 👑 Master - Peak difficulty

### 2. Class Difficulty Overview Component
- Visual representation of class difficulty distribution
- Shows min, max, average, and median difficulty
- Confidence score for suggested difficulty level
- Warnings for extreme difficulty spreads
- Recommendations for improving balance

### 3. Assign Concepts Dialog
- Search and filter concepts by name and difficulty
- Batch assign multiple concepts
- Set concept groups for organization
- Configure estimated hours per concept
- Mark concepts as mandatory or optional

### 4. Enhanced Concept Creation
- Difficulty selector with visual indicators
- Color-coded difficulty badges
- Clear descriptions of each difficulty level

### 5. Class Service API
```typescript
// Assign concepts to a class
await classService.assignConceptsToClass({
  classId: 'class-id',
  concepts: [
    {
      conceptId: 'concept-id',
      sequenceOrder: 0,
      conceptGroup: 'Week 1',
      estimatedHours: 2.0,
      isMandatory: true
    }
  ]
});

// Get class difficulty analysis
const analysis = await classService.getClassDifficulty('class-id');

// Get suggested concepts for target difficulty
const suggestions = await classService.getSuggestedConcepts(
  'class-id',
  targetDifficulty: 5,
  limit: 10
);
```

## Database Schema

### class_concepts table
- Links classes to concepts with additional metadata
- Tracks sequence order, groups, estimated hours
- Supports difficulty overrides per class
- Maintains version history

### Automatic Features
- Difficulty recalculation on concept changes
- 15-minute cache for performance
- Audit trails for all changes
- RLS policies for multi-tenant security

## Testing Checklist

- [ ] Create a new concept with difficulty level
- [ ] Assign multiple concepts to a class
- [ ] View class difficulty analysis
- [ ] Remove concepts from a class
- [ ] Verify difficulty recalculation
- [ ] Test concept filtering by difficulty
- [ ] Check audit trail creation

## Next Steps

1. **Production Deployment**: Run migration in production database
2. **UI Integration**: Add class difficulty badges to class lists
3. **Reporting**: Create difficulty distribution reports
4. **Recommendations**: Implement AI-powered concept suggestions based on target difficulty