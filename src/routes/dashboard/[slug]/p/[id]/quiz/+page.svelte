<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	import type { Session, Participant } from '$lib/server/db/schema';
	// Removed sessionState - using remote functions directly
	import { 
		loadParticipantData, 
		saveResponse, 
		completeQuiz as completeQuizRemote 
	} from '../../../participant.remote';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
	import ErrorScreen from '$lib/components/ErrorScreen.svelte';
	
	// Get IDs from URL
	const $page = get(page);
	let slug = $state($page.params.slug);
	let participantId = $state($page.params.id);
	
	// State
	let session = $state<Session | null>(null);
	let participant = $state<Participant | null>(null);
	let questions = $state<typeof import('./quiz.svelte.js').questions>([]);
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
		if (!slug || !participantId) {
			if (slug === undefined || participantId === undefined) {
				if (import.meta.env.DEV) {
				console.warn('Missing session or participant ID');
			}
				isLoading = false;
			}
			return;
		}
		
		loadParticipantData({ sessionSlug: slug, participantId: participantId }).then(data => {
			session = data.session;
			participant = data.participant;
			questions = data.questions;
			sessionCode = data.sessionCode;
			
			// Restore previous responses
			if (participant?.responses) {
				responses = participant.responses as Record<number, string>;
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
			if (import.meta.env.DEV) {
			console.error('Failed to load session:', error);
		}
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
			await saveResponse({ sessionSlug: slug, participantId, questionIndex: currentQuestion, response: optionId, generation });
			
			// Move to next question or complete
			if (currentQuestion < questions.length - 1) {
				currentQuestion++;
			} else {
				// Complete the quiz
				await completeQuiz();
			}
		} catch (error) {
			if (import.meta.env.DEV) {
			console.error('Failed to save response:', error);
		}
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
				if (!question || !question.options) {
					return;
				}
				
				// Find the selected option
				const selectedOption = question.options.find(opt => opt.id === optionId);
				if (!selectedOption) {
					return;
				}
				
				// Skip questions without values (like generation question at index 0)
				if (!selectedOption.values) {
					return;
				}
				
				// Add the option's values to our scores
				scores.collaboration += selectedOption.values.collaboration || 0;
				scores.formality += selectedOption.values.formality || 0;
				scores.tech += selectedOption.values.tech || 0;
				scores.wellness += selectedOption.values.wellness || 0;
				questionCount++;
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
		
		try {
			// Complete using remote function
			const result = await completeQuizRemote({ sessionSlug: slug, participantId, scores });
			if (result.redirect) {
				goto(result.redirect);
			}
		} catch (error) {
			if (import.meta.env.DEV) {
			console.error('Failed to complete quiz:', error);
		}
			alert('Failed to submit results. Please try again.');
		}
	}
	
</script>

{#if isLoading}
	<LoadingScreen 
		title="Loading..."
		message="Retrieving your session data..."
	/>
{:else if !participant}
	<ErrorScreen 
		title="Session Not Found"
		message="Please check your link and try again."
	/>
{:else if question}
	<div class="min-h-screen animated-gradient flex items-center justify-center px-4">
		<!-- Question Display -->
		<div class="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
			<!-- Header with name -->
			<div class="mb-4">
				<div class="text-sm text-gray-600">
					Welcome back, <span class="font-semibold">{participant.name}</span>
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
	</div>
{/if}