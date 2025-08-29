<script lang="ts">
	import type { GenerationOption } from '$lib/questions';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { getPresenterState } from './quiz.svelte.ts';
	import { Card, StatusIndicator } from '$lib/components';
	import JoinForm from '../(components)/JoinForm.svelte';

	// Get presenter state instance
	const presenter = getPresenterState(page.params.code);

  // Validate session code and load session
  $effect(() => {
    const code = page.params.code;
    if (!code || !/^[A-Z0-9]+-[0-9]{6}$/.test(code)) {
      goto('/');
      return;
    }
    presenter.loadSession(code);
  });
	
	// Handle join form submission
 	async function handleJoin(name: string, generation: GenerationOption) {
		try {
			const result = await presenter.joinSession(name, generation);
			if (result.success && 'redirect' in result && result.redirect) {
				goto(result.redirect as string);
			}
		} catch (error) {
			console.error('Join failed:', error);
			// Handle error gracefully
		}
	}
</script>

<div class="min-h-screen animated-gradient flex items-center justify-center px-4 py-8">
	<div class="max-w-md w-full">
		<!-- Header with session info -->
		{#if presenter.session}
			<div class="text-center mb-6">
				<div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
					<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
					</svg>
				</div>
				<h1 class="text-2xl font-bold gradient-text mb-2">Join Workplace Quiz</h1>
				<p class="text-slate-400">Session: <span class="font-semibold text-slate-200">{presenter.session.name}</span></p>
			</div>
		{/if}

		<Card
			variant="elevated"
			size="lg"
			class="w-full backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl"
			loading={presenter.loading}
		>
			{#if presenter.loading}
				<!-- Enhanced loading state -->
				<div class="text-center py-8">
					<div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full mb-4">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
					</div>
					<h3 class="text-lg font-semibold text-slate-200 mb-2">Loading Session</h3>
					<p class="text-slate-400">Preparing your personalized quiz experience...</p>
					<div class="mt-4">
						<StatusIndicator status="loading" message="Connecting to session..." />
					</div>
				</div>
			{:else if presenter.error}
				<!-- Enhanced error state -->
				<div class="text-center py-8">
					<div class="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
						<svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-red-400 mb-2">Unable to Join Session</h3>
					<p class="text-slate-400 mb-4">{presenter.error}</p>
					<div class="mb-4">
						<StatusIndicator status="error" message="Connection failed" />
					</div>
					<button
						onclick={() => location.reload()}
						class="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors duration-200"
					>
						Try Again
					</button>
				</div>
			{:else if presenter.session}
				<!-- Enhanced join form -->
				<div class="space-y-6">
					<div class="text-center">
						<h2 class="text-xl font-semibold text-slate-200 mb-2">Ready to Start?</h2>
						<p class="text-slate-400 text-sm">Complete this quick assessment to discover your workplace preferences</p>
					</div>

					<JoinForm
						session={presenter.session}
						bind:participantName={presenter.participantName}
						isJoining={presenter.loading}
						joinError={presenter.error}
						onJoin={handleJoin}
					/>

					<!-- Session stats preview -->
					<div class="mt-6 p-4 bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-600/30">
						<div class="flex items-center justify-center gap-2 text-sm text-slate-400">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
							</svg>
							<span>10 questions • 5-10 minutes</span>
						</div>
					</div>
				</div>
			{:else}
				<!-- No session state -->
				<div class="text-center py-8">
					<div class="inline-flex items-center justify-center w-16 h-16 bg-slate-500/20 rounded-full mb-4">
						<svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.467-.881-6.08-2.33"></path>
						</svg>
					</div>
					<h3 class="text-lg font-semibold text-slate-400 mb-2">Session Not Found</h3>
					<p class="text-slate-500 mb-4">Please check your session code and try again</p>
					<div class="mb-4">
						<StatusIndicator status="warning" message="Invalid session code" />
					</div>
				</div>
			{/if}
		</Card>

		<!-- Footer with branding -->
		<div class="text-center mt-6">
			<p class="text-xs text-slate-500">
				Powered by <span class="font-semibold gradient-text">Zyeta DX</span>
			</p>
		</div>
	</div>
</div>