# Tailwind CSS 4.0 Modern Concepts & Implementation Guide

## Overview

This guide demonstrates cutting-edge Tailwind CSS 4.0 features and modern patterns that can enhance your Zyeta application. Each concept includes practical examples and implementation details.

## 1. Container Queries (@container)

Container queries allow components to respond to their container's size rather than the viewport.

### Basic Implementation
```html
<!-- Parent container -->
<div class="@container">
  <!-- Child responds to container size -->
  <div class="@sm:text-lg @md:text-xl @lg:text-2xl">
    Text that scales with container
  </div>
</div>
```

### Advanced Container Queries
```html
<div class="@container/sidebar max-w-xs">
  <div class="@sm/sidebar:grid @sm/sidebar:grid-cols-2">
    <div class="@md/sidebar:col-span-2">
      Responsive to named container
    </div>
  </div>
</div>
```

### Practical Example for Zyeta
```svelte
<!-- QuizCard.svelte - Responsive to parent container -->
<div class="@container quiz-card">
  <div class="@sm:p-6 @md:p-8 @lg:flex @lg:items-center @lg:gap-6">
    <div class="@lg:flex-1">
      <h3 class="@sm:text-lg @md:text-xl @lg:text-2xl font-semibold">
        {question.title}
      </h3>
    </div>
    <div class="@sm:mt-4 @lg:mt-0 @lg:w-32">
      <button class="@sm:w-full @lg:w-auto">Answer</button>
    </div>
  </div>
</div>
```

## 2. Dynamic Viewport Units

Modern viewport units that adapt to mobile interfaces and browser UI changes.

### Available Units
- `dvh` - Dynamic Viewport Height (adapts to browser UI)
- `svh` - Small Viewport Height (stable minimum)
- `lvh` - Large Viewport Height (maximum available)
- `dvi`, `svi`, `lvi` - Inline variants

### Implementation
```html
<!-- Mobile-friendly full height -->
<div class="min-h-dvh">
  <!-- Always visible content -->
  <div class="h-svh overflow-auto">
    Content that doesn't get hidden by mobile browser UI
  </div>
</div>
```

### Zyeta Quiz Implementation
```svelte
<!-- MobileQuizLayout.svelte -->
<div class="min-h-dvh bg-slate-900">
  <!-- Header - always visible -->
  <header class="h-16 sticky top-0 bg-slate-800/90 backdrop-blur-sm">
    Quiz Progress
  </header>
  
  <!-- Content area - adapts to browser UI -->
  <main class="h-[calc(100dvh-4rem)] overflow-auto p-4">
    <div class="space-y-6">
      {#each questions as question}
        <QuizCard {question} />
      {/each}
    </div>
  </main>
</div>
```

## 3. Logical Properties

Direction-agnostic CSS properties for better internationalization.

### Available Logical Properties
```css
/* Margins */
mi-4    /* margin-inline: 1rem */
mb-4    /* margin-block: 1rem */
ms-4    /* margin-inline-start: 1rem */
me-4    /* margin-inline-end: 1rem */
mbs-4   /* margin-block-start: 1rem */
mbe-4   /* margin-block-end: 1rem */

/* Padding */
pi-4    /* padding-inline: 1rem */
pb-4    /* padding-block: 1rem */
ps-4    /* padding-inline-start: 1rem */
pe-4    /* padding-inline-end: 1rem */
pbs-4   /* padding-block-start: 1rem */
pbe-4   /* padding-block-end: 1rem */

/* Borders */
border-is    /* border-inline-start */
border-ie    /* border-inline-end */
border-bs    /* border-block-start */
border-be    /* border-block-end */
```

### Practical Example
```svelte
<!-- International-friendly layout -->
<div class="pi-6 border-is-2 border-slate-700">
  <h2 class="mbe-4">Session Settings</h2>
  <div class="space-y-4">
    <input class="w-full pi-4 border border-slate-600 rounded-lg" />
    <div class="flex justify-end gap-3">
      <button class="pi-6 pbs-2 pbe-2">Cancel</button>
      <button class="pi-6 pbs-2 pbe-2 bg-blue-500">Save</button>
    </div>
  </div>
</div>
```

## 4. Text Wrapping & Typography Enhancements

Modern text rendering features for better readability.

### Text Wrapping Classes
```html
<!-- Balanced text - good for headings -->
<h1 class="text-balance">
  Interactive Workplace Assessments That Transform Teams
</h1>

<!-- Pretty text - good for paragraphs -->
<p class="text-pretty">
  This ensures better line breaks and prevents orphaned words at the end of paragraphs.
</p>

<!-- No wrap -->
<span class="text-nowrap">Don't break this text</span>
```

### Advanced Typography
```html
<div class="space-y-4">
  <!-- Display text with optimal wrapping -->
  <h1 class="text-5xl font-bold text-balance leading-tight">
    Discover Your Team's DNA
  </h1>
  
  <!-- Body text with pretty wrapping -->
  <p class="text-lg text-pretty leading-relaxed max-w-2xl">
    Create engaging workplace assessments that reveal deep insights about team preferences, 
    collaboration styles, and workplace culture patterns.
  </p>
  
  <!-- Code or data that shouldn't wrap -->
  <code class="text-nowrap bg-slate-100 px-2 py-1 rounded">
    Session Code: ABC123
  </code>
</div>
```

## 5. :has() Pseudo-Class Support

CSS :has() enables parent selectors and complex state management without JavaScript.

### Basic Usage
```html
<!-- Form validation styling -->
<div class="border border-gray-300 has-[:invalid]:border-red-500">
  <input type="email" required />
</div>

<!-- Card with optional content -->
<div class="card has-[.badge]:pr-12">
  <div class="content">Main content</div>
  <div class="badge absolute top-2 right-2">New</div>
</div>
```

### Advanced State Management
```html
<!-- Complex UI states -->
<div class="sidebar has-[.expanded]:w-64 w-16 transition-all duration-300">
  <button class="toggle">☰</button>
  <nav class="expanded hidden">
    <!-- Navigation items -->
  </nav>
</div>
```

### Zyeta Implementation
```svelte
<!-- Smart quiz option styling -->
<div class="
  quiz-option
  border border-slate-600
  has-[:checked]:border-blue-500
  has-[:checked]:bg-blue-500/10
  has-[:disabled]:opacity-50
  has-[:disabled]:cursor-not-allowed
">
  <input type="radio" name="answer" class="sr-only" />
  <label class="block p-4 cursor-pointer">
    Option text here
  </label>
</div>
```

## 6. Subgrid Support

Subgrid allows nested grid items to align with parent grid lines.

### Basic Subgrid
```html
<div class="grid grid-cols-4 gap-4">
  <div class="col-span-2 grid grid-cols-subgrid gap-4">
    <div>Aligned to parent grid</div>
    <div>Also aligned</div>
  </div>
  <div class="col-span-2">
    Regular grid item
  </div>
</div>
```

### Complex Layout
```html
<!-- Dashboard with aligned content -->
<div class="grid grid-cols-12 gap-6">
  <!-- Main content area using subgrid -->
  <main class="col-span-9 grid grid-cols-subgrid gap-6">
    <header class="col-span-full">Dashboard Title</header>
    <section class="col-span-8">Main content</section>
    <aside class="col-span-4">Secondary info</aside>
  </main>
  
  <!-- Sidebar -->
  <aside class="col-span-3">
    Navigation
  </aside>
</div>
```

## 7. Modern Color Functions

Advanced color mixing and manipulation with CSS.

### Color Mixing
```css
@theme {
  /* Dynamic color mixing */
  --color-primary-hover: color-mix(in srgb, var(--color-primary), white 10%);
  --color-surface-tint: color-mix(in srgb, var(--color-primary), transparent 90%);
  
  /* P3 color space for wider gamut displays */
  --color-accent-p3: color(display-p3 0.7 0.2 0.9);
}
```

### Implementation in Components
```css
.card {
  background: color-mix(in srgb, var(--color-surface), white 5%);
  border: 1px solid color-mix(in srgb, var(--color-primary), transparent 80%);
}

.card:hover {
  background: color-mix(in srgb, var(--color-surface), var(--color-primary) 5%);
}
```

## 8. View Transitions & Scroll-Driven Animations

Modern animation patterns that respond to scroll and view changes.

### Scroll-Driven Animations
```css
@layer utilities {
  .animate-on-scroll {
    animation: fade-in-up linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 50%;
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(2rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### View Transitions
```html
<!-- Smooth page transitions -->
<div style="view-transition-name: page-content">
  <h1 style="view-transition-name: page-title">Page Title</h1>
  <main>Content that smoothly transitions</main>
</div>
```

## 9. Performance Optimizations

Modern CSS features for better performance.

### GPU Acceleration & Containment
```html
<div class="
  will-change-transform
  contain-layout
  contain-style
  contain-paint
">
  High-performance animated content
</div>
```

### Content Visibility
```html
<!-- Skip rendering off-screen content -->
<div class="content-visibility-auto">
  <div class="large-content-area">
    Heavy content that's conditionally rendered
  </div>
</div>
```

## 10. Accessibility Enhancements

Modern patterns for better accessibility.

### Focus Management
```html
<div class="
  focus-within:ring-2
  focus-within:ring-blue-500
  focus-within:ring-offset-2
">
  <input class="focus:outline-none" />
</div>
```

### High Contrast Support
```css
@media (prefers-contrast: high) {
  .card {
    border-width: 2px;
    border-color: currentColor;
  }
}

@media (prefers-color-scheme: dark) {
  .adaptive-card {
    background: color-mix(in srgb, black, white 10%);
  }
}
```

## Implementation Checklist

### Immediate Improvements
- [ ] Add `@container` queries to responsive components
- [ ] Replace `min-h-screen` with `min-h-dvh` for mobile
- [ ] Add `text-balance` to headings
- [ ] Use `:has()` for form validation styling

### Medium-term Enhancements
- [ ] Implement logical properties for internationalization
- [ ] Add subgrid to complex layouts
- [ ] Use color-mix() for dynamic theming
- [ ] Add scroll-driven animations

### Performance Optimizations
- [ ] Add `will-change` to animated elements
- [ ] Use `contain` for performance-critical components
- [ ] Implement critical CSS extraction
- [ ] Add `content-visibility` for long lists

## Browser Support

Most modern features require recent browser versions:

- **Container Queries**: Chrome 105+, Firefox 110+, Safari 16+
- **Dynamic Viewport Units**: Chrome 108+, Firefox 101+, Safari 15.4+
- **:has() Selector**: Chrome 105+, Firefox 121+, Safari 15.4+
- **Subgrid**: Chrome 117+, Firefox 71+, Safari 16+
- **color-mix()**: Chrome 111+, Firefox 113+, Safari 16.2+

Always provide fallbacks for critical functionality:

```css
.modern-layout {
  /* Fallback */
  height: 100vh;
  /* Modern */
  height: 100dvh;
}
```

This guide provides a foundation for implementing cutting-edge Tailwind CSS 4.0 features in your Zyeta application while maintaining compatibility and performance.