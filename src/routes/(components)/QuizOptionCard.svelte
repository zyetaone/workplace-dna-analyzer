<script lang="ts">
  import { cn } from '$lib/utils/common';
  
  interface QuizOptionProps {
    id: string;
    label: string;
    description?: string;
    icon?: string;
    selected: boolean;
    disabled?: boolean;
    onSelect: (id: string) => void;
    index: number;
  }
  
  let { 
    id, 
    label, 
    description, 
    icon,
    selected = false,
    disabled = false,
    onSelect,
    index = 0
  }: QuizOptionProps = $props();

  // Enhanced mouse tracking for gradient effect
  let cardRef: HTMLElement;
  let mouseX = $state(50);
  let mouseY = $state(50);
  let isHovered = $state(false);

  function handleMouseMove(e: MouseEvent) {
    if (!cardRef) return;
    const rect = cardRef.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width) * 100;
    mouseY = ((e.clientY - rect.top) / rect.height) * 100;
  }

  function handleMouseEnter() {
    isHovered = true;
  }

  function handleMouseLeave() {
    isHovered = false;
  }

  // Option icons for workplace preferences
  const defaultIcons: Record<string, string> = {
    'collaborative': '👥',
    'independent': '🎯',
    'flexible': '🌊',
    'structured': '📋',
    'modern': '💡',
    'traditional': '🏛️',
    'wellness': '🌱',
    'performance': '📈'
  };

  const optionIcon = icon || defaultIcons[id.toLowerCase()] || '✨';
</script>

<button
  bind:this={cardRef}
  onclick={() => !disabled && onSelect(id)}
  onmousemove={handleMouseMove}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  disabled={disabled}
  class="quiz-option-card group relative w-full p-6 text-left transition-all duration-500 transform-gpu hover:scale-[1.02] hover:shadow-2xl {selected ? 'selected ring-2 ring-purple-500/50' : ''} {disabled ? 'opacity-50 cursor-not-allowed' : ''} {isHovered ? 'shadow-2xl shadow-purple-500/20' : ''}"
  style="--mouse-x: {mouseX}%; --mouse-y: {mouseY}%; animation-delay: {index * 100}ms"
  aria-pressed={selected}
  aria-label={`Option: ${label}`}
>
  <!-- Animated gradient border on selection -->
  {#if selected}
    <div class="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 opacity-30 blur-xl animate-pulse"></div>
  {/if}

  <!-- Content -->
  <div class="relative z-10 flex items-start gap-4">
    <!-- Icon with animation -->
    <div class={cn(
      "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
      "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm",
      "border border-white/20 shadow-lg",
      "transition-all duration-300",
      selected && "scale-110 rotate-3 border-purple-400/50"
    )}>
      <span class={cn(
        "transition-transform duration-500",
        selected && "scale-125"
      )}>
        {optionIcon}
      </span>
    </div>

    <!-- Text content -->
    <div class="flex-1">
      <h3 class={cn(
        "text-lg font-semibold mb-1 transition-colors duration-300",
        selected ? "text-purple-300" : "text-slate-200",
        "group-hover:text-purple-200"
      )}>
        {label}
      </h3>
      {#if description}
        <p class={cn(
          "text-sm transition-colors duration-300",
          selected ? "text-purple-300/80" : "text-slate-400",
          "group-hover:text-slate-300"
        )}>
          {description}
        </p>
      {/if}
    </div>

    <!-- Selection indicator -->
    <div class={cn(
      "flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all duration-300",
      "flex items-center justify-center",
      selected 
        ? "border-purple-400 bg-gradient-to-br from-purple-500 to-pink-500 scale-110" 
        : "border-slate-500 bg-transparent group-hover:border-purple-400/50"
    )}>
      {#if selected}
        <svg class="w-4 h-4 text-white animate-scale-in" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      {/if}
    </div>
  </div>

  <!-- Hover effect gradient -->
  <div class="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
    <div class="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 rounded-2xl"></div>
  </div>
</button>

<style>
  @keyframes scale-in {
    from {
      transform: scale(0) rotate(-180deg);
      opacity: 0;
    }
    to {
      transform: scale(1) rotate(0);
      opacity: 1;
    }
  }

  .animate-scale-in {
    animation: scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
</style>