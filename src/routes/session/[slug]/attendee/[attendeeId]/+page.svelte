<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { sessionState } from '$lib/stores/sessionState.svelte';
	import { 
		loadAttendeeData, 
		saveResponse, 
		completeQuiz as completeQuizRemote 
	} from './attendee.remote';
	
	// Get IDs from URL
	let slug = $derived(page.params.slug);
	let attendeeId = $derived(page.params.attendeeId);
	
	// State
	let session = $state<any>(null);
	let attendee = $state<any>(null);
	let questions = $state<any[]>([]);
	let sessionCode = $state('');
	let currentQuestion = $state(0);
	let responses: Record<number, string> = $state({});
	let isSubmitting = $state(false);
	let isLoading = $state(true);
	
	// Derived values
	let question = $derived(questions[currentQuestion]);
	let progress = $derived(questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0);
	
	
	// Load initial data
	$effect(() => {
		// Only run on client side when IDs are available
		if (!slug || !attendeeId) {
			if (slug === undefined || attendeeId === undefined) {
				console.warn('Missing session or attendee ID');
				isLoading = false;
			}
			return;
		}
		
		loadAttendeeData({ sessionSlug: slug, attendeeId }).then(data => {
			session = data.session;
			attendee = data.attendee;
			questions = data.questions;
			sessionCode = data.sessionCode;
			
			// Restore previous responses
			if (attendee?.responses) {
				responses = attendee.responses as Record<number, string>;
				// Find where they left off
				for (let i = 0; i < questions.length; i++) {
					if (!responses[i]) {
						currentQuestion = i;
						break;
					}
				}
			}
			
			isLoading = false;
		}).catch(error => {
			console.error('Failed to load session:', error);
			isLoading = false;
		});
	});
	
	// Handle option selection
	async function selectOption(optionId: string) {
		if (isSubmitting) return;
		
		isSubmitting = true;
		responses[currentQuestion] = optionId;
		
		try {
			// Save response using remote function
			const generation = currentQuestion === 0 ? optionId : undefined;
			await saveResponse({ sessionSlug: slug, attendeeId, questionIndex: currentQuestion, response: optionId, generation });
			
			// Move to next question or complete
			if (currentQuestion < questions.length - 1) {
				currentQuestion++;
			} else {
				// Complete the quiz
				await completeQuiz();
			}
		} catch (error) {
			console.error('Failed to save response:', error);
			alert('Failed to save your response. Please try again.');
			alert('Failed to save your response. Please try again.');
		} finally {
			isSubmitting = false;
		}
	}
	
	// Calculate scores and complete quiz using centralized logic
	async function completeQuiz() {
		// Calculate preference scores from responses
		const calculateScores = () => {
			const scores = {
				collaboration: 0,
				formality: 0,
				tech: 0,
				wellness: 0
			};
			
			let questionCount = 0;
			
			// Map responses to preference categories using actual option values
			Object.entries(responses).forEach(([qIndex, optionId]) => {
				const question = questions[parseInt(qIndex)];
				console.log(`Processing question ${qIndex}:`, { question, optionId });
				if (!question || !question.options) {
					console.log(`Question ${qIndex} has no options`);
					return;
				}
				
				// Find the selected option
				const selectedOption = question.options.find(opt => opt.id === optionId);
				console.log(`Selected option for question ${qIndex}:`, selectedOption);
				if (!selectedOption) {
					console.log(`Could not find option ${optionId} in question ${qIndex}`);
					return;
				}
				
				// Skip questions without values (like generation question at index 0)
				if (!selectedOption.values) {
					console.log(`Skipping question ${qIndex} - no values for scoring`);
					return;
				}
				
				// Add the option's values to our scores
				console.log(`Adding values for question ${qIndex}:`, selectedOption.values);
				scores.collaboration += selectedOption.values.collaboration || 0;
				scores.formality += selectedOption.values.formality || 0;
				scores.tech += selectedOption.values.tech || 0;
				scores.wellness += selectedOption.values.wellness || 0;
				questionCount++;
				console.log(`Running totals after question ${qIndex}:`, { ...scores, questionCount });
			});
			
			// Calculate average scores (0-10 scale as the options use 0-10)
			if (questionCount > 0) {
				scores.collaboration = Math.round(scores.collaboration / questionCount);
				scores.formality = Math.round(scores.formality / questionCount);
				scores.tech = Math.round(scores.tech / questionCount);
				scores.wellness = Math.round(scores.wellness / questionCount);
			}
			
			return scores;
		};
		
		const scores = calculateScores();
		console.log('Final calculated scores:', scores);
		
		try {
			// Complete using remote function
			const result = await completeQuizRemote({ sessionSlug: slug, attendeeId, scores });
			if (result.redirect) {
				goto(result.redirect);
			}
		} catch (error) {
			console.error('Failed to complete quiz:', error);
			alert('Failed to submit results. Please try again.');
		}
	}
	
</script>

<div class="min-h-screen animated-gradient flex items-center justify-center px-4">
	{#if isLoading}
		<!-- Loading state -->
		<div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
			<h1 class="text-2xl font-bold text-gray-800 mb-4">Loading...</h1>
			<p class="text-gray-600">Retrieving your session data...</p>
		</div>
	{:else if !attendee}
		<!-- Not found state -->
		<div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
			<h1 class="text-2xl font-bold text-gray-800 mb-4">Session Not Found</h1>
			<p class="text-gray-600">Please check your link and try again.</p>
		</div>
	{:else if question}
		<!-- Question Display -->
		<div class="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
			<!-- Header with name -->
			<div class="mb-4">
				<div class="text-sm text-gray-600">
					Welcome back, <span class="font-semibold">{attendee.name}</span>
				</div>
			</div>
			
			<!-- Progress Bar -->
			<div class="mb-6">
				<div class="flex justify-between text-sm text-gray-600 mb-2">
					<span>Question {currentQuestion + 1} of {questions.length}</span>
					<span>{Math.round(progress)}% Complete</span>
				</div>
				<div class="w-full bg-gray-200 rounded-full h-2">
					<div 
						class="bg-gray-600 h-2 rounded-full transition-all duration-300"
						style="width: {progress}%"
					></div>
				</div>
			</div>
			
			<!-- Question -->
			<h2 class="text-2xl font-bold text-gray-800 mb-6">{question.title}</h2>
			
			<!-- Options -->
			<div class="space-y-3">
				{#each question.options as option}
					<button
						onclick={() => selectOption(option.id)}
						disabled={isSubmitting}
						class="w-full p-4 text-left border-2 border-gray-200 rounded-lg transition
						       {responses[currentQuestion] === option.id ? 'border-gray-600 bg-gray-50' : ''}
						       {isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 hover:bg-gray-50'}"
					>
						<div class="font-semibold text-gray-700">{option.label}</div>
						{#if option.description}
							<div class="text-sm text-gray-500 mt-1">{option.description}</div>
						{/if}
					</button>
				{/each}
			</div>
			
			<!-- Loading indicator -->
			{#if isSubmitting}
				<div class="mt-4 text-center text-sm text-gray-600">
					Saving your response...
				</div>
			{/if}
		</div>
	{/if}
</div>