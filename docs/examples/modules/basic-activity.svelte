<!-- 
  Basic Activity Usage Example
  Demonstrates how to create and use a simple activity module
-->
<script lang="ts">
	import type { ActivityModule, ActivityState } from '../activities/types';
	import { onMount } from 'svelte';

	// Example: Simple Yes/No Poll Activity

	// 1. Define the activity state
	function createYesNoState(sessionId: string, participantId?: string): ActivityState {
		let isActive = $state(false);
		let isComplete = $state(false);
		let data = $state({
			question: 'Do you prefer working from home?',
			response: null as 'yes' | 'no' | null
		});
		let error = $state<string | null>(null);

		return {
			get isActive() {
				return isActive;
			},
			get isComplete() {
				return isComplete;
			},
			get currentStep() {
				return 1;
			},
			get totalSteps() {
				return 1;
			},
			get data() {
				return data;
			},
			get error() {
				return error;
			},

			start() {
				isActive = true;
				error = null;
			},

			stop() {
				isActive = false;
			},

			reset() {
				isActive = false;
				isComplete = false;
				data = { question: 'Do you prefer working from home?', response: null };
				error = null;
			},

			async submitResponse(response: any) {
				try {
					// Simulate API call
					await new Promise((resolve) => setTimeout(resolve, 500));
					data.response = response;
					isComplete = true;
					isActive = false;
				} catch (err) {
					error = 'Failed to submit response';
				}
			},

			getResults() {
				return { response: data.response };
			}
		};
	}

	// 2. Create the activity module
	const yesNoModule: ActivityModule = {
		config: {
			id: 'yes-no-poll',
			name: 'Yes/No Poll',
			description: 'Simple binary choice poll',
			icon: '✓',
			version: '1.0.0',
			estimatedDuration: 30,
			tags: ['poll', 'quick', 'binary']
		},

		components: {
			main: null, // Will be this component
			results: null, // Results component would go here
			admin: null // Admin controls would go here
		},

		createState: createYesNoState,

		validateResponse: (response) => {
			return response === 'yes' || response === 'no';
		},

		calculateScore: (responses) => {
			const yesCount = responses.filter((r) => r === 'yes').length;
			const noCount = responses.filter((r) => r === 'no').length;
			return { yes: yesCount, no: noCount, total: responses.length };
		}
	};

	// 3. Use the activity in a component
	let sessionId = 'demo-session';
	let activityState = yesNoModule.createState(sessionId);

	onMount(() => {
		activityState.start();
	});

	async function handleResponse(choice: 'yes' | 'no') {
		if (yesNoModule.validateResponse(choice)) {
			await activityState.submitResponse(choice);
		}
	}
</script>

<div class="activity-container">
	<div class="activity-header">
		<span class="activity-icon">{yesNoModule.config.icon}</span>
		<div>
			<h2>{yesNoModule.config.name}</h2>
			<p>{yesNoModule.config.description}</p>
		</div>
	</div>

	{#if activityState.error}
		<div class="error-message">
			{activityState.error}
		</div>
	{/if}

	{#if activityState.isActive && !activityState.isComplete}
		<div class="activity-content">
			<h3 class="question">{activityState.data.question}</h3>

			<div class="response-buttons">
				<button class="response-button yes-button" onclick={() => handleResponse('yes')}>
					👍 Yes
				</button>

				<button class="response-button no-button" onclick={() => handleResponse('no')}>
					👎 No
				</button>
			</div>
		</div>
	{:else if activityState.isComplete}
		<div class="completion-message">
			<h3>Thank you!</h3>
			<p>Your response: <strong>{activityState.data.response}</strong></p>

			<button
				class="reset-button"
				onclick={() => {
					activityState.reset();
					activityState.start();
				}}
			>
				Try Again
			</button>
		</div>
	{:else}
		<div class="loading-message">
			<p>Starting activity...</p>
		</div>
	{/if}

	<!-- Activity status indicator -->
	<div class="status-bar">
		<div class="status-item">
			Status:
			<span
				class="status-badge"
				class:active={activityState.isActive}
				class:complete={activityState.isComplete}
			>
				{activityState.isActive ? 'Active' : activityState.isComplete ? 'Complete' : 'Inactive'}
			</span>
		</div>
		<div class="status-item">
			Step: {activityState.currentStep} / {activityState.totalSteps}
		</div>
	</div>
</div>

<style>
	.activity-container {
		max-width: 600px;
		margin: 2rem auto;
		padding: 2rem;
		border: 1px solid #e5e7eb;
		border-radius: 1rem;
		background: white;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	.activity-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.activity-icon {
		font-size: 2rem;
		width: 3rem;
		height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f3f4f6;
		border-radius: 0.5rem;
	}

	.activity-header h2 {
		margin: 0;
		color: #1f2937;
	}

	.activity-header p {
		margin: 0.25rem 0 0 0;
		color: #6b7280;
	}

	.error-message {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.activity-content {
		text-align: center;
	}

	.question {
		font-size: 1.25rem;
		margin-bottom: 2rem;
		color: #1f2937;
	}

	.response-buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.response-button {
		padding: 1rem 2rem;
		font-size: 1.1rem;
		border: 2px solid;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.2s;
		min-width: 120px;
	}

	.yes-button {
		background: #dcfce7;
		border-color: #16a34a;
		color: #15803d;
	}

	.yes-button:hover {
		background: #16a34a;
		color: white;
	}

	.no-button {
		background: #fef2f2;
		border-color: #dc2626;
		color: #dc2626;
	}

	.no-button:hover {
		background: #dc2626;
		color: white;
	}

	.completion-message {
		text-align: center;
		padding: 2rem;
	}

	.completion-message h3 {
		color: #16a34a;
		margin-bottom: 1rem;
	}

	.reset-button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
	}

	.reset-button:hover {
		background: #2563eb;
	}

	.loading-message {
		text-align: center;
		padding: 2rem;
		color: #6b7280;
	}

	.status-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.status-badge {
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-weight: 500;
		text-transform: uppercase;
		font-size: 0.75rem;
	}

	.status-badge.active {
		background: #dbeafe;
		color: #1e40af;
	}

	.status-badge.complete {
		background: #dcfce7;
		color: #15803d;
	}
</style>
