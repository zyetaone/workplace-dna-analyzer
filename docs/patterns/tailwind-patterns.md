# Tailwind CSS Patterns Guide for Zyeta

A comprehensive guide to modern Tailwind CSS patterns for building consistent, performant UI components in the Zyeta workplace intelligence platform.

## 1. Component Variant Pattern

Use data attributes and Tailwind's arbitrary property selectors for flexible component variants.

### Button Component with Variants

```svelte
<!-- Button.svelte -->
<script lang="ts">
  interface Props {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    children?: any;
  }

  let { 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    disabled = false,
    children,
    ...rest 
  }: Props = $props();
</script>

<button
  data-variant={variant}
  data-size={size}
  data-loading={loading}
  disabled={disabled || loading}
  class="
    relative inline-flex items-center justify-center font-medium
    transition-all duration-200 rounded-lg
    disabled:opacity-50 disabled:cursor-not-allowed
    
    /* Size variants */
    data-[size=sm]:px-3 data-[size=sm]:py-1.5 data-[size=sm]:text-sm
    data-[size=md]:px-4 data-[size=md]:py-2 data-[size=md]:text-base
    data-[size=lg]:px-6 data-[size=lg]:py-3 data-[size=lg]:text-lg
    
    /* Color variants */
    data-[variant=primary]:bg-blue-600 data-[variant=primary]:text-white
    data-[variant=primary]:hover:bg-blue-700 data-[variant=primary]:active:bg-blue-800
    data-[variant=primary]:focus-visible:ring-2 data-[variant=primary]:focus-visible:ring-blue-500
    
    data-[variant=secondary]:bg-gray-100 data-[variant=secondary]:text-gray-900
    data-[variant=secondary]:hover:bg-gray-200 data-[variant=secondary]:active:bg-gray-300
    data-[variant=secondary]:focus-visible:ring-2 data-[variant=secondary]:focus-visible:ring-gray-500
    
    data-[variant=ghost]:bg-transparent data-[variant=ghost]:text-gray-700
    data-[variant=ghost]:hover:bg-gray-100 data-[variant=ghost]:active:bg-gray-200
    
    data-[variant=danger]:bg-red-600 data-[variant=danger]:text-white
    data-[variant=danger]:hover:bg-red-700 data-[variant=danger]:active:bg-red-800
    
    /* Loading state */
    data-[loading=true]:text-transparent
  "
  {...rest}
>
  {#if loading}
    <div class="absolute inset-0 flex items-center justify-center">
      <svg class="animate-spin h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
    </div>
  {/if}
  {@render children?.()}
</button>
```

### Card Component with States

```svelte
<!-- Card.svelte -->
<script lang="ts">
  interface Props {
    interactive?: boolean;
    selected?: boolean;
    disabled?: boolean;
    children?: any;
  }

  let { interactive = false, selected = false, disabled = false, children }: Props = $props();
</script>

<div
  data-interactive={interactive}
  data-selected={selected}
  data-disabled={disabled}
  class="
    bg-white rounded-xl border p-6 transition-all duration-200
    
    /* Default state */
    border-gray-200
    
    /* Interactive states */
    data-[interactive=true]:cursor-pointer
    data-[interactive=true]:hover:border-blue-300
    data-[interactive=true]:hover:shadow-lg
    data-[interactive=true]:hover:-translate-y-0.5
    
    /* Selected state */
    data-[selected=true]:border-blue-500
    data-[selected=true]:bg-blue-50
    data-[selected=true]:shadow-md
    
    /* Disabled state */
    data-[disabled=true]:opacity-50
    data-[disabled=true]:cursor-not-allowed
    data-[disabled=true]:hover:border-gray-200
    data-[disabled=true]:hover:shadow-none
    data-[disabled=true]:hover:translate-y-0
  "
>
  {@render children?.()}
</div>
```

## 2. Container Query Pattern

Responsive components based on their container size, not viewport.

### Container Query Setup

```css
/* app.css - Enable container queries */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  /* Container query utilities */
  .container-type-inline {
    container-type: inline-size;
  }
  
  .container-type-size {
    container-type: size;
  }
  
  .container-type-normal {
    container-type: normal;
  }
}
```

### Responsive Card Grid

```svelte
<!-- ResponsiveCardGrid.svelte -->
<div class="container-type-inline">
  <div class="
    grid gap-4
    @container 
    @sm:grid-cols-1
    @md:grid-cols-2
    @lg:grid-cols-3
    @xl:grid-cols-4
  ">
    {#each items as item}
      <div class="
        bg-white rounded-lg p-4 shadow-sm
        @container
      ">
        <!-- Card adapts based on its own container size -->
        <h3 class="font-semibold @sm:text-base @md:text-lg @lg:text-xl">
          {item.title}
        </h3>
        <p class="text-gray-600 @sm:text-sm @md:text-base @sm:mt-2 @md:mt-3">
          {item.description}
        </p>
        <div class="@sm:hidden @md:block mt-4">
          <!-- Show details only when card has enough space -->
          <span class="text-sm text-gray-500">{item.details}</span>
        </div>
      </div>
    {/each}
  </div>
</div>
```

### Adaptive Dashboard Widget

```svelte
<!-- DashboardWidget.svelte -->
<div class="container-type-inline bg-white rounded-xl shadow-sm">
  <div class="
    p-4
    @container
    @sm:space-y-4
    @md:flex @md:items-center @md:justify-between @md:space-y-0
  ">
    <!-- Compact view on small containers -->
    <div class="@sm:text-center @md:text-left">
      <h3 class="text-gray-500 text-sm uppercase tracking-wide">
        Total Sessions
      </h3>
      <p class="@sm:text-2xl @md:text-3xl @lg:text-4xl font-bold text-gray-900">
        1,234
      </p>
    </div>
    
    <!-- Chart appears when container is large enough -->
    <div class="@sm:hidden @lg:block">
      <div class="w-32 h-20">
        <!-- Mini chart component -->
      </div>
    </div>
  </div>
</div>
```

## 3. Dark Mode Pattern

Comprehensive dark mode implementation with system preference detection.

### Theme Setup with CSS Variables

```css
/* app.css - Theme variables */
@layer base {
  :root {
    --color-background: 255 255 255; /* white */
    --color-foreground: 17 24 39; /* gray-900 */
    --color-card: 249 250 251; /* gray-50 */
    --color-card-hover: 243 244 246; /* gray-100 */
    --color-border: 229 231 235; /* gray-200 */
    --color-primary: 37 99 235; /* blue-600 */
    --color-primary-hover: 29 78 216; /* blue-700 */
  }

  .dark {
    --color-background: 17 24 39; /* gray-900 */
    --color-foreground: 243 244 246; /* gray-100 */
    --color-card: 31 41 55; /* gray-800 */
    --color-card-hover: 55 65 81; /* gray-700 */
    --color-border: 75 85 99; /* gray-600 */
    --color-primary: 59 130 246; /* blue-500 */
    --color-primary-hover: 96 165 250; /* blue-400 */
  }
}

@layer utilities {
  .bg-background {
    background-color: rgb(var(--color-background));
  }
  .text-foreground {
    color: rgb(var(--color-foreground));
  }
  .bg-card {
    background-color: rgb(var(--color-card));
  }
  .border-border {
    border-color: rgb(var(--color-border));
  }
}
```

### Dark Mode Toggle Component

```svelte
<!-- ThemeToggle.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  
  let theme = $state<'light' | 'dark' | 'system'>('system');
  
  onMount(() => {
    // Check saved preference or system preference
    const saved = localStorage.getItem('theme');
    if (saved) {
      theme = saved as typeof theme;
    }
    applyTheme();
  });
  
  function applyTheme() {
    const root = document.documentElement;
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
    
    localStorage.setItem('theme', theme);
  }
  
  $effect(() => {
    applyTheme();
  });
</script>

<button
  onclick={() => {
    const modes = ['light', 'dark', 'system'];
    const current = modes.indexOf(theme);
    theme = modes[(current + 1) % modes.length] as typeof theme;
  }}
  class="
    p-2 rounded-lg transition-colors
    bg-gray-100 hover:bg-gray-200
    dark:bg-gray-800 dark:hover:bg-gray-700
  "
  aria-label="Toggle theme"
>
  {#if theme === 'light'}
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0z"/>
    </svg>
  {:else if theme === 'dark'}
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
    </svg>
  {:else}
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M5 2a1 1 0 011 1v1h8V3a1 1 0 112 0v1h1a2 2 0 012 2v10a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 011-1z"/>
    </svg>
  {/if}
</button>
```

### Dark Mode Card Component

```svelte
<!-- DarkModeCard.svelte -->
<div class="
  bg-white dark:bg-gray-800
  border border-gray-200 dark:border-gray-700
  text-gray-900 dark:text-gray-100
  rounded-xl p-6 shadow-sm
  hover:shadow-md dark:hover:shadow-xl
  hover:border-blue-500 dark:hover:border-blue-400
  transition-all duration-200
">
  <h3 class="text-xl font-semibold mb-2">
    Adaptive Card
  </h3>
  <p class="text-gray-600 dark:text-gray-400">
    This card adapts to light and dark themes seamlessly.
  </p>
  
  <div class="mt-4 flex gap-2">
    <span class="
      px-2 py-1 rounded-full text-xs font-medium
      bg-blue-100 text-blue-800
      dark:bg-blue-900 dark:text-blue-200
    ">
      Active
    </span>
    <span class="
      px-2 py-1 rounded-full text-xs font-medium
      bg-green-100 text-green-800
      dark:bg-green-900 dark:text-green-200
    ">
      Complete
    </span>
  </div>
</div>
```

## 4. Animation Patterns

Modern animation patterns for smooth, performant interactions.

### Entrance Animations

```svelte
<!-- EntranceAnimations.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  
  let visible = $state(false);
  
  onMount(() => {
    // Trigger animation after mount
    visible = true;
  });
</script>

<!-- Fade in from bottom -->
<div class="
  transition-all duration-700 ease-out
  {visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
">
  <h2 class="text-2xl font-bold">Welcome to Zyeta</h2>
</div>

<!-- Staggered list animation -->
<ul class="space-y-2">
  {#each items as item, i}
    <li 
      class="
        transition-all duration-500 ease-out
        {visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
      "
      style="transition-delay: {i * 100}ms"
    >
      {item.name}
    </li>
  {/each}
</ul>

<!-- Scale and fade entrance -->
<div class="
  transition-all duration-500 ease-out
  {visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
">
  <Card />
</div>
```

### Micro-interactions

```svelte
<!-- MicroInteractions.svelte -->

<!-- Hover lift effect -->
<button class="
  px-4 py-2 bg-blue-600 text-white rounded-lg
  transition-all duration-200 ease-out
  hover:-translate-y-0.5 hover:shadow-lg
  active:translate-y-0 active:shadow-md
">
  Click Me
</button>

<!-- Icon rotation on hover -->
<button class="
  group flex items-center gap-2 px-4 py-2
  bg-gray-100 rounded-lg
  hover:bg-gray-200 transition-colors
">
  <span>Refresh</span>
  <svg 
    class="w-4 h-4 transition-transform duration-500 group-hover:rotate-180"
    fill="currentColor" 
    viewBox="0 0 20 20"
  >
    <path d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1z"/>
  </svg>
</button>

<!-- Pulse effect for notifications -->
<div class="relative">
  <span class="absolute -top-1 -right-1 flex h-3 w-3">
    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
    <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
  </span>
  <button class="p-2 bg-gray-100 rounded-lg">
    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z"/>
    </svg>
  </button>
</div>
```

### Loading States

```svelte
<!-- LoadingStates.svelte -->

<!-- Skeleton Screen -->
<div class="animate-pulse">
  <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div class="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
  <div class="h-32 bg-gray-200 rounded mb-2"></div>
  <div class="flex gap-2">
    <div class="h-8 bg-gray-200 rounded w-20"></div>
    <div class="h-8 bg-gray-200 rounded w-20"></div>
  </div>
</div>

<!-- Spinner Overlay -->
<div class="relative">
  <div class="opacity-50 pointer-events-none">
    <!-- Your content here -->
  </div>
  <div class="absolute inset-0 flex items-center justify-center">
    <div class="
      w-12 h-12 rounded-full border-4 
      border-gray-200 border-t-blue-600
      animate-spin
    "></div>
  </div>
</div>

<!-- Progress Bar -->
<div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
  <div 
    class="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
    style="width: {progress}%"
  >
    <div class="h-full bg-white/30 animate-pulse"></div>
  </div>
</div>

<!-- Loading Dots -->
<div class="flex gap-1">
  {#each [0, 1, 2] as i}
    <div 
      class="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
      style="animation-delay: {i * 100}ms"
    ></div>
  {/each}
</div>
```

## 5. Form Patterns

Modern, accessible form components with Tailwind.

### Input Field with States

```svelte
<!-- FormInput.svelte -->
<script lang="ts">
  interface Props {
    label: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
  }
  
  let { label, error, required = false, disabled = false }: Props = $props();
  let value = $state('');
  let focused = $state(false);
</script>

<div class="relative">
  <label class="
    absolute left-3 transition-all duration-200 pointer-events-none
    {focused || value 
      ? '-top-2 text-xs bg-white px-1 text-blue-600' 
      : 'top-3 text-base text-gray-500'}
  ">
    {label}
    {#if required}
      <span class="text-red-500 ml-0.5">*</span>
    {/if}
  </label>
  
  <input
    bind:value
    onfocus={() => focused = true}
    onblur={() => focused = false}
    {disabled}
    class="
      w-full px-3 py-3 border rounded-lg transition-all duration-200
      bg-white disabled:bg-gray-50 disabled:cursor-not-allowed
      {error 
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}
      focus:outline-none focus:ring-2 focus:ring-opacity-50
    "
  />
  
  {#if error}
    <p class="mt-1 text-sm text-red-600 flex items-center gap-1">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"/>
      </svg>
      {error}
    </p>
  {/if}
</div>
```

### Radio Group Pattern

```svelte
<!-- RadioGroup.svelte -->
<script lang="ts">
  interface Option {
    value: string;
    label: string;
    description?: string;
  }
  
  interface Props {
    options: Option[];
    name: string;
  }
  
  let { options, name }: Props = $props();
  let selected = $state('');
</script>

<fieldset class="space-y-2">
  {#each options as option}
    <label class="
      relative flex items-start p-4 rounded-lg border cursor-pointer
      transition-all duration-200
      {selected === option.value 
        ? 'border-blue-500 bg-blue-50' 
        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
    ">
      <input
        type="radio"
        {name}
        value={option.value}
        bind:group={selected}
        class="sr-only"
      />
      
      <div class="
        flex items-center justify-center w-4 h-4 rounded-full border-2
        transition-all duration-200 mr-3 mt-0.5
        {selected === option.value 
          ? 'border-blue-500 bg-blue-500' 
          : 'border-gray-300'}
      ">
        {#if selected === option.value}
          <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
        {/if}
      </div>
      
      <div class="flex-1">
        <p class="font-medium {selected === option.value ? 'text-blue-900' : 'text-gray-900'}">
          {option.label}
        </p>
        {#if option.description}
          <p class="text-sm {selected === option.value ? 'text-blue-700' : 'text-gray-500'}">
            {option.description}
          </p>
        {/if}
      </div>
    </label>
  {/each}
</fieldset>
```

### File Upload Pattern

```svelte
<!-- FileUpload.svelte -->
<script lang="ts">
  let files = $state<FileList | null>(null);
  let dragging = $state(false);
  
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    files = e.dataTransfer?.files || null;
  }
</script>

<div
  ondrop={handleDrop}
  ondragover|preventDefault={() => dragging = true}
  ondragleave={() => dragging = false}
  class="
    relative border-2 border-dashed rounded-lg p-8
    transition-all duration-200 cursor-pointer
    {dragging 
      ? 'border-blue-500 bg-blue-50' 
      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}
  "
>
  <input
    type="file"
    bind:files
    multiple
    class="sr-only"
    id="file-upload"
  />
  
  <label for="file-upload" class="cursor-pointer">
    <div class="flex flex-col items-center">
      <svg class="w-12 h-12 text-gray-400 mb-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M16.88 9.94a.5.5 0 01-.86.5l-2.52-4.35v8.41a.5.5 0 01-1 0V6.09l-2.52 4.35a.5.5 0 01-.86-.5l3.44-5.94a.5.5 0 01.86 0l3.44 5.94z"/>
      </svg>
      
      <p class="text-lg font-medium text-gray-900">
        Drop files here or click to upload
      </p>
      <p class="text-sm text-gray-500 mt-1">
        PNG, JPG, PDF up to 10MB
      </p>
    </div>
  </label>
  
  {#if files}
    <div class="mt-4 space-y-2">
      {#each Array.from(files) as file}
        <div class="flex items-center gap-2 p-2 bg-gray-100 rounded">
          <svg class="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a2 2 0 00-2 2v1H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2V4a2 2 0 00-2-2H9z"/>
          </svg>
          <span class="text-sm text-gray-700 flex-1">{file.name}</span>
          <span class="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
        </div>
      {/each}
    </div>
  {/if}
</div>
```

## 6. Layout Patterns

Modern layout patterns for dashboards and applications.

### Dashboard Layout

```svelte
<!-- DashboardLayout.svelte -->
<div class="min-h-screen bg-gray-50 flex">
  <!-- Sidebar -->
  <aside class="
    w-64 bg-white border-r border-gray-200
    flex flex-col
  ">
    <!-- Logo -->
    <div class="h-16 flex items-center px-6 border-b border-gray-200">
      <h1 class="text-xl font-bold text-gray-900">Zyeta</h1>
    </div>
    
    <!-- Navigation -->
    <nav class="flex-1 p-4 space-y-1">
      {#each navItems as item}
        <a
          href={item.href}
          class="
            flex items-center gap-3 px-3 py-2 rounded-lg
            transition-colors duration-200
            {item.active 
              ? 'bg-blue-50 text-blue-700' 
              : 'text-gray-700 hover:bg-gray-100'}
          "
        >
          {@html item.icon}
          <span class="font-medium">{item.label}</span>
        </a>
      {/each}
    </nav>
    
    <!-- User section -->
    <div class="p-4 border-t border-gray-200">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-gray-300"></div>
        <div>
          <p class="text-sm font-medium text-gray-900">John Doe</p>
          <p class="text-xs text-gray-500">Admin</p>
        </div>
      </div>
    </div>
  </aside>
  
  <!-- Main content -->
  <div class="flex-1 flex flex-col">
    <!-- Header -->
    <header class="
      h-16 bg-white border-b border-gray-200
      flex items-center justify-between px-6
    ">
      <h2 class="text-lg font-semibold text-gray-900">Dashboard</h2>
      
      <div class="flex items-center gap-4">
        <button class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <svg class="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z"/>
          </svg>
        </button>
      </div>
    </header>
    
    <!-- Page content -->
    <main class="flex-1 p-6 overflow-auto">
      <slot />
    </main>
  </div>
</div>
```

### Sticky Header/Sidebar Pattern

```svelte
<!-- StickyLayout.svelte -->
<div class="min-h-screen bg-gray-50">
  <!-- Sticky header -->
  <header class="
    sticky top-0 z-40 
    bg-white/80 backdrop-blur-md
    border-b border-gray-200
    shadow-sm
  ">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
      <h1 class="text-xl font-semibold">Zyeta Workplace Intelligence</h1>
    </div>
  </header>
  
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="flex gap-8">
      <!-- Sticky sidebar -->
      <aside class="w-64 shrink-0">
        <div class="sticky top-24">
          <nav class="space-y-2">
            <!-- Navigation items -->
          </nav>
        </div>
      </aside>
      
      <!-- Scrollable content -->
      <main class="flex-1 min-w-0">
        <slot />
      </main>
    </div>
  </div>
</div>
```

### Modal/Overlay Pattern

```svelte
<!-- Modal.svelte -->
<script lang="ts">
  interface Props {
    open: boolean;
    onClose: () => void;
    title?: string;
    children?: any;
  }
  
  let { open, onClose, title, children }: Props = $props();
</script>

{#if open}
  <!-- Backdrop -->
  <div
    class="
      fixed inset-0 z-50 
      bg-black/50 backdrop-blur-sm
      animate-in fade-in duration-200
    "
    onclick={onClose}
  >
    <!-- Modal -->
    <div
      class="
        fixed left-1/2 top-1/2 z-50
        -translate-x-1/2 -translate-y-1/2
        w-full max-w-lg
        animate-in zoom-in-95 slide-in-from-bottom-2 duration-300
      "
      onclick|stopPropagation
    >
      <div class="
        bg-white rounded-xl shadow-xl
        max-h-[90vh] overflow-hidden
        flex flex-col
      ">
        {#if title}
          <div class="
            flex items-center justify-between
            px-6 py-4 border-b border-gray-200
          ">
            <h2 class="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onclick={onClose}
              class="
                p-1 hover:bg-gray-100 rounded-lg
                transition-colors
              "
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
              </svg>
            </button>
          </div>
        {/if}
        
        <div class="p-6 overflow-auto">
          {@render children?.()}
        </div>
      </div>
    </div>
  </div>
{/if}
```

## 7. Typography Patterns

Modern typography with fluid sizing and content styling.

### Fluid Typography with Clamp

```css
/* app.css - Fluid typography system */
@layer utilities {
  .text-fluid-xs {
    font-size: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);
  }
  
  .text-fluid-sm {
    font-size: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  }
  
  .text-fluid-base {
    font-size: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);
  }
  
  .text-fluid-lg {
    font-size: clamp(1.125rem, 1rem + 0.625vw, 1.25rem);
  }
  
  .text-fluid-xl {
    font-size: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  }
  
  .text-fluid-2xl {
    font-size: clamp(1.5rem, 1.2rem + 1.5vw, 2rem);
  }
  
  .text-fluid-3xl {
    font-size: clamp(1.875rem, 1.5rem + 1.875vw, 2.5rem);
  }
  
  .text-fluid-4xl {
    font-size: clamp(2.25rem, 1.8rem + 2.25vw, 3rem);
  }
}
```

### Prose Content Styling

```svelte
<!-- ProseContent.svelte -->
<article class="
  prose prose-gray max-w-none
  prose-headings:font-bold prose-headings:tracking-tight
  prose-h1:text-3xl prose-h1:mb-4
  prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
  prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
  prose-p:text-gray-600 prose-p:leading-relaxed
  prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
  prose-strong:text-gray-900 prose-strong:font-semibold
  prose-ul:list-disc prose-ul:pl-6
  prose-ol:list-decimal prose-ol:pl-6
  prose-li:my-2
  prose-blockquote:border-l-4 prose-blockquote:border-blue-500
  prose-blockquote:pl-4 prose-blockquote:italic
  prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5
  prose-code:rounded prose-code:text-sm
  prose-pre:bg-gray-900 prose-pre:text-gray-100
">
  {@html content}
</article>
```

### Text Truncation Patterns

```svelte
<!-- TextTruncation.svelte -->

<!-- Single line truncation -->
<p class="truncate max-w-xs">
  This is a very long text that will be truncated with an ellipsis when it exceeds the container width
</p>

<!-- Multi-line truncation (line clamp) -->
<p class="line-clamp-3">
  This is a longer paragraph that will be clamped to exactly three lines.
  Any content beyond the third line will be hidden and replaced with an ellipsis.
  This is useful for card descriptions and preview text.
</p>

<!-- Custom line clamp with expand -->
<script lang="ts">
  let expanded = $state(false);
</script>

<div>
  <p class="{expanded ? '' : 'line-clamp-2'}">
    {longText}
  </p>
  <button
    onclick={() => expanded = !expanded}
    class="text-blue-600 hover:text-blue-700 text-sm font-medium mt-1"
  >
    {expanded ? 'Show less' : 'Show more'}
  </button>
</div>
```

## 8. Performance Patterns

Optimize Tailwind usage for better performance.

### Avoiding Dynamic Classes

```svelte
<!-- ❌ BAD: Dynamic class strings -->
<div class="bg-{color}-500 p-{size}">
  Don't do this - these classes won't be included in production
</div>

<!-- ✅ GOOD: Use complete class names -->
<script lang="ts">
  const colorClasses = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500'
  };
  
  const sizeClasses = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6'
  };
</script>

<div class="{colorClasses[color]} {sizeClasses[size]}">
  This will work in production
</div>

<!-- ✅ BETTER: Use CSS variables for truly dynamic values -->
<div 
  class="bg-[var(--color)] p-[var(--padding)]"
  style="--color: {dynamicColor}; --padding: {dynamicPadding}px"
>
  Perfect for dynamic values
</div>
```

### Using CSS Variables for Dynamic Values

```svelte
<!-- DynamicStyles.svelte -->
<script lang="ts">
  let progress = $state(0);
  let hue = $state(200);
  let scale = $state(1);
</script>

<style>
  /* Define CSS variables in component */
  .dynamic-card {
    --progress: 0%;
    --hue: 200;
    --scale: 1;
  }
</style>

<!-- Progress bar with dynamic width -->
<div class="w-full bg-gray-200 rounded-full overflow-hidden">
  <div 
    class="h-2 bg-blue-600 transition-all duration-300"
    style="width: {progress}%"
  />
</div>

<!-- Dynamic color with HSL -->
<div 
  class="p-4 rounded-lg transition-colors duration-300"
  style="background-color: hsl({hue}, 70%, 50%)"
>
  Dynamic color based on hue: {hue}
</div>

<!-- Dynamic transform -->
<div 
  class="w-32 h-32 bg-blue-500 rounded-lg transition-transform"
  style="transform: scale({scale})"
>
  Scale: {scale}
</div>

<!-- Complex dynamic styling -->
<div
  class="
    relative w-64 h-64 rounded-xl
    bg-gradient-to-br from-[var(--from-color)] to-[var(--to-color)]
    shadow-[0_0_var(--glow-size)_var(--glow-color)]
  "
  style="
    --from-color: hsl({hue}, 70%, 50%);
    --to-color: hsl({hue + 60}, 70%, 50%);
    --glow-size: {scale * 20}px;
    --glow-color: hsla({hue}, 70%, 50%, 0.5);
  "
>
  Complex dynamic gradient and glow
</div>
```

### Efficient Hover/Focus States

```svelte
<!-- EfficientStates.svelte -->

<!-- Group hover for complex components -->
<div class="group p-4 border rounded-lg hover:border-blue-500 transition-colors">
  <h3 class="font-semibold group-hover:text-blue-600 transition-colors">
    Card Title
  </h3>
  <p class="text-gray-600 group-hover:text-gray-900 transition-colors">
    Card description that changes on parent hover
  </p>
  <button class="
    mt-4 opacity-0 group-hover:opacity-100
    transition-opacity duration-200
    px-4 py-2 bg-blue-600 text-white rounded
  ">
    Hidden until hover
  </button>
</div>

<!-- Peer states for sibling elements -->
<div class="flex items-center gap-2">
  <input 
    type="checkbox" 
    id="terms" 
    class="peer"
  />
  <label 
    for="terms"
    class="
      text-gray-600 
      peer-checked:text-blue-600 
      peer-checked:font-semibold
      transition-all
    "
  >
    I agree to the terms
  </label>
</div>

<!-- Focus-within for form groups -->
<div class="
  p-4 border rounded-lg transition-all
  focus-within:border-blue-500 
  focus-within:shadow-lg
  focus-within:bg-blue-50
">
  <label class="block text-sm font-medium text-gray-700 mb-2">
    Email
  </label>
  <input 
    type="email" 
    class="w-full px-3 py-2 border-0 focus:outline-none bg-transparent"
    placeholder="Enter your email"
  />
</div>

<!-- Has pseudo-class for conditional styling -->
<fieldset class="
  p-4 border rounded-lg
  has-[:checked]:border-blue-500
  has-[:checked]:bg-blue-50
">
  <legend class="text-sm font-medium">Select an option</legend>
  <div class="space-y-2 mt-2">
    <label class="flex items-center gap-2">
      <input type="radio" name="option" />
      <span>Option 1</span>
    </label>
    <label class="flex items-center gap-2">
      <input type="radio" name="option" />
      <span>Option 2</span>
    </label>
  </div>
</fieldset>
```

## Tailwind Configuration

```javascript
// tailwind.config.js
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Custom animations
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'zoom-in': 'zoom-in 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'zoom-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      // Container queries
      containers: {
        xs: '20rem',
        sm: '24rem',
        md: '28rem',
        lg: '32rem',
        xl: '36rem',
        '2xl': '42rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
};
```

## Usage in Zyeta App

### Quick Implementation Checklist

1. **Replace custom button styles** with the Button component variant pattern
2. **Update cards** to use the data-attribute pattern for states
3. **Implement container queries** for responsive dashboard widgets
4. **Add dark mode** support using CSS variables and dark: modifiers
5. **Replace custom animations** with Tailwind animation utilities
6. **Update forms** with the modern input and radio patterns
7. **Implement skeleton screens** for loading states
8. **Use fluid typography** for better responsive text
9. **Replace dynamic class strings** with CSS variables
10. **Add micro-interactions** with group and peer modifiers

### Migration Example

```svelte
<!-- Before: Custom CSS -->
<button class="custom-button custom-button--primary custom-button--large">
  Click Me
</button>

<style>
  .custom-button { /* 20+ lines of CSS */ }
  .custom-button--primary { /* More CSS */ }
  .custom-button--large { /* Even more CSS */ }
</style>

<!-- After: Tailwind Pattern -->
<Button variant="primary" size="lg">
  Click Me
</Button>
```

## Best Practices Summary

1. **Use data attributes** for component variants instead of complex conditional classes
2. **Leverage container queries** for truly responsive components
3. **Implement proper dark mode** with CSS variables for consistency
4. **Add micro-interactions** sparingly for better UX
5. **Use skeleton screens** instead of spinners for better perceived performance
6. **Apply fluid typography** for seamless responsive design
7. **Avoid dynamic class strings** - use complete classes or CSS variables
8. **Group related utilities** with component classes for maintainability
9. **Use Tailwind plugins** for complex patterns (typography, forms, container queries)
10. **Optimize for production** by purging unused styles and using JIT mode

This guide provides battle-tested patterns that can immediately improve the Zyeta app's UI consistency and performance while reducing custom CSS maintenance.