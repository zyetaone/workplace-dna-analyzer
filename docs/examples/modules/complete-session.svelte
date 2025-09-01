<!-- 
  Complete Session Example
  Demonstrates a full session workflow with multiple activities and AI assistant
-->
<script lang="ts">
	import ZyetaIAssistant from '../ZyetaI/ZyetaIAssistant.svelte';
	import type { ActivityModule, ActivityState } from '../activities/types';
	import type { SessionAnalytics } from '../analytics/types';

	// Session state
	let sessionCode = $state('DEMO456');
	let sessionName = $state('Workplace Transformation Workshop');
	let sessionStatus = $state<'setup' | 'active' | 'completed'>('setup');
	let currentActivityIndex = $state(0);

	// Participant simulation
	let participants = $state([
		{ id: '1', name: 'Alice Johnson', joined: true, completed: false, generation: 'Millennials' },
		{ id: '2', name: 'Bob Smith', joined: true, completed: false, generation: 'Gen X' },
		{ id: '3', name: 'Carol Davis', joined: true, completed: true, generation: 'Gen Z' },
		{ id: '4', name: 'David Wilson', joined: false, completed: false, generation: 'Baby Boomers' }
	]);

	// Activity definitions
	const activities: ActivityModule[] = [
		// 1. Ice Breaker Poll
		{
			config: {
				id: 'ice-breaker',
				name: 'Ice Breaker Poll',
				description: 'Quick yes/no question to get everyone engaged',
				icon: '🧊',
				version: '1.0.0',
				estimatedDuration: 30,
				tags: ['icebreaker', 'quick']
			},
			components: { main: null },
			createState: () => ({
				get isActive() {
					return true;
				},
				get isComplete() {
					return false;
				},
				get currentStep() {
					return 1;
				},
				get totalSteps() {
					return 1;
				},
				get data() {
					return { question: 'Are you excited about workplace transformation?', responses: [] };
				},
				get error() {
					return null;
				},
				start: () => {},
				stop: () => {},
				reset: () => {},
				submitResponse: async () => {},
				getResults: () => ({})
			})
		},

		// 2. Workplace Preference Survey
		{
			config: {
				id: 'preference-survey',
				name: 'Workplace Preferences',
				description: '7-question survey about work style preferences',
				icon: '📝',
				version: '1.0.0',
				estimatedDuration: 300,
				tags: ['survey', 'preferences', 'core']
			},
			components: { main: null },
			createState: () => ({
				get isActive() {
					return true;
				},
				get isComplete() {
					return false;
				},
				get currentStep() {
					return 1;
				},
				get totalSteps() {
					return 7;
				},
				get data() {
					return { questions: [], responses: [], currentQuestionIndex: 0 };
				},
				get error() {
					return null;
				},
				start: () => {},
				stop: () => {},
				reset: () => {},
				submitResponse: async () => {},
				getResults: () => ({})
			})
		},

		// 3. Brainstorm Session
		{
			config: {
				id: 'brainstorm',
				name: 'Improvement Ideas',
				description: 'Collaborative brainstorming for workplace improvements',
				icon: '💡',
				version: '1.0.0',
				estimatedDuration: 600,
				tags: ['brainstorm', 'collaborative', 'ideas']
			},
			components: { main: null },
			createState: () => ({
				get isActive() {
					return true;
				},
				get isComplete() {
					return false;
				},
				get currentStep() {
					return 1;
				},
				get totalSteps() {
					return 1;
				},
				get data() {
					return {
						prompt: 'What workplace improvements would make the biggest impact?',
						ideas: []
					};
				},
				get error() {
					return null;
				},
				start: () => {},
				stop: () => {},
				reset: () => {},
				submitResponse: async () => {},
				getResults: () => ({})
			})
		}
	];

	// Current activity state
	let currentActivity = $derived(activities[currentActivityIndex]);
	let currentActivityState = $derived(currentActivity?.createState(sessionCode));

	// Session analytics (mock data)
	let sessionAnalytics = $state<SessionAnalytics>({
		participantCount: 4,
		completionRate: 0.25,
		averageScores: {
			collaboration: 7.5,
			formality: 5.2,
			tech: 8.1,
			wellness: 6.8
		},
		generationBreakdown: {
			'Gen Z': 1,
			Millennials: 1,
			'Gen X': 1,
			'Baby Boomers': 1
		},
		engagementMetrics: {
			averageTimeSpent: 180,
			interactionRate: 0.85,
			dropoffRate: 0.15
		},
		insights: [],
		timestamp: new Date().toISOString()
	});

	// Session management functions
	function startSession() {
		sessionStatus = 'active';
		currentActivityState?.start();
	}

	function nextActivity() {
		if (currentActivityIndex < activities.length - 1) {
			currentActivityState?.stop();
			currentActivityIndex++;
			setTimeout(() => {
				currentActivityState?.start();
			}, 100);
		} else {
			completeSession();
		}
	}

	function completeSession() {
		sessionStatus = 'completed';
		currentActivityState?.stop();
	}

	function resetSession() {
		sessionStatus = 'setup';
		currentActivityIndex = 0;
		// Reset all participant data
		participants = participants.map((p) => ({ ...p, completed: false }));
	}

	// Simulate participant joining
	function simulateParticipantJoin() {
		const unjoinedParticipant = participants.find((p) => !p.joined);
		if (unjoinedParticipant) {
			unjoinedParticipant.joined = true;
			sessionAnalytics.participantCount++;
			showToast(`${unjoinedParticipant.name} joined the session!`);
		}
	}

	// Simulate activity completion
	function simulateActivityCompletion() {
		const incompleteParticipant = participants.find((p) => p.joined && !p.completed);
		if (incompleteParticipant) {
			incompleteParticipant.completed = true;
			sessionAnalytics.completionRate =
				participants.filter((p) => p.completed).length /
				participants.filter((p) => p.joined).length;
			showToast(`${incompleteParticipant.name} completed the activity!`);
		}
	}

	// Toast notification system
	let toastMessage = $state('');
	let showToastFlag = $state(false);

	function showToast(message: string) {
		toastMessage = message;
		showToastFlag = true;
		setTimeout(() => {
			showToastFlag = false;
		}, 3000);
	}

	// QR code generation (mock)
	let qrCodeUrl = $derived(`${window?.location?.origin || 'https://app.zyeta.com'}/${sessionCode}`);
</script>

<div class="session-container">
	<!-- Session Header -->
	<header class="session-header">
		<div class="session-info">
			<h1>{sessionName}</h1>
			<div class="session-meta">
				<span class="session-code">Code: {sessionCode}</span>
				<span
					class="session-status"
					class:active={sessionStatus === 'active'}
					class:completed={sessionStatus === 'completed'}
				>
					{sessionStatus}
				</span>
			</div>
		</div>

		<div class="session-controls">
			{#if sessionStatus === 'setup'}
				<button class="primary-button" onclick={startSession}> 🚀 Start Session </button>
			{:else if sessionStatus === 'active'}
				<button class="secondary-button" onclick={nextActivity}>
					{currentActivityIndex < activities.length - 1
						? '⏭️ Next Activity'
						: '🏁 Complete Session'}
				</button>
			{:else}
				<button class="secondary-button" onclick={resetSession}> 🔄 Reset Session </button>
			{/if}
		</div>
	</header>

	<!-- Session Status Overview -->
	<div class="status-overview">
		<div class="progress-section">
			<h3>Session Progress</h3>
			<div class="activity-progress">
				{#each activities as activity, index}
					<div
						class="activity-step"
						class:active={index === currentActivityIndex}
						class:completed={index < currentActivityIndex}
					>
						<div class="step-icon">{activity.config.icon}</div>
						<div class="step-info">
							<div class="step-name">{activity.config.name}</div>
							<div class="step-duration">{Math.floor(activity.config.estimatedDuration / 60)}m</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<div class="participants-section">
			<h3>Participants ({participants.filter((p) => p.joined).length}/{participants.length})</h3>
			<div class="participant-list">
				{#each participants as participant}
					<div
						class="participant-item"
						class:joined={participant.joined}
						class:completed={participant.completed}
					>
						<div class="participant-avatar">
							{participant.name.charAt(0)}
						</div>
						<div class="participant-info">
							<span class="participant-name">{participant.name}</span>
							<span class="participant-generation">{participant.generation}</span>
						</div>
						<div class="participant-status">
							{#if !participant.joined}
								<span class="status-badge pending">Pending</span>
							{:else if participant.completed}
								<span class="status-badge completed">✓ Completed</span>
							{:else}
								<span class="status-badge active">Active</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Main Content Area -->
	<div class="main-content">
		{#if sessionStatus === 'setup'}
			<!-- Setup Phase -->
			<div class="setup-phase">
				<div class="qr-section">
					<h3>Participants can join using:</h3>
					<div class="join-methods">
						<div class="qr-code">
							<div class="qr-placeholder">
								<div class="qr-pattern"></div>
							</div>
							<p>Scan QR Code</p>
						</div>
						<div class="join-code">
							<div class="code-display">{sessionCode}</div>
							<p>Enter code at<br /><strong>zyeta.com/join</strong></p>
						</div>
					</div>
				</div>

				<div class="session-preview">
					<h3>Session Overview</h3>
					<div class="activity-preview">
						{#each activities as activity}
							<div class="preview-card">
								<div class="preview-icon">{activity.config.icon}</div>
								<div class="preview-content">
									<h4>{activity.config.name}</h4>
									<p>{activity.config.description}</p>
									<div class="preview-meta">
										<span>~{Math.floor(activity.config.estimatedDuration / 60)} min</span>
										<div class="preview-tags">
											{#each activity.config.tags as tag}
												<span class="tag">{tag}</span>
											{/each}
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{:else if sessionStatus === 'active'}
			<!-- Active Session Phase -->
			<div class="active-phase">
				<div class="current-activity">
					<div class="activity-header">
						<div class="activity-title">
							<span class="activity-icon">{currentActivity.config.icon}</span>
							<div>
								<h2>{currentActivity.config.name}</h2>
								<p>{currentActivity.config.description}</p>
							</div>
						</div>
						<div class="activity-progress-indicator">
							Activity {currentActivityIndex + 1} of {activities.length}
						</div>
					</div>

					<!-- Activity Simulation -->
					<div class="activity-simulation">
						<div class="simulation-controls">
							<h4>Simulate Activity Events:</h4>
							<div class="control-buttons">
								<button onclick={simulateParticipantJoin}> 👤 Participant Joins </button>
								<button onclick={simulateActivityCompletion}> ✅ Complete Activity </button>
							</div>
						</div>

						<!-- Mock Activity Interface -->
						<div class="mock-activity">
							{#if currentActivity.config.id === 'ice-breaker'}
								<div class="ice-breaker-mock">
									<h3>Are you excited about workplace transformation?</h3>
									<div class="mock-options">
										<button class="option-button">👍 Yes (3)</button>
										<button class="option-button">👎 No (1)</button>
									</div>
								</div>
							{:else if currentActivity.config.id === 'preference-survey'}
								<div class="survey-mock">
									<h3>Question 1 of 7</h3>
									<p>How do you prefer to collaborate with your team?</p>
									<div class="mock-scale">
										{#each Array(10) as _, i}
											<button class="scale-button" class:selected={i === 6}>
												{i + 1}
											</button>
										{/each}
									</div>
									<div class="scale-labels">
										<span>Individual Work</span>
										<span>Team Collaboration</span>
									</div>
								</div>
							{:else if currentActivity.config.id === 'brainstorm'}
								<div class="brainstorm-mock">
									<h3>What workplace improvements would make the biggest impact?</h3>
									<div class="ideas-list">
										<div class="idea-item">💡 Flexible work schedules</div>
										<div class="idea-item">🌱 More plants and natural light</div>
										<div class="idea-item">🤝 Better collaboration tools</div>
										<div class="idea-item">☕ Improved break areas</div>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Real-time Analytics -->
				<div class="live-analytics">
					<h3>Live Analytics</h3>
					<div class="analytics-grid">
						<div class="analytics-card">
							<div class="card-value">{sessionAnalytics.participantCount}</div>
							<div class="card-label">Participants</div>
						</div>
						<div class="analytics-card">
							<div class="card-value">{Math.round(sessionAnalytics.completionRate * 100)}%</div>
							<div class="card-label">Completion Rate</div>
						</div>
						<div class="analytics-card">
							<div class="card-value">
								{sessionAnalytics.averageScores.collaboration.toFixed(1)}
							</div>
							<div class="card-label">Avg Collaboration</div>
						</div>
						<div class="analytics-card">
							<div class="card-value">{sessionAnalytics.averageScores.tech.toFixed(1)}</div>
							<div class="card-label">Avg Technology</div>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<!-- Completed Session Phase -->
			<div class="completed-phase">
				<div class="completion-celebration">
					<h2>🎉 Session Completed!</h2>
					<p>All activities have been finished. Here's a summary of the results:</p>
				</div>

				<div class="final-results">
					<div class="results-overview">
						<h3>Session Summary</h3>
						<div class="summary-stats">
							<div class="summary-item">
								<strong>{participants.filter((p) => p.joined).length}</strong> participants joined
							</div>
							<div class="summary-item">
								<strong>{Math.round(sessionAnalytics.completionRate * 100)}%</strong> completion rate
							</div>
							<div class="summary-item">
								<strong>{activities.length}</strong> activities completed
							</div>
						</div>
					</div>

					<div class="preference-summary">
						<h3>Workplace Preferences</h3>
						<div class="preference-scores">
							{#each Object.entries(sessionAnalytics.averageScores) as [key, value]}
								<div class="preference-item">
									<span class="preference-label">{key}</span>
									<div class="preference-bar">
										<div class="preference-fill" style="width: {value * 10}%"></div>
									</div>
									<span class="preference-value">{value.toFixed(1)}</span>
								</div>
							{/each}
						</div>
					</div>

					<div class="next-steps">
						<h3>Recommended Next Steps</h3>
						<ul>
							<li>Review detailed analytics in the dashboard</li>
							<li>Share results with team members</li>
							<li>Plan implementation of top improvement ideas</li>
							<li>Schedule follow-up sessions to track progress</li>
						</ul>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Toast Notifications -->
	{#if showToastFlag}
		<div class="toast-notification">
			{toastMessage}
		</div>
	{/if}

	<!-- ZyetaI AI Assistant -->
	<ZyetaIAssistant {sessionCode} position="bottom-right" theme="purple" />
</div>

<style>
	.session-container {
		min-height: 100vh;
		background: #f9fafb;
		padding: 1rem;
	}

	.session-header {
		background: white;
		padding: 1.5rem 2rem;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.session-info h1 {
		margin: 0 0 0.5rem 0;
		color: #1f2937;
	}

	.session-meta {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.session-code {
		background: #f3f4f6;
		padding: 0.25rem 0.75rem;
		border-radius: 0.375rem;
		font-family: monospace;
		font-weight: 600;
	}

	.session-status {
		padding: 0.25rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
		background: #f3f4f6;
		color: #6b7280;
	}

	.session-status.active {
		background: #dbeafe;
		color: #1e40af;
	}

	.session-status.completed {
		background: #dcfce7;
		color: #15803d;
	}

	.primary-button {
		background: #3b82f6;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 0.375rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.primary-button:hover {
		background: #2563eb;
	}

	.secondary-button {
		background: #f3f4f6;
		color: #374151;
		border: 1px solid #d1d5db;
		padding: 0.75rem 1.5rem;
		border-radius: 0.375rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.secondary-button:hover {
		background: #e5e7eb;
	}

	.status-overview {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.progress-section,
	.participants-section {
		background: white;
		padding: 1.5rem;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.progress-section h3,
	.participants-section h3 {
		margin: 0 0 1rem 0;
		color: #1f2937;
	}

	.activity-progress {
		display: flex;
		gap: 1rem;
		overflow-x: auto;
		padding-bottom: 0.5rem;
	}

	.activity-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 120px;
		padding: 1rem;
		border-radius: 0.5rem;
		background: #f9fafb;
		border: 2px solid #e5e7eb;
		transition: all 0.2s;
	}

	.activity-step.active {
		background: #dbeafe;
		border-color: #3b82f6;
	}

	.activity-step.completed {
		background: #dcfce7;
		border-color: #10b981;
	}

	.step-icon {
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
	}

	.step-name {
		font-weight: 600;
		text-align: center;
		margin-bottom: 0.25rem;
	}

	.step-duration {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.participant-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.participant-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		border-radius: 0.375rem;
		background: #f9fafb;
		opacity: 0.5;
		transition: all 0.2s;
	}

	.participant-item.joined {
		opacity: 1;
		background: white;
		border: 1px solid #e5e7eb;
	}

	.participant-avatar {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: #3b82f6;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
	}

	.participant-info {
		flex: 1;
	}

	.participant-name {
		font-weight: 600;
		display: block;
	}

	.participant-generation {
		font-size: 0.75rem;
		color: #6b7280;
	}

	.status-badge {
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.status-badge.pending {
		background: #fef3c7;
		color: #92400e;
	}

	.status-badge.active {
		background: #dbeafe;
		color: #1e40af;
	}

	.status-badge.completed {
		background: #dcfce7;
		color: #15803d;
	}

	.main-content {
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.setup-phase {
		padding: 2rem;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3rem;
	}

	.join-methods {
		display: flex;
		gap: 2rem;
		margin-top: 1rem;
	}

	.qr-code,
	.join-code {
		text-align: center;
		flex: 1;
	}

	.qr-placeholder {
		width: 150px;
		height: 150px;
		background: #f3f4f6;
		border: 2px dashed #d1d5db;
		border-radius: 0.5rem;
		margin: 0 auto 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.qr-pattern {
		width: 100px;
		height: 100px;
		background:
			linear-gradient(45deg, #000 25%, transparent 25%),
			linear-gradient(-45deg, #000 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, #000 75%),
			linear-gradient(-45deg, transparent 75%, #000 75%);
		background-size: 10px 10px;
		background-position:
			0 0,
			0 5px,
			5px -5px,
			-5px 0px;
	}

	.code-display {
		font-size: 2rem;
		font-weight: 700;
		font-family: monospace;
		background: #3b82f6;
		color: white;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.activity-preview {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.preview-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		background: #f9fafb;
	}

	.preview-icon {
		font-size: 1.5rem;
		width: 3rem;
		height: 3rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: white;
		border-radius: 0.375rem;
	}

	.preview-content h4 {
		margin: 0 0 0.25rem 0;
	}

	.preview-content p {
		margin: 0 0 0.5rem 0;
		color: #6b7280;
		font-size: 0.875rem;
	}

	.preview-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.preview-tags {
		display: flex;
		gap: 0.25rem;
	}

	.tag {
		background: #e5e7eb;
		color: #374151;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		font-size: 0.625rem;
		text-transform: uppercase;
		font-weight: 600;
	}

	.active-phase {
		padding: 2rem;
	}

	.activity-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.activity-title {
		display: flex;
		align-items: center;
		gap: 1rem;
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

	.activity-title h2 {
		margin: 0 0 0.25rem 0;
	}

	.activity-title p {
		margin: 0;
		color: #6b7280;
	}

	.activity-progress-indicator {
		background: #f3f4f6;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		font-weight: 600;
		color: #374151;
	}

	.activity-simulation {
		margin-bottom: 2rem;
	}

	.simulation-controls {
		background: #fef3c7;
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.simulation-controls h4 {
		margin: 0 0 0.5rem 0;
		color: #92400e;
	}

	.control-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.control-buttons button {
		background: #f59e0b;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.mock-activity {
		padding: 2rem;
		background: #f9fafb;
		border-radius: 0.5rem;
		border: 2px dashed #d1d5db;
	}

	.ice-breaker-mock,
	.survey-mock,
	.brainstorm-mock {
		text-align: center;
	}

	.ice-breaker-mock h3,
	.survey-mock h3,
	.brainstorm-mock h3 {
		margin-bottom: 1.5rem;
		color: #1f2937;
	}

	.mock-options {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.option-button {
		padding: 1rem 2rem;
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.2s;
	}

	.option-button:hover {
		border-color: #3b82f6;
		background: #dbeafe;
	}

	.mock-scale {
		display: flex;
		gap: 0.5rem;
		justify-content: center;
		margin-bottom: 1rem;
	}

	.scale-button {
		width: 2.5rem;
		height: 2.5rem;
		border: 2px solid #e5e7eb;
		background: white;
		border-radius: 0.375rem;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.2s;
	}

	.scale-button:hover,
	.scale-button.selected {
		border-color: #3b82f6;
		background: #dbeafe;
	}

	.scale-labels {
		display: flex;
		justify-content: space-between;
		font-size: 0.875rem;
		color: #6b7280;
		max-width: 400px;
		margin: 0 auto;
	}

	.ideas-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-width: 400px;
		margin: 0 auto;
	}

	.idea-item {
		background: white;
		padding: 0.75rem;
		border-radius: 0.375rem;
		border: 1px solid #e5e7eb;
		text-align: left;
	}

	.live-analytics {
		background: #f9fafb;
		padding: 1.5rem;
		border-top: 1px solid #e5e7eb;
	}

	.live-analytics h3 {
		margin: 0 0 1rem 0;
		color: #1f2937;
	}

	.analytics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
	}

	.analytics-card {
		background: white;
		padding: 1rem;
		border-radius: 0.375rem;
		text-align: center;
		border: 1px solid #e5e7eb;
	}

	.card-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: #1f2937;
		margin-bottom: 0.25rem;
	}

	.card-label {
		font-size: 0.75rem;
		color: #6b7280;
		text-transform: uppercase;
		font-weight: 600;
	}

	.completed-phase {
		padding: 2rem;
		text-align: center;
	}

	.completion-celebration h2 {
		color: #059669;
		margin-bottom: 0.5rem;
	}

	.final-results {
		display: grid;
		gap: 2rem;
		margin-top: 2rem;
	}

	.results-overview,
	.preference-summary,
	.next-steps {
		background: #f9fafb;
		padding: 1.5rem;
		border-radius: 0.5rem;
		border: 1px solid #e5e7eb;
	}

	.summary-stats {
		display: flex;
		justify-content: space-around;
		gap: 1rem;
	}

	.summary-item {
		text-align: center;
	}

	.preference-scores {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 400px;
		margin: 0 auto;
	}

	.preference-item {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.preference-label {
		min-width: 100px;
		text-align: left;
		text-transform: capitalize;
		font-weight: 600;
	}

	.preference-bar {
		flex: 1;
		height: 0.5rem;
		background: #e5e7eb;
		border-radius: 0.25rem;
		overflow: hidden;
	}

	.preference-fill {
		height: 100%;
		background: #3b82f6;
		border-radius: 0.25rem;
		transition: width 0.5s ease;
	}

	.preference-value {
		min-width: 2rem;
		text-align: right;
		font-weight: 600;
	}

	.next-steps ul {
		list-style: none;
		padding: 0;
		text-align: left;
		max-width: 400px;
		margin: 0 auto;
	}

	.next-steps li {
		padding: 0.5rem 0;
		border-bottom: 1px solid #e5e7eb;
	}

	.next-steps li:last-child {
		border-bottom: none;
	}

	.toast-notification {
		position: fixed;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		background: #059669;
		color: white;
		padding: 1rem 1.5rem;
		border-radius: 0.5rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
		z-index: 1000;
		animation: slideUp 0.3s ease;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(1rem);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}
</style>
