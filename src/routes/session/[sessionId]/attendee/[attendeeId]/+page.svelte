<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { realtime } from '$lib/attachments/realtime';
	import { attendeeQuizStore } from '$lib/stores';
	import { 
		loadAttendeeData, 
		saveResponse, 
		completeQuiz as completeQuizRemote 
	} from './quiz.remote';
	
	// Get IDs from URL
	let sessionId = $derived(page.params.sessionId);
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
	let connectionStatus = $state<'connecting' | 'connected' | 'disconnected'>('connecting');
	
	// Derived values
	let question = $derived(questions[currentQuestion]);
	let progress = $derived(questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0);
	
	// Reference to the main container for disconnecting SSE
	let mainContainer: HTMLElement;
	
	// Load initial data
	$effect(() => {
		// Only run on client side when IDs are available
		if (!sessionId || !attendeeId) {
			if (sessionId === undefined || attendeeId === undefined) {
				console.warn('Missing session or attendee ID');
				isLoading = false;
			}
			return;
		}
		
		loadAttendeeData({ sessionId, attendeeId }).then(data => {
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
			await saveResponse({ sessionId, attendeeId, questionIndex: currentQuestion, response: optionId, generation });
			
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
		} finally {
			isSubmitting = false;
		}
	}
	
	// Calculate scores and complete quiz using centralized logic
	async function completeQuiz() {
		// Initialize quiz store with current data for score calculation
		attendeeQuizStore.initialize(sessionId, attendeeId, questions);
		attendeeQuizStore.responses = responses;
		
		// Get calculated scores from the store
		const scores = attendeeQuizStore.preferenceScores;
		
		console.log('Final calculated scores from store:', scores);
		
		try {
			// Complete using remote function
			const result = await completeQuizRemote({ sessionId, attendeeId, scores });
			if (result.redirect) {
				goto(result.redirect);
			}
		} catch (error) {
			console.error('Failed to complete quiz:', error);
			alert('Failed to submit results. Please try again.');
		}
	}
	
	// Handle real-time events
	function handleRealtime(node: HTMLElement) {
		function handleConnected() {
			connectionStatus = 'connected';
		}
		
		function handleDisconnected() {
			connectionStatus = 'disconnected';
		}
		
		node.addEventListener('realtime:connected', handleConnected);
		node.addEventListener('realtime:disconnected', handleDisconnected);
		
		return () => {
			node.removeEventListener('realtime:connected', handleConnected);
			node.removeEventListener('realtime:disconnected', handleDisconnected);
		};
	}
</script>

<div 
	{@attach realtime({ 
		url: `/api/sessions/${sessionId}/stream`,
		reconnect: true,
		reconnectDelay: 1000
	})}
	{@attach handleRealtime}
	class="min-h-screen animated-gradient flex items-center justify-center px-4"
>
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
			<!-- Header with name and connection status -->
			<div class="mb-4 flex justify-between items-center">
				<div class="text-sm text-gray-600">
					Welcome back, <span class="font-semibold">{attendee.name}</span>
				</div>
				<div class="flex items-center gap-1">
					<span class="relative flex h-2 w-2">
						{#if connectionStatus === 'connected'}
							<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
							<span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
						{:else if connectionStatus === 'connecting'}
							<span class="animate-pulse relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
						{:else}
							<span class="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
						{/if}
					</span>
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