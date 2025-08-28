<!--
Button.svelte - Clean & Simple
-->

<script lang="ts">
  import { Button } from 'bits-ui';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLButtonAttributes, 'onclick' | 'class' | 'type' | 'disabled'> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    onclick?: (event: MouseEvent) => void | boolean | Promise<void> | Promise<boolean>;
    class?: string;
    children?: any;
  }

  let {
    variant = 'default',
    size = 'md',
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

  // Handle click event
  function handleClick(event: MouseEvent) {
    if (onclick) {
      const result = onclick(event);
      if (result === false) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }

  // Clean variant system using Tailwind directly
  const variants = {
    default: 'bg-gray-900 text-white hover:bg-gray-800 focus-visible:ring-gray-500',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus-visible:ring-gray-400',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-400',
    ghost: 'text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-400'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };
</script>

<Button.Root
  {type}
  disabled={isDisabled}
  onclick={handleClick}
  class="inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed {variants[variant]} {sizes[size]} {className}"
  {...restProps}
>
  {#if loading}
    <div class="animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 w-4 h-4"></div>
  {/if}
  {@render children?.()}
</Button.Root>