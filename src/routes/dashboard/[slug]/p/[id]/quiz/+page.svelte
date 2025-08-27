<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { questions } from '$lib/questions';
	import type { Session, Participant } from '$lib/server/db/schema';
	import { 
		loadParticipantData, 
		saveResponse, 
		completeQuiz as completeQuizRemote 
	} from '../../../participant.remote';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
	import ErrorScreen from '$lib/components/ErrorScreen.svelte';
	import QuestionCard from '$lib/components/QuestionCard.svelte';
	
	// Get IDs from URL - use derived for Svelte 5 runes mode
	let slug = $derived($page.params.slug);
	let participantId = $derived($page.params.id);
	
	// State
	let session = $state<Session | null>(null);
	let participant = $state<Participant | null>(null);
	let loadedQuestions = $state<any[]>([]);
	let sessionCode = $state('');
	let currentQuestion = $state(0);
	let responses: Record<number, string> = $state({});
	let isSubmitting = $state(false);
	let isLoading = $state(true);
	
	// Derived values
	let question = $derived(loadedQuestions[currentQuestion]);
	let progress = $derived(loadedQuestions.length > 0 ? ((currentQuestion + 1) / loadedQuestions.length) * 100 : 0);
	
	
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
			loadedQuestions = data.questions;
			sessionCode = data.sessionCode;
			
			// Restore previous responses
			if (participant?.responses) {
				responses = participant.responses as Record<number, string>;
				// Find where they left off
				for (let i = 0; i < loadedQuestions.length; i++) {
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
			if (currentQuestion < loadedQuestions.length - 1) {
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
				const question = loadedQuestions[parseInt(qIndex)];
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
		<div class="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
			<!-- Header with name -->
			<div class="mb-4">
				<div class="text-sm text-gray-600">
					Welcome back, <span class="font-semibold">{participant.name}</span>
				</div>
			</div>
			
			<!-- Question Card Component -->
			<QuestionCard
				title={question.title}
				options={question.options}
				selectedId={responses[currentQuestion]}
				onSelect={selectOption}
				disabled={isSubmitting}
				questionNumber={currentQuestion + 1}
				totalQuestions={loadedQuestions.length}
				{progress}
				variant="default"
				colorScheme="gray"
			/>
		</div>
	</div>
{/if}