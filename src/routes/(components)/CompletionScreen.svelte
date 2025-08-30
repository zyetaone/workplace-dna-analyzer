<script lang="ts">
  import { scale, fly } from 'svelte/transition';
  import { quintOut, elasticOut } from 'svelte/easing';
  import { Button } from '$lib/components';
  
  interface WorkplaceScore {
    collaboration: number;
    formality: number;
    tech: number;
    wellness: number;
  }
  
  interface CompletionScreenProps {
    participantName: string;
    scores: WorkplaceScore;
    totalScore?: number;
    rank?: number;
    totalParticipants?: number;
    onViewInsights?: () => void;
    onRestartQuiz?: () => void;
    class?: string;
  }
  
  let { 
    participantName,
    scores,
    totalScore = 0,
    rank,
    totalParticipants,
    onViewInsights,
    onRestartQuiz,
    class: className = ''
  }: CompletionScreenProps = $props();
  
  // Calculate workplace DNA profile
  const workplaceDNA = $derived({
    primary: Object.entries(scores).reduce((max, [key, value]) => 
      value > scores[max as keyof WorkplaceScore] ? key : max, 'collaboration'),
    secondary: Object.entries(scores).sort(([,a], [,b]) => b - a)[1]?.[0] || 'tech'
  });
  
  const dnaProfiles: Record<string, { title: string; emoji: string; color: string }> = {
    collaboration: { title: 'Team Player', emoji: '👥', color: 'from-blue-500 to-cyan-500' },
    formality: { title: 'Structured Thinker', emoji: '📋', color: 'from-purple-500 to-indigo-500' },
    tech: { title: 'Digital Native', emoji: '💻', color: 'from-green-500 to-emerald-500' },
    wellness: { title: 'Balance Seeker', emoji: '🌱', color: 'from-pink-500 to-rose-500' }
  };
  
  // Celebration confetti
  let showConfetti = $state(true);
  
  $effect(() => {
    setTimeout(() => showConfetti = false, 5000);
  });
  
  // Generate confetti particles
  const confettiColors = ['#667eea', '#764ba2', '#f093fb', '#c471ed', '#fbbf24', '#34d399'];
  const confettiParticles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 2,
    color: confettiColors[Math.floor(Math.random() * confettiColors.length)]
  }));
</script>

  <div class="completion-container relative {className}">
  <!-- Confetti animation -->
  {#if showConfetti}
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      {#each confettiParticles as particle}
        <div 
          class="completion-confetti absolute"
          style="
            left: {particle.left}%;
            animation-delay: {particle.delay}s;
            animation-duration: {particle.duration}s;
            background: {particle.color};
          "
        ></div>
      {/each}
    </div>
  {/if}
  
  <!-- Main content -->
  <div class="relative z-10 text-center">
    <!-- Congratulations -->
    <div in:scale={{ duration: 600, easing: elasticOut }}>
      <div class="text-6xl mb-4">🎉</div>
      <h1 class="text-4xl font-bold gradient-text mb-2">
        Congratulations, {participantName}!
      </h1>
      <p class="text-lg text-slate-400 mb-8">
        You've completed the Workplace Preferences Quiz
      </p>
    </div>
    
    <!-- Score display -->
    <div 
      class="mb-12"
      in:fly={{ y: 20, delay: 300, duration: 500, easing: quintOut }}
    >
      <div class="inline-block relative">
        <div class="score-display">
          {totalScore}
          <span class="text-2xl text-slate-400">pts</span>
        </div>
        {#if rank && totalParticipants}
          <div class="mt-2 text-sm text-slate-400">
            Ranked #{rank} of {totalParticipants} participants
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Workplace DNA Profile -->
    <div 
      class="dna-profile-card mb-8"
      in:fly={{ y: 20, delay: 600, duration: 500, easing: quintOut }}
    >
      <h2 class="text-xl font-semibold text-slate-200 mb-6">Your Workplace DNA</h2>
      
      <div class="grid grid-cols-2 gap-6 mb-6">
        <div class="text-center">
          <div class="text-4xl mb-2">{dnaProfiles[workplaceDNA.primary].emoji}</div>
          <h3 class="font-semibold bg-gradient-to-r {dnaProfiles[workplaceDNA.primary].color} bg-clip-text text-transparent">
            {dnaProfiles[workplaceDNA.primary].title}
          </h3>
          <p class="text-xs text-slate-500 mt-1">Primary Style</p>
        </div>
        <div class="text-center">
          <div class="text-4xl mb-2">{dnaProfiles[workplaceDNA.secondary].emoji}</div>
          <h3 class="font-semibold bg-gradient-to-r {dnaProfiles[workplaceDNA.secondary].color} bg-clip-text text-transparent">
            {dnaProfiles[workplaceDNA.secondary].title}
          </h3>
          <p class="text-xs text-slate-500 mt-1">Secondary Style</p>
        </div>
      </div>
      
      <!-- Score breakdown -->
      <div class="space-y-3">
        {#each Object.entries(scores) as [trait, score], i}
          <div 
            class="dna-trait"
            in:fly={{ x: -20, delay: 800 + i * 100, duration: 400, easing: quintOut }}
          >
            <span class="text-sm text-slate-400 capitalize w-24 text-left">
              {trait}
            </span>
            <div class="dna-trait-bar">
              <div 
                class="dna-trait-fill"
                style="width: {score}%; transition-delay: {1000 + i * 100}ms"
              ></div>
            </div>
            <span class="text-sm font-semibold text-slate-300 w-12 text-right">
              {score}%
            </span>
          </div>
        {/each}
      </div>
    </div>
    
    <!-- Action buttons -->
    <div 
      class="flex gap-4 justify-center"
      in:fly={{ y: 20, delay: 1200, duration: 500, easing: quintOut }}
    >
      {#if onViewInsights}
        <Button
          onclick={onViewInsights}
          size="lg"
          class="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          View Insights
        </Button>
      {/if}
      
      {#if onRestartQuiz}
        <Button
          onclick={onRestartQuiz}
          variant="outline"
          size="lg"
        >
          Take Again
        </Button>
      {/if}
    </div>
    
    <!-- Share section -->
    <div class="mt-8 pt-8 border-t border-slate-700/50">
      <p class="text-sm text-slate-400 mb-4">Share your results</p>
      <div class="flex gap-3 justify-center">
        <button aria-label="Share on Twitter" class="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors">
          <svg class="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
          </svg>
        </button>
        <button aria-label="Share on LinkedIn" class="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors">
          <svg class="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
            <circle cx="4" cy="4" r="2" />
          </svg>
        </button>
        <button aria-label="Copy link to share" class="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors">
          <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 4.026A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</div>