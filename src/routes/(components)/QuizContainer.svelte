<script lang="ts">
   import { page } from '$app/state';
   import { goto } from '$app/navigation';
   import { getPresenterState } from '../[code]/quiz.svelte.ts';
   import { Card, Button } from '$lib/components';
   import QuestionCard from './QuestionCard.svelte';
   import QuizOptionCard from './QuizOptionCard.svelte';
   import { Progress } from '$lib/components/ui';
   import { fly, fade } from 'svelte/transition';
   import { quintOut } from 'svelte/easing';

   const presenter = getPresenterState(page.params.code as string);
   const { currentQuestion, loading, participant, currentAnswer, error, isLastQuestion, progressPercent } = presenter;
   let selectedAnswer = $state('');

   // Simple quiz initialization
   $effect(() => {
     const sessionCode = page.params.code as string;
     if (!sessionCode || !/^[A-Z0-9]+-[0-9]{6}$/.test(sessionCode)) {
       goto('/');
       return;
     }
     if (!participant?.id) {
       goto(`/${sessionCode}`);
       return;
     }
     presenter.loadQuizState(sessionCode, participant.id);
   });

   // Sync selected answer
   $effect(() => {
     selectedAnswer = currentAnswer;
   });

   async function handleAction(skipAnswer?: boolean) {
     const answer = skipAnswer ? '' : selectedAnswer;
     if (!skipAnswer && !answer) return;

     const result = await presenter.submitAnswer(answer);
     if (!result.success) return;

     if (isLastQuestion) {
       const completion = await presenter.completeQuiz();
       if (completion.success) goto(`/${page.params.code}/complete`);
     } else {
       presenter.nextQuestion();
       selectedAnswer = '';
     }
   }
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center px-4 py-8">
   <!-- Animated background orbs -->
   <div class="floating-orbs">
     <div class="orb orb-1"></div>
     <div class="orb orb-2"></div>
     <div class="orb orb-3"></div>
     <div class="orb orb-4"></div>
   </div>

   <div class="max-w-3xl w-full relative" in:fly={{ y: 20, duration: 500, easing: quintOut }}>
     {#if loading}
       <div class="glass-card rounded-3xl p-12">
         <div class="text-center">
           <div class="w-16 h-16 mx-auto mb-4">
             <div class="w-full h-full rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"></div>
           </div>
           <p class="text-lg text-slate-300">Loading quiz...</p>
         </div>
       </div>
     {:else if error}
       <div class="glass-card rounded-3xl p-12 border-red-500/20">
         <div class="text-center">
           <div class="text-4xl mb-4">⚠️</div>
           <h3 class="text-xl font-semibold text-red-400 mb-2">Error Loading Quiz</h3>
           <p class="text-slate-400 mb-6">{error}</p>
           <Button onclick={() => location.reload()} class="bg-gradient-to-r from-red-500 to-pink-500">Try Again</Button>
         </div>
       </div>
     {:else if currentQuestion}
       <div class="glass-card rounded-3xl p-8">
          <!-- Enhanced Progress Header -->
          <div class="mb-8">
            <div class="text-center mb-6">
              <h1 class="text-3xl font-bold gradient-text mb-2">Workplace Preferences</h1>
              <p class="text-slate-400">Question {presenter.currentQuestionIndex + 1} of {presenter.totalQuestions}</p>
            </div>

            <!-- Progress with Next Question Preview -->
            <div class="relative">
              <Progress 
                value={progressPercent} 
                max={100}
                color="gradient"
                showLabel={false}
                class="mb-2"
              />

              <!-- Next Question Preview -->
              {#if !isLastQuestion}
                <div class="mt-4 p-4 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-600/30">
                  <div class="flex items-center gap-3">
                    <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                      {presenter.currentQuestionIndex + 2}
                    </div>
                    <div class="flex-1">
                      <p class="text-xs text-slate-400 mb-1">Next Question</p>
                      <p class="text-sm text-slate-200 font-medium">
                        {presenter.questions[presenter.currentQuestionIndex + 1]?.question || 'Loading...'}
                      </p>
                    </div>
                    <div class="flex-shrink-0 text-slate-400">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              {:else}
                <div class="mt-4 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-xl border border-green-500/20">
                  <div class="flex items-center gap-3">
                    <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white">
                      🎉
                    </div>
                    <div class="flex-1">
                      <p class="text-xs text-green-400 mb-1">Final Step</p>
                      <p class="text-sm text-green-200 font-medium">Complete your workplace profile!</p>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          </div>

         <!-- Question -->
         <div class="mb-8" in:fade={{ duration: 300 }}>
           <h2 class="text-2xl font-semibold text-slate-200 mb-3">
             {currentQuestion.question}
           </h2>
           {#if currentQuestion.description}
             <p class="text-slate-400">
               {currentQuestion.description}
             </p>
           {/if}
         </div>

         <!-- Options with new design -->
         <div class="space-y-3 mb-8">
           {#each currentQuestion.options as option, index}
             <div in:fly={{ x: -20, delay: index * 50, duration: 400, easing: quintOut }}>
               <QuizOptionCard
                 id={option.id}
                 label={option.label}
                 description={option.description}
                 selected={selectedAnswer === option.id}
                 disabled={loading}
                 onSelect={(id) => selectedAnswer = id}
                 index={index}
               />
             </div>
           {/each}
         </div>

         <!-- Action Buttons -->
         <div class="flex gap-4">
           <Button
             onclick={() => handleAction()}
             disabled={loading || !selectedAnswer}
             class="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
           >
             {#if loading}
               <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
             {:else}
               {isLastQuestion ? 'Complete Quiz 🎉' : 'Next Question →'}
             {/if}
           </Button>
           {#if !isLastQuestion}
             <Button
               onclick={() => handleAction(true)}
               disabled={loading}
               class="px-6 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border border-slate-600 rounded-xl transition-all duration-300"
             >
               Skip
             </Button>
           {/if}
         </div>
       </div>
     {:else}
       <div class="glass-card rounded-3xl p-12">
         <div class="text-center">
           <div class="text-4xl mb-4">🎭</div>
           <h3 class="text-xl font-semibold text-slate-300 mb-2">Quiz Not Available</h3>
           <p class="text-slate-400">Please check your session code and try again.</p>
         </div>
       </div>
     {/if}
   </div>
 </div>

<style>
  .glass-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 
      0 20px 60px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
</style>