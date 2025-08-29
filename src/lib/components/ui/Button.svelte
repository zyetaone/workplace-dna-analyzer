<!--
Button.svelte - Enhanced with CVA (Class Variance Authority)
Consolidates all button patterns and reduces ~200 lines of duplication
-->

<script lang="ts">
  import { Button } from 'bits-ui';
  import { cva, type VariantProps } from 'class-variance-authority';
  import { cn } from '$lib/utils/cn';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  // Define button variants using CVA for better maintainability
  const buttonVariants = cva(
    // Base styles - applied to all variants
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden',
    {
      variants: {
        variant: {
          // Core variants
          default: 'bg-slate-800 text-slate-100 hover:bg-slate-700 focus-visible:ring-cyan-500',
          secondary: 'bg-slate-700/60 backdrop-blur-sm text-slate-200 hover:bg-slate-600/70 focus-visible:ring-slate-400 border border-slate-600/50',
          destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
          outline: 'border border-slate-600 text-slate-300 hover:bg-slate-800/50 focus-visible:ring-slate-400',
          ghost: 'text-slate-300 hover:bg-slate-800/50 focus-visible:ring-slate-400',
          
          // Glass morphism variants
          glass: 'bg-slate-900/40 backdrop-blur-xl text-slate-200 hover:bg-slate-800/60 focus-visible:ring-cyan-500 border border-slate-700/50',
          glassLight: 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 focus-visible:ring-white/50 border border-white/20',
          
          // Light theme variants
          light: 'bg-gray-900 text-white hover:bg-gray-800 focus-visible:ring-gray-500',
          lightSecondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-400',
          lightOutline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-400',
          lightGhost: 'text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-400',
          
          // New gradient variants for common patterns
          primary: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl',
          success: 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg',
          info: 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg'
        },
        size: {
          sm: 'px-3 py-1.5 text-sm',
          md: 'px-4 py-2',
          lg: 'px-6 py-3 text-lg',
          xl: 'px-6 py-4 text-lg',
          icon: 'p-2'
        },
        fullWidth: {
          true: 'w-full',
          false: ''
        }
      },
      defaultVariants: {
        variant: 'default',
        size: 'md',
        fullWidth: false
      }
    }
  );

  type ButtonVariants = VariantProps<typeof buttonVariants>;

  interface Props extends Omit<HTMLButtonAttributes, 'onclick' | 'class' | 'type' | 'disabled'>, ButtonVariants {
    loading?: boolean;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    onclick?: (event: MouseEvent) => void | boolean | Promise<void> | Promise<boolean>;
    class?: string;
    children?: any;
    // Accessibility props
    'aria-label'?: string;
    'aria-describedby'?: string;
    'aria-expanded'?: boolean;
    'aria-pressed'?: boolean;
  }

  let {
    variant = 'default',
    size = 'md',
    fullWidth = false,
    loading = false,
    disabled = false,
    type = 'button',
    onclick,
    class: className = '',
    children,
    ...restProps
  }: Props = $props();

  // Compute disabled state
  let isDisabled = $derived(disabled || loading);

  // Generate button classes using CVA
  let buttonClass = $derived(
    cn(buttonVariants({ variant, size, fullWidth }), className)
  );

  // Handle click event with enhanced interaction patterns
  function handleClick(event: MouseEvent) {
    if (onclick) {
      const result = onclick(event);
      if (result === false) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }

  // Enhanced interaction states
  let isPressed = $state(false);
  let rippleEffect = $state<{ x: number; y: number; id: number } | null>(null);

  // Handle press state for better UX
  function handlePointerDown(event: PointerEvent) {
    if (!isDisabled) {
      isPressed = true;

      // Add ripple effect for material design feel
      if (variant !== 'ghost' && variant !== 'lightGhost') {
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        rippleEffect = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          id: Date.now()
        };
      }
    }
  }

  function handlePointerUp() {
    isPressed = false;
    // Clear ripple after animation
    setTimeout(() => {
      rippleEffect = null;
    }, 600);
  }

  function handlePointerLeave() {
    isPressed = false;
    rippleEffect = null;
  }
</script>

<Button.Root
  {type}
  disabled={isDisabled}
  onclick={handleClick}
  onpointerdown={handlePointerDown}
  onpointerup={handlePointerUp}
  onpointerleave={handlePointerLeave}
  class="{buttonClass} {isPressed ? 'scale-95' : ''}"
  aria-busy={loading ? 'true' : undefined}
  aria-disabled={isDisabled ? 'true' : undefined}
  aria-pressed={isPressed}
  {...restProps}
>
  <!-- Ripple Effect -->
  {#if rippleEffect}
    <div
      class="absolute rounded-full bg-white/30 animate-ping"
      style="left: {rippleEffect.x - 10}px; top: {rippleEffect.y - 10}px; width: 20px; height: 20px;"
      aria-hidden="true"
    ></div>
  {/if}

  {#if loading}
    <div
      class="animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 w-4 h-4"
      aria-hidden="true"
    ></div>
    <span class="sr-only">Loading...</span>
  {/if}
  {@render children?.()}
</Button.Root>