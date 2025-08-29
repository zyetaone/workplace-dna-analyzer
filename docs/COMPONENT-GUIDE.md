# Component Guide - Modern Svelte 5 UI Components

This guide documents the new reusable UI components built with modern Svelte 5 patterns including snippets, runes, and consistent design system integration.

## 🎯 Overview

The component library provides consistent, accessible, and performant UI elements that follow:

- **Svelte 5 Runes**: `$state`, `$derived`, `$props` for reactive state management
- **Snippet Patterns**: `{#snippet}` blocks for reusable template sections
- **Design System**: Consistent colors, sizing, and variant patterns
- **Accessibility**: WCAG 2.1 AA compliant with proper ARIA support
- **TypeScript**: Fully typed interfaces and props

## 📋 Form Components

### FormField

Consistent form input component with validation and multiple variants.

```svelte
<FormField
  label="Full Name"
  bind:value={formData.name}
  placeholder="Enter your full name"
  required={true}
  variant="default"
  error={validationError}
/>
```

**Props:**
- `label: string` - Field label text
- `value: string` (bindable) - Input value
- `type?: string` - Input type (default: 'text')
- `placeholder?: string` - Placeholder text
- `required?: boolean` - Required field indicator
- `disabled?: boolean` - Disabled state
- `error?: string | null` - Error message
- `variant?: 'default' | 'compact'` - Visual variant

### SelectField

Dropdown selection with consistent styling.

```svelte
<SelectField
  label="Category"
  bind:value={selectedCategory}
  options={categoryOptions}
  placeholder="Choose a category..."
  required={true}
/>
```

**Options Format:**
```typescript
interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}
```

### ActionButton

Consistent button component with loading states and variants.

```svelte
<ActionButton
  variant="primary"
  loading={isProcessing}
  loadingText="Processing..."
  onclick={handleSubmit}
  icon="💾"
  fullWidth={true}
>
  Save Changes
</ActionButton>
```

**Variants:** `primary`, `secondary`, `destructive`, `outline`, `ghost`  
**Sizes:** `sm`, `default`, `lg`

## 🔄 State Components

### LoadingState

Unified loading display with multiple variants and sizes.

```svelte
<LoadingState
  title="Loading Data"
  message="Please wait while we fetch your information..."
  variant="spinner"
  size="lg"
  animated={true}
/>
```

**Variants:** `spinner`, `dots`, `pulse`, `skeleton`  
**Sizes:** `xs`, `sm`, `default`, `lg`, `xl`

### ErrorState

Consistent error display with retry functionality.

```svelte
<ErrorState
  title="Something went wrong"
  message="Unable to load data. Please try again."
  variant="detailed"
  showRetry={true}
  onRetry={handleRetry}
/>
```

**Variants:** `default`, `minimal`, `detailed`, `inline`

## 📊 Data Visualization

### ScoreDisplay

Preference score visualization with multiple display modes.

```svelte
<ScoreDisplay
  scores={participantScores}
  maxScore={10}
  variant="cards"
  showLabels={true}
  showValues={true}
  showProgress={true}
  animated={true}
/>
```

**Score Interface:**
```typescript
interface PreferenceScores {
  collaboration: number;
  formality: number;
  tech: number;
  wellness: number;
}
```

**Variants:** `bars`, `cards`, `compact`, `circular`  
**Layouts:** `grid`, `horizontal`, `vertical`

### ParticipantCard

Individual participant display with actions and score visualization.

```svelte
<ParticipantCard
  participant={participantData}
  showScores={true}
  compact={false}
  onDelete={handleDelete}
  onCopyLink={handleCopyLink}
/>
```

## 🎨 Svelte 5 Patterns Used

### 1. Snippets for Reusability

Components use snippets for repeated UI patterns:

```svelte
{#snippet errorMessage()}
  {#if error}
    <p class="text-red-600" role="alert">{error}</p>
  {/if}
{/snippet}

<!-- Use the snippet -->
{@render errorMessage()}
```

### 2. Runes for Reactivity

Modern state management with Svelte 5 runes:

```svelte
<script>
  let isLoading = $state(false);
  let buttonText = $derived(isLoading ? 'Loading...' : 'Submit');
  let { data } = $props();
</script>
```

### 3. Conditional Snippets

Dynamic snippet rendering based on conditions:

```svelte
{#snippet loadingSpinner()}
  <div class="animate-spin rounded-full h-4 w-4 border-b-2"></div>
{/snippet}

{#if isLoading}
  {@render loadingSpinner()}
{/if}
```

### 4. Snippet Parameters

Parameterized snippets for flexible rendering:

```svelte
{#snippet scoreCard(score, label, color)}
  <div class="score-card {color}">
    <div class="score-value">{score}</div>
    <div class="score-label">{label}</div>
  </div>
{/snippet}

{@render scoreCard(8.5, "Collaboration", "blue")}
```

## 🎯 Design System Integration

### Color Schemes

Components support consistent color schemes:

```typescript
const colorSchemes = {
  gray: { border: 'border-gray-200', text: 'text-gray-700' },
  blue: { border: 'border-blue-200', text: 'text-blue-700' },
  green: { border: 'border-green-200', text: 'text-green-700' }
};
```

### Size Variants

Consistent sizing across all components:

```typescript
const sizes = {
  sm: { padding: 'p-2', text: 'text-sm' },
  default: { padding: 'p-4', text: 'text-base' },
  lg: { padding: 'p-6', text: 'text-lg' }
};
```

## ♿ Accessibility Features

All components include:

- **ARIA Labels**: Proper labeling for screen readers
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Visible focus indicators
- **Error Announcements**: Role="alert" for error messages
- **Loading States**: Aria-busy attributes during processing

## 🚀 Performance Optimizations

- **Lazy Loading**: Components render efficiently with minimal DOM updates
- **Event Delegation**: Optimized event handling
- **State Batching**: Efficient reactive updates with runes
- **CSS-in-JS Avoidance**: Pure Tailwind CSS for better performance

## 🔧 Migration Guide

### From Old Patterns to New

**Before (Traditional):**
```svelte
<button disabled={loading} onclick={handleClick}>
  {#if loading}Loading...{:else}Submit{/if}
</button>
```

**After (Modern):**
```svelte
<ActionButton
  loading={isProcessing}
  loadingText="Processing..."
  onclick={handleSubmit}
>
  Submit
</ActionButton>
```

### Importing Components

```svelte
<script>
  import { 
    FormField, 
    ActionButton, 
    LoadingState,
    ScoreDisplay 
  } from '$lib/components';
</script>
```

## 📱 Demo Page

Visit `/demo` to see all components in action with interactive examples and code snippets.

## 🔗 Integration Examples

### Form with Validation

```svelte
<script>
  let formData = $state({ name: '', email: '' });
  let errors = $state({});
  let isSubmitting = $state(false);
</script>

<form onsubmit={handleSubmit}>
  <FormField
    label="Name"
    bind:value={formData.name}
    error={errors.name}
    required
  />
  
  <FormField
    label="Email"
    type="email"
    bind:value={formData.email}
    error={errors.email}
    required
  />
  
  <ActionButton
    type="submit"
    loading={isSubmitting}
    disabled={!isFormValid}
    fullWidth
  >
    Submit
  </ActionButton>
</form>
```

### Participant Management

```svelte
<script>
  let participants = $state([]);
  let loading = $derived(adminState.loading);
</script>

{#if loading}
  <LoadingState message="Loading participants..." />
{:else if error}
  <ErrorState 
    message={error} 
    onRetry={loadParticipants}
    showRetry={true} 
  />
{:else}
  {#each participants as participant}
    <ParticipantCard
      {participant}
      showScores={true}
      onDelete={handleDelete}
      onCopyLink={copyParticipantLink}
    />
  {/each}
{/if}
```

This component library provides a solid foundation for modern Svelte 5 applications with consistent design, excellent accessibility, and optimal performance.