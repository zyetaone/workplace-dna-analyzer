<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { getPresenterState } from '../presenter.svelte';
  import { Card, Button, Progress } from '$lib/components';

  // Import quiz-specific components
  import QuestionCard from './QuestionCard.svelte';

  const presenter = getPresenterState(page.params.code as string);
  const { currentQuestion, quizProgress, loading, participant, currentAnswer, error } = presenter;
  let selectedAnswer = $state('');

  // Create progress steps for the UI
  const progressSteps = $derived.by(() => {
    const steps = [];
    for (let i = 0; i < quizProgress.totalQuestions; i++) {
      steps.push({
        number: i + 1,
        completed: i < quizProgress.answeredCount,
        current: i === quizProgress.currentQuestion
      });
    }
    return steps;
  });

  // Validate session code and initialize quiz
  $effect(() => {
    const sessionCode = page.params.code as string;
    if (!sessionCode) {
      goto('/');
      return;
    }

    // Validate session code format
    if (!/^[A-Z0-9]{6}$/.test(sessionCode)) {
      goto('/');
      return;
    }

    if (!participant?.id) {
      goto(`/${sessionCode}`);
      return;
    }
    presenter.loadQuizState(sessionCode, participant.id);
  });

  // Sync selected answer with presenter state
  $effect(() => {
    selectedAnswer = currentAnswer;
  });

  async function handleAction(skipAnswer?: boolean) {
    const answer = skipAnswer ? '' : selectedAnswer;
    if (!skipAnswer && !answer) return;

    const result = await presenter.submitAnswer(answer);
    if (!result.success) return;

    if (quizProgress.isLastQuestion) {
      const completion = await presenter.completeQuiz();
      if (completion.success) goto(`/${page.params.code}/complete`);
    } else {
      presenter.nextQuestion();
      selectedAnswer = '';
    }
  }
</script>

<div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
  <Card variant="elevated" class="max-w-4xl w-full" loading={loading}>
    {#if loading}
      <div class="text-center py-12">
        <div class="loading-spinner w-12 h-12 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading quiz...</p>
      </div>
    {:else if error}
      <div class="text-center py-12">
        <div class="text-red-500 mb-4">
          <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-800 mb-2">Error Loading Quiz</h3>
        <p class="text-gray-600 mb-4">{error}</p>
        <Button onclick={() => location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    {:else if currentQuestion}
      <!-- Progress Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-2xl font-bold text-gray-800">Workplace Preferences Quiz</h1>
          <div class="text-sm text-gray-600">
            Question {quizProgress.currentQuestion + 1} of {quizProgress.totalQuestions}
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="mb-6">
          <Progress value={quizProgress.progressPercent} class="h-2" />
          <div class="flex justify-between text-xs text-gray-500 mt-1">
            <span>{quizProgress.answeredCount} answered</span>
            <span>{quizProgress.progressPercent}% complete</span>
          </div>
        </div>

        <!-- Step Progress -->
        <div class="flex items-center gap-2 mb-4">
          {#each progressSteps as step}
            <div class="flex-1 flex items-center">
              <div class="flex-1 h-1 rounded-full transition-all duration-300 {
                step.completed ? 'bg-blue-600' :
                step.current ? 'bg-blue-300' :
                'bg-gray-200'
              }"></div>
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 {
                step.completed ? 'bg-blue-600 text-white' :
                step.current ? 'bg-blue-600 text-white' :
                'bg-gray-200 text-gray-500'
              }">
                {step.number}
              </div>
            </div>
          {/each}
        </div>
      </div>

       <!-- Question Card -->
       <QuestionCard
         title={currentQuestion.title}
         subtitle={currentQuestion.subtitle}
         options={currentQuestion.options.map(option => ({
           ...option,
           icon: option.emoji || option.icon
         }))}
         selectedId={selectedAnswer}
         onSelect={(answer) => selectedAnswer = answer}
         disabled={loading}
         questionNumber={quizProgress.currentQuestion + 1}
         totalQuestions={quizProgress.totalQuestions}
         progress={quizProgress.progressPercent}
         variant="card"
       />

       {#if error}
         <div class="p-4 bg-red-50 text-red-700 rounded-lg mb-6 border border-red-200">
           <div class="flex items-center gap-2">
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
             </svg>
             {error}
           </div>
         </div>
       {/if}

       <!-- Action Buttons -->
       <div class="flex gap-4 mt-8">
         <Button
           onclick={() => handleAction()}
           disabled={loading || !selectedAnswer}
           loading={loading}
           class="flex-1"
         >
           {quizProgress.isLastQuestion ? 'Complete Quiz' : 'Next Question'}
         </Button>
         {#if !quizProgress.isLastQuestion}
           <Button
             onclick={() => handleAction(true)}
             disabled={loading}
             variant="outline"
             class="px-8"
           >
             Skip
           </Button>
         {/if}
       </div>

       <!-- Footer -->
       {#if participant}
         <div class="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
           <div class="flex items-center gap-2">
             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
             </svg>
             {participant.name}
           </div>
           <div class="flex items-center gap-2">
             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
             </svg>
             Session: {page.params.code}
           </div>
         </div>
       {/if}
    {:else}
      <div class="text-center py-12">
        <div class="text-gray-500 mb-4">
          <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.467-.881-6.08-2.33"/>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-800 mb-2">Quiz Not Available</h3>
        <p class="text-gray-600">Please check your session code and try again.</p>
      </div>
    {/if}
  </Card>
</div>