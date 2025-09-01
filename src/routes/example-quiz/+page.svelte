<!--
  Example: Using the Optimized Quiz Component with SvelteKit Form Actions
-->
<script>
	import { Quiz } from '$lib/components/modules/activities';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	// Sample questions for demonstration
	const questions = [
		{
			id: 'mood',
			text: 'How are you feeling today?',
			type: 'emoji',
			required: true,
			options: [
				{ id: 'great', value: 'great', label: '😍 Great', score: 5 },
				{ id: 'good', value: 'good', label: '😊 Good', score: 4 },
				{ id: 'okay', value: 'okay', label: '😐 Okay', score: 3 },
				{ id: 'tired', value: 'tired', label: '😕 Tired', score: 2 },
				{ id: 'stressed', value: 'stressed', label: '😢 Stressed', score: 1 }
			]
		},
		{
			id: 'workload',
			text: 'How would you rate your current workload?',
			type: 'rating',
			required: true,
			minValue: 1,
			maxValue: 5,
			labels: { min: 'Too Light', max: 'Overwhelming' }
		},
		{
			id: 'feedback',
			text: 'Any additional feedback?',
			type: 'text',
			required: false,
			placeholder: 'Share your thoughts...'
		}
	];

	// Quiz configuration
	const options = {
		type: 'survey',
		allowSkip: true,
		showProgress: true,
		autoAdvance: false,
		timeLimit: 300 // 5 minutes
	};

	// Form action result
	let formResult = $state(null);

	// Handle quiz completion
	function handleComplete(result) {
		console.log('Quiz completed:', result);
		formResult = result;
	}

	// Handle individual responses (optional)
	function handleResponse(response) {
		console.log('Response submitted:', response);
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="max-w-4xl mx-auto">
		<!-- Header -->
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold text-gray-900 mb-4">
				Example Quiz Component
			</h1>
			<p class="text-lg text-gray-600">
				Demonstrating the optimized Quiz component with SvelteKit form actions
			</p>
		</div>

		<!-- Quiz Component -->
		<Quiz
			{questions}
			{options}
			action="?/saveResponse"
			onComplete={handleComplete}
			onResponse={handleResponse}
			class="mb-8"
		/>

		<!-- Form Action Result (for demonstration) -->
		{#if formResult}
			<div class="bg-green-50 border border-green-200 rounded-lg p-6">
				<h3 class="text-lg font-semibold text-green-800 mb-2">
					Quiz Completed Successfully! 🎉
				</h3>
				<div class="text-sm text-green-700">
					<p><strong>Responses:</strong> {formResult.responses?.length || 0}</p>
					{#if formResult.overallScore}
						<p><strong>Score:</strong> {formResult.overallScore}</p>
					{/if}
					{#if formResult.sentiment}
						<p><strong>Sentiment:</strong> {formResult.sentiment}</p>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Usage Instructions -->
		<div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
			<h3 class="text-lg font-semibold text-blue-800 mb-4">
				How to Use the Quiz Component
			</h3>
			<div class="space-y-3 text-sm text-blue-700">
				<div>
					<strong>1. Import the component:</strong>
					<code class="block bg-blue-100 p-2 rounded mt-1">
						import { Quiz } from '$lib/components/modules/activities';
					</code>
				</div>
				<div>
					<strong>2. Define questions:</strong>
					<code class="block bg-blue-100 p-2 rounded mt-1">
						const questions = [{ id: 'q1', text: 'Question?', type: 'rating', ... }];
					</code>
				</div>
				<div>
					<strong>3. Configure options:</strong>
					<code class="block bg-blue-100 p-2 rounded mt-1">
						const options = { type: 'survey', allowSkip: true, showProgress: true };
					</code>
				</div>
				<div>
					<strong>4. Use in template:</strong>
					<code class="block bg-blue-100 p-2 rounded mt-1">
						&lt;Quiz {questions} {options} action="?/saveResponse" onComplete={handleComplete} /&gt;
					</code>
				</div>
				<div>
					<strong>5. Handle form actions:</strong>
					<code class="block bg-blue-100 p-2 rounded mt-1">
						export const actions = { saveResponse: async ({ request }) => { ... } };
					</code>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.container {
		min-height: 100vh;
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
	}
</style>