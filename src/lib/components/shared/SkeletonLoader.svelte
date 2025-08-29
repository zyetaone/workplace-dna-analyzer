<script lang="ts">
  interface SkeletonLoaderProps {
    /** Number of skeleton lines to show */
    lines?: number;
    /** Height of each skeleton line */
    height?: string;
    /** Width of skeleton lines (can be array for different widths) */
    width?: string | string[];
    /** Spacing between skeleton lines */
    spacing?: string;
    /** Custom class for styling */
    class?: string;
    /** Whether to show avatar skeleton */
    showAvatar?: boolean;
    /** Avatar size */
    avatarSize?: string;
  }

  let {
    lines = 3,
    height = 'h-4',
    width = ['w-full', 'w-3/4', 'w-1/2'],
    spacing = 'mb-3',
    class: className = '',
    showAvatar = false,
    avatarSize = 'w-12 h-12'
  }: SkeletonLoaderProps = $props();

  // Ensure width is an array
  const widths = Array.isArray(width) ? width : [width];
</script>

<div class="skeleton-loader {className}">
  {#if showAvatar}
    <div class="flex items-center space-x-4 mb-4">
      <div class="skeleton {avatarSize} rounded-full"></div>
      <div class="flex-1 space-y-2">
        <div class="skeleton h-4 w-3/4 rounded"></div>
        <div class="skeleton h-3 w-1/2 rounded"></div>
      </div>
    </div>
  {/if}

  {#each Array(lines) as _, i}
    <div
      class="skeleton {height} {widths[i % widths.length]} rounded {spacing} last:mb-0"
    ></div>
  {/each}
</div>

<style>
  .skeleton {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.1) 25%,
      rgba(255, 255, 255, 0.15) 50%,
      rgba(255, 255, 255, 0.1) 75%
    );
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
  }

  @keyframes skeleton-loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
</style>