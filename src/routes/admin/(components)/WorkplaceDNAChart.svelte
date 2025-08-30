<!-- @migration-task Error while migrating Svelte code: Expected token >
https://svelte.dev/e/expected_token -->
<script lang="ts">
  import { cn } from '$lib/utils/common';
  import { scale, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  interface WorkplaceDNAProps {
    scores: {
      collaboration: number;
      formality: number;
      tech: number;
      wellness: number;
    };
    title?: string;
    showLabels?: boolean;
    animate?: boolean;
    class?: string;
  }
  
  let { 
    scores,
    title = 'Workplace DNA Profile',
    showLabels = true,
    animate = true,
    class: className = ''
  }: WorkplaceDNAProps = $props();
  
  // Calculate positions for radar chart
  const dimensions = Object.entries(scores);
  const angleStep = (Math.PI * 2) / dimensions.length;
  
  function getCoordinates(value: number, index: number) {
    const angle = angleStep * index - Math.PI / 2;
    const radius = (value / 100) * 120; // Max radius of 120px
    const x = 150 + Math.cos(angle) * radius;
    const y = 150 + Math.sin(angle) * radius;
    return { x, y };
  }
  
  // Create polygon points
  const polygonPoints = $derived(
    dimensions
      .map(([_, value], index) => {
        const coords = getCoordinates(value as number, index);
        return `${coords.x},${coords.y}`;
      })
      .join(' ')
  );
  
  // Trait configurations
  const traitConfig = {
    collaboration: { 
      label: 'Collaboration', 
      icon: '👥', 
      color: 'from-blue-400 to-cyan-400',
      description: 'Team-oriented vs Independent'
    },
    formality: { 
      label: 'Structure', 
      icon: '📋', 
      color: 'from-purple-400 to-indigo-400',
      description: 'Formal vs Flexible'
    },
    tech: { 
      label: 'Technology', 
      icon: '💻', 
      color: 'from-green-400 to-emerald-400',
      description: 'Digital vs Traditional'
    },
    wellness: { 
      label: 'Wellness', 
      icon: '🌱', 
      color: 'from-pink-400 to-rose-400',
      description: 'Balance vs Performance'
    }
  };
</script>

  <div class="dna-profile-card {className}">
  <h3 class="text-xl font-semibold text-gray-900 text-center mb-6">{title}</h3>
  
  <!-- SVG Radar Chart -->
  <div class="relative flex justify-center mb-6" in:scale={{ duration: 600, easing: quintOut }}>
    <svg width="300" height="300" class="transform">
      <!-- Background circles -->
      <g class="opacity-20">
        <circle cx="150" cy="150" r="30" fill="none" stroke="currentColor" stroke-width="1" />
        <circle cx="150" cy="150" r="60" fill="none" stroke="currentColor" stroke-width="1" />
        <circle cx="150" cy="150" r="90" fill="none" stroke="currentColor" stroke-width="1" />
        <circle cx="150" cy="150" r="120" fill="none" stroke="currentColor" stroke-width="1" />
      </g>
      
      <!-- Axis lines -->
      <g class="opacity-10">
        {#each dimensions as [_, value], index}
          {@const angle = angleStep * index - Math.PI / 2}
          {@const x2 = 150 + Math.cos(angle) * 120}
          {@const y2 = 150 + Math.sin(angle) * 120}
          <line x1="150" y1="150" x2={x2} y2={y2} stroke="currentColor" stroke-width="1" />
        {/each}
      </g>
      
      <!-- Data polygon -->
      <polygon
        points={polygonPoints}
        fill="url(#dna-gradient)"
        fill-opacity="0.3"
        stroke="url(#dna-gradient-stroke)"
        stroke-width="2"
        class={animate ? "transition-all duration-1000" : ""}
      />
      
      <!-- Data points -->
      {#each dimensions as [trait, value], index}
        {@const coords = getCoordinates(value as number, index)}
        <circle
          cx={coords.x}
          cy={coords.y}
          r="6"
          fill="url(#dna-gradient-stroke)"
          class="filter drop-shadow-lg"
          in:scale={{ delay: 100 * index, duration: 400, easing: quintOut }}
        />
        
        {#if showLabels}
          {@const labelAngle = angleStep * index - Math.PI / 2}
          {@const labelX = 150 + Math.cos(labelAngle) * 140}
          {@const labelY = 150 + Math.sin(labelAngle) * 140}
          <text
            x={labelX}
            y={labelY}
            text-anchor="middle"
            dominant-baseline="middle"
            class="fill-gray-600 text-xs font-medium"
          >
            {traitConfig[trait as keyof typeof traitConfig].icon}
          </text>
        {/if}
      {/each}
      
      <!-- Gradients -->
      <defs>
        <linearGradient id="dna-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#f093fb;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="dna-gradient-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f093fb;stop-opacity:1" />
        </linearGradient>
      </defs>
    </svg>
  </div>
  
  <!-- Trait breakdown -->
  <div class="space-y-3">
    {#each Object.entries(scores) as [trait, score], index}
      {@const config = traitConfig[trait as keyof typeof traitConfig]}
      <div 
        class="flex items-center justify-between p-3 rounded-xl bg-gray-100 border border-gray-200"
        in:fly={{ x: -20, delay: index * 50, duration: 400, easing: quintOut }}
      >
        <div class="flex items-center gap-3">
          <span class="text-2xl">{config.icon}</span>
          <div>
            <p class="text-sm font-medium text-gray-800">{config.label}</p>
            <p class="text-xs text-gray-600">{config.description}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r {config.color} rounded-full transition-all duration-1000"
              style="width: {score}%"
            ></div>
          </div>
          <span class="text-sm font-bold text-gray-700 w-10 text-right">
            {score}%
          </span>
        </div>
      </div>
    {/each}
  </div>
  
  <!-- Insights -->
  <div class="mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
    <div class="flex items-start gap-3">
      <span class="text-2xl">💡</span>
      <div>
        <p class="text-sm font-medium text-purple-300 mb-1">Key Insight</p>
        <p class="text-xs text-gray-600">
          {#if scores.collaboration > 70}
            This workplace thrives on teamwork and collective decision-making.
          {:else if scores.tech > 70}
            A digitally-forward environment embracing modern work tools.
          {:else if scores.wellness > 70}
            Strong focus on employee wellbeing and work-life balance.
          {:else}
            Balanced workplace culture with diverse working styles.
          {/if}
        </p>
      </div>
    </div>
  </div>
</div>