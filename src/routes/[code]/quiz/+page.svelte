<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { questions } from '$lib/questions';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
	import ErrorScreen from '$lib/components/ErrorScreen.svelte';
	import type { ActionData, PageData } from './$types';
	
	// Props from server
	let { data = $bindable(), form = $bindable() }: { data: PageData, form: ActionData } = $props();
	
	// Local state
	let isSubmitting = $state(false);
	let showNameForm = $state(!data.participant?.name);
	let selectedAnswer = $state<string>('');
	let showCompletion = $state(false);
	
	// Derived values
	let currentQuestionIndex = $derived(
		Object.keys(data.responses || {}).length
	);
	
	let currentQuestionData = $derived(
		!showNameForm && currentQuestionIndex < questions.length 
			? questions[currentQuestionIndex] 
			: null
	);
	
	let progressPercentage = $derived(
		questions.length > 0 ? (currentQuestionIndex / questions.length) * 100 : 0
	);
	
	// Handle form success
	$effect(() => {
		if (form?.success) {
			// Reset selected answer for next question
			selectedAnswer = '';
			
			// Success - answer saved
		}
	});
	
	// Enhanced form submission
	const handleEnhance = () => {
		isSubmitting = true;
		
		return async ({ update, result }: { update: any; result: any }) => {
			await update({ reset: false });
			isSubmitting = false;
			
			// Auto-refresh data after successful submission
			if (result.type === 'success') {
				await invalidateAll();
			}
		};
	}
</script>

<div class="min-h-screen animated-gradient flex items-center justify-center px-4">
	{#if !data.participant}
		<ErrorScreen 
			title="Session Not Found"
			message="Please check your link and try again."
		/>
	{:else if showCompletion}
		<!-- Completion Screen -->
		<div class="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
			<div class="text-center">
				<div class="mb-6">
					<svg class="mx-auto h-20 w-20 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
					</svg>
				</div>
				
				<h1 class="text-3xl font-bold text-gray-800 mb-4">Thank You!</h1>
				<p class="text-lg text-gray-600 mb-8">
					Your responses have been recorded, {data.participant.name}.
				</p>
				
				{#if data.participant.preferenceScores}
					{@const scores = data.participant.preferenceScores}
					<div class="grid grid-cols-2 gap-4 mb-8">
						{#snippet scoreCard(label: string, value: number, color: string)}
							<div class="bg-gray-50 rounded-lg p-4">
								<div class="text-sm text-gray-600 mb-1">{label}</div>
								<div class="text-2xl font-bold {color}">{value}%</div>
								<div class="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
									<div 
										class="h-full {color.replace('text', 'bg')} transition-all duration-500"
										style="width: {value}%"
									></div>
								</div>
							</div>
						{/snippet}
						
						{@render scoreCard('Collaboration', scores.collaboration, 'text-blue-600')}
						{@render scoreCard('Formality', scores.formality, 'text-purple-600')}
						{@render scoreCard('Technology', scores.tech, 'text-green-600')}
						{@render scoreCard('Wellness', scores.wellness, 'text-orange-600')}
					</div>
				{/if}
				
				<p class="text-gray-500">
					Session Code: <span class="font-mono font-semibold">{page.params.code}</span>
				</p>
			</div>
		</div>
	{:else if showNameForm}
		<!-- Name Entry Form -->
		<div class="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
			<h1 class="text-3xl font-bold text-gray-800 mb-6">Welcome to the Quiz!</h1>
			
			<form method="POST" action="?/start" use:enhance={handleEnhance}>
				<div class="space-y-6">
					<div>
						<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
							Your Name
						</label>
						<input
							type="text"
							id="name"
							name="name"
							required
							minlength="2"
							maxlength="50"
							placeholder="Enter your name"
							class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							disabled={isSubmitting}
						/>
					</div>
					
					<div>
						<div class="text-sm font-medium text-gray-700 mb-2">
							Your Generation
						</div>
						<div class="grid grid-cols-2 gap-3">
							{#each questions[0].options || [] as option}
								<label class="relative cursor-pointer">
									<input
										type="radio"
										name="generation"
										value={option.id}
										class="sr-only peer"
										required
										disabled={isSubmitting}
									/>
									<div class="px-4 py-3 border-2 border-gray-200 rounded-lg text-center transition-all peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:border-gray-300">
										<div class="text-2xl mb-1">{option.emoji}</div>
										<div class="font-medium text-gray-800">{option.label}</div>
										<div class="text-xs text-gray-500">{option.years}</div>
									</div>
								</label>
							{/each}
						</div>
					</div>
					
					{#if form?.error}
						<div class="p-3 bg-red-50 text-red-700 rounded-lg">
							{form.error}
						</div>
					{/if}
					
					<button
						type="submit"
						disabled={isSubmitting}
						class="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{isSubmitting ? 'Starting...' : 'Start Quiz'}
					</button>
				</div>
			</form>
			
			<div class="mt-4 text-center text-sm text-gray-500">
				Session: {page.params.code}
			</div>
		</div>
	{:else if currentQuestionData}
		<!-- Quiz Question Form -->
		<div class="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
			<!-- Progress Bar -->
			<div class="mb-6">
				<div class="flex justify-between text-sm text-gray-600 mb-2">
					<span>Question {currentQuestionIndex + 1} of {questions.length}</span>
					<span>{Math.round(progressPercentage)}% Complete</span>
				</div>
				<div class="h-3 bg-gray-200 rounded-full overflow-hidden">
					<div 
						class="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
						style="width: {progressPercentage}%"
					></div>
				</div>
			</div>
			
			<!-- Question -->
			<div class="mb-8">
				<h2 class="text-2xl font-bold text-gray-800 mb-2">
					{currentQuestionData.title}
				</h2>
				{#if currentQuestionData.subtitle}
					<p class="text-gray-600">{currentQuestionData.subtitle}</p>
				{/if}
			</div>
			
			<!-- Answer Form -->
			<form method="POST" action="?/submitAnswer" use:enhance={handleEnhance}>
				<input type="hidden" name="questionNumber" value={currentQuestionIndex + 1} />
				
				<div class="space-y-3 mb-6">
					{#each currentQuestionData.options || [] as option}
						<label class="relative cursor-pointer block">
							<input
								type="radio"
								name="answer"
								value={option.id}
								bind:group={selectedAnswer}
								class="sr-only peer"
								required
								disabled={isSubmitting}
							/>
							<div class="p-4 border-2 border-gray-200 rounded-lg transition-all peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:border-gray-300">
								<div class="flex items-start">
									{#if option.emoji}
										<span class="text-2xl mr-3">{option.emoji}</span>
									{/if}
									<div class="flex-1">
										<div class="font-medium text-gray-800">{option.label}</div>
										{#if option.description}
											<div class="text-sm text-gray-600 mt-1">{option.description}</div>
										{/if}
									</div>
								</div>
							</div>
						</label>
					{/each}
				</div>
				
				{#if form?.error}
					<div class="p-3 bg-red-50 text-red-700 rounded-lg mb-4">
						{form.error}
					</div>
				{/if}
				
				<div class="flex gap-3">
					<button
						type="submit"
						disabled={isSubmitting || !selectedAnswer}
						class="flex-1 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{isSubmitting ? 'Submitting...' : 
						 currentQuestionIndex === questions.length - 1 ? 'Complete Quiz' : 'Next Question'}
					</button>
					
					{#if currentQuestionIndex < questions.length - 1}
						<button
							type="button"
							formaction="?/skipQuestion"
							formmethod="POST"
							disabled={isSubmitting}
							class="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							Skip
						</button>
					{/if}
				</div>
			</form>
			
			<!-- Participant Info -->
			<div class="mt-6 pt-4 border-t border-gray-200">
				<div class="flex justify-between text-sm text-gray-500">
					<span>{data.participant.name}</span>
					<span>Session: {data.session.code}</span>
				</div>
			</div>
		</div>
	{:else}
		<LoadingScreen 
			title="Loading..."
			message="Preparing your quiz..."
		/>
	{/if}
</div>

<style>
	.animated-gradient {
		background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c);
		background-size: 400% 400%;
		animation: gradient 15s ease infinite;
	}
	
	@keyframes gradient {
		0% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
		100% { background-position: 0% 50%; }
	}
</style>