<script lang="ts">
	import { fade, fly, slide } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  import type { Snippet } from 'svelte';
  import type { getSessionStore } from '../admin/admin.svelte';

  type SessionStore = ReturnType<typeof getSessionStore>;

  interface PresenterLayoutProps {
    store: SessionStore;
    sessionCode: string;
    qrSection?: Snippet<[{ store: SessionStore; sessionCode: string }]>;
    statsSection?: Snippet<[{ store: SessionStore }]>;
    analyticsSection?: Snippet<[{ store: SessionStore }]>;
    insightsSection?: Snippet<[{ store: SessionStore }]>;
  }

  let {
    store,
    sessionCode,
    qrSection,
    statsSection,
    analyticsSection,
    insightsSection
  }: PresenterLayoutProps = $props();

  // Scroll snap functionality
  let container: HTMLElement;
  let currentSection = $state(0);
  let scrollProgress = $state(0);
  const sections = ['qr', 'stats', 'analytics', 'insights'];

  function handleScroll() {
    if (!container) return;
    const scrollTop = container.scrollTop;
    const sectionHeight = container.clientHeight;
    const maxScroll = (sections.length - 1) * sectionHeight;
    
    // Update current section
    const newSection = Math.round(scrollTop / sectionHeight);
    if (newSection !== currentSection && newSection >= 0 && newSection < sections.length) {
      currentSection = newSection;
    }
    
    // Update smooth progress (0-100)
    scrollProgress = maxScroll > 0 ? Math.min(100, (scrollTop / maxScroll) * 100) : 0;
  }

  function scrollToSection(index: number) {
    if (container && index >= 0 && index < sections.length) {
      container.scrollTo({
        top: index * container.clientHeight,
        behavior: 'smooth'
      });
    }
  }

  // Keyboard navigation
  function handleKeydown(event: KeyboardEvent) {
    if (!container) return;
    
    switch (event.key) {
      case 'ArrowDown':
      case 'PageDown':
        event.preventDefault();
        scrollToSection(Math.min(currentSection + 1, sections.length - 1));
        break;
      case 'ArrowUp':
      case 'PageUp':
        event.preventDefault();
        scrollToSection(Math.max(currentSection - 1, 0));
        break;
      case 'Home':
        event.preventDefault();
        scrollToSection(0);
        break;
      case 'End':
        event.preventDefault();
        scrollToSection(sections.length - 1);
        break;
    }
  }

  // No more polling! Using reactive queries with invalidation instead
</script>

<div
  bind:this={container}
  class="presenter-container"
  onscroll={handleScroll}
  onkeydown={handleKeydown}
  role="application"
  aria-label="Presenter sections - use arrow keys to navigate"
  aria-describedby="navigation-help"
>
  <!-- Hidden help text for screen readers -->
  <div id="navigation-help" class="sr-only">
    Use arrow keys to navigate between sections: Page Up/Down, Home, End
  </div>

  <!-- Smooth Scroll Progress Indicator -->
  <div class="fixed top-0 left-0 right-0 z-20 h-1 bg-gray-200">
    <div
      class="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ease-out"
      style="width: {scrollProgress}%"
    ></div>
  </div>
  <!-- Enhanced Section Navigation -->
  <div class="fixed right-6 top-1/2 -translate-y-1/2 z-10 space-y-3">
    {#each sections as section, index}
      <div class="relative group">
        <button
          onclick={() => scrollToSection(index)}
          class="w-3 h-3 rounded-full transition-all duration-300 {
            index === currentSection
              ? 'bg-blue-600 scale-125 shadow-lg'
              : 'bg-gray-300 hover:bg-gray-400 hover:scale-110'
          }"
          aria-label={`Go to ${section} section`}
        ></button>
        
        <!-- Hover Label -->
        <div class="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div class="bg-gray-800 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap shadow-lg">
            {section.charAt(0).toUpperCase() + section.slice(1)} Section
            <div class="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-800"></div>
          </div>
        </div>
      </div>
    {/each}
  </div>

  <!-- QR Code Section -->
  <section class="presenter-section flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
    <div
      class="qr-scale-container"
      in:fly={{ y: 50, duration: 800, easing: quintOut }}
    >
      {#if qrSection}
        {@render qrSection({ store, sessionCode })}
      {/if}
    </div>
  </section>

  <!-- Live Stats Section -->
  <section class="presenter-section bg-white">
    <div
      class="max-w-4xl mx-auto"
      in:slide={{ axis: 'y', duration: 1000, easing: quintOut }}
    >
      {#if statsSection}
        {@render statsSection({ store })}
      {/if}
    </div>
  </section>

  <!-- Analytics Section -->
  <section class="presenter-section bg-gray-50">
    <div
      class="max-w-6xl mx-auto"
      in:fade={{ duration: 1200 }}
    >
      {#if analyticsSection}
        {@render analyticsSection({ store })}
      {/if}
    </div>
  </section>

  <!-- Insights Section -->
  <section class="presenter-section bg-white">
    <div
      class="max-w-6xl mx-auto"
      in:slide={{ axis: 'y', duration: 1000, delay: 200, easing: quintOut }}
    >
      {#if insightsSection}
        {@render insightsSection({ store })}
      {/if}
    </div>
  </section>
</div>

<style>
  .presenter-container {
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
    height: 100vh;
    overflow-y: scroll;
  }

  .presenter-section {
    scroll-snap-align: start;
    min-height: 100vh;
    padding: 2rem;
  }

  .qr-scale-container {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .qr-scale-container:hover {
    transform: scale(1.05);
  }
</style>