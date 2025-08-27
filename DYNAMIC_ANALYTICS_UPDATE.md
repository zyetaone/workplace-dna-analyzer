# Dynamic Analytics Update

## Summary
Updated the dashboard analytics in `/src/routes/dashboard/dashboard.svelte.ts` to use the question structure dynamically from `/src/lib/questions.ts`. Analytics now automatically adapt to changes in the question structure without requiring manual updates.

## Changes Made

### 1. Imported Dynamic Utility Functions
Added imports from `questions.ts`:
- `calculatePreferenceScores` - Dynamically calculates scores based on actual question values
- `getGenerationFromResponse` - Extracts generation from participant responses
- `GENERATION_OPTIONS` - Dynamic list of available generations
- `GenerationOption` type - Type-safe generation handling

### 2. Updated computeAnalyticsFast() Method

#### Dynamic Generation Distribution
- Now initializes generation options from `GENERATION_OPTIONS` instead of hardcoded values
- Uses `getGenerationFromResponse()` to extract generation from participant responses
- Falls back to stored generation field if responses not available

#### Dynamic Score Calculation
- Uses `calculatePreferenceScores()` to compute scores directly from responses
- Automatically adapts to question structure changes
- Converts between percentage (0-100) and 0-10 scales for compatibility
- Falls back to stored preference scores if responses not available

#### Dynamic Generation Preferences
- Filters participants by generation using `getGenerationFromResponse()`
- Calculates generation-specific scores using `calculatePreferenceScores()`
- Iterates through `GENERATION_OPTIONS` for dynamic generation handling

### 3. Type Safety Improvements
- Uses `GenerationOption` type from questions.ts
- Proper type casting for compatibility with existing interfaces
- Updated method signatures to use dynamic types

## Benefits

### Automatic Adaptation
The analytics now automatically adapt to:
- **Question Reordering**: Questions can be reordered without breaking analytics
- **New Questions**: Adding new questions automatically includes them in score calculations
- **Question Removal**: Removing questions doesn't break the analytics
- **Value Changes**: Changing question scoring values automatically reflects in analytics

### Maintainability
- **Single Source of Truth**: Question structure defined once in `questions.ts`
- **No Hardcoded Indices**: No more manual index mapping
- **Type Safety**: TypeScript ensures type consistency
- **Reduced Duplication**: Calculation logic centralized in utility functions

### Backwards Compatibility
- **Fallback Support**: Works with both new (responses-based) and old (stored scores) data
- **Gradual Migration**: Existing data continues to work while new data uses dynamic calculation
- **No Breaking Changes**: All existing functionality preserved

## How It Works

1. **Participant has responses**: 
   - Converts responses to array format
   - Uses `getGenerationFromResponse()` for generation
   - Uses `calculatePreferenceScores()` for preference scores
   
2. **Participant has no responses** (legacy data):
   - Falls back to stored `generation` field
   - Falls back to stored `preferenceScores` field
   
3. **Score Calculation**:
   - Iterates through actual question structure
   - Skips non-scorable questions (like generation question)
   - Sums values from selected options
   - Normalizes to appropriate scale

## Testing
The implementation has been verified with:
- TypeScript compilation (no errors)
- SvelteKit type checking (passes)
- Manual code review for logic correctness

## Future Considerations
- Consider migrating all stored scores to be recalculated from responses
- Add unit tests for the dynamic calculation functions
- Consider caching calculated scores for performance if needed