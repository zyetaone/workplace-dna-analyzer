<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components';

	// State management
	let isLoaded = $state(false);

	// Trust indicators - more realistic for a new platform
	const trustIndicators = [
		{ title: 'Teams Using', value: '50+', icon: '🏢' },
		{ title: 'Average Session', value: '15 min', icon: '⏱️' },
		{ title: 'Response Rate', value: '85%', icon: '📊' },
		{ title: 'Setup Time', value: '2 min', icon: '🚀' }
	];

	// Navigate to admin dashboard with error handling
	async function enterDashboard() {
		try {
			await goto('/admin', { invalidateAll: true });
		} catch (error) {
			console.error('Navigation failed:', error);
			throw error;
		}
	}

	// Initialize animations
	onMount(() => {
		isLoaded = true;
	});
</script>

<!-- Floating Orbs Background -->
<div class="floating-orbs">
	<div class="orb orb-1"></div>
	<div class="orb orb-2"></div>
	<div class="orb orb-3"></div>
	<div class="orb orb-4"></div>
</div>

<!-- Hero Section with Swiss Grid -->
<div class="swiss-container swiss-container-2xl">
	<div class="swiss-hero">
		<!-- Swiss Header -->
		<header class="swiss-col-full flex justify-between items-center mb-6">
		<div class="flex items-center space-h-compact">
			<div
				class="w-12 h-12 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-xl flex items-center justify-center shadow-2xl card-hover-lift"
			>
				<span class="text-heading-1 gradient-text-zyeta">Z</span>
			</div>
			<div>
				<h1 class="text-heading-2 text-zyeta">
					Zyeta<span class="gradient-text-zyeta">Live</span>
				</h1>
				<p class="text-caption text-muted">Transform Workplace Intelligence Into Action</p>
			</div>
		</div>
		<Button
			onclick={enterDashboard}
			variant="secondary"
			class="text-sm surface-glass text-white hover:surface-frosted shadow-sm hover:shadow-glass transition-all duration-300 hover-lift"
		>
			Sign In
		</Button>
		</header>

		<!-- Swiss Hero Content -->
		<div class="swiss-hero-content">
			<div class="swiss-flow">
				<!-- Main Content with Swiss Typography -->
				<div class="swiss-stack">
					<h1 class="text-display gradient-text-primary">
						Interactive Workplace Assessments
						<span class="block mt-4">
							That Transform Teams
						</span>
					</h1>
					<p class="text-body text-slate-400 swiss-measure">
						Create QR code sessions, gather instant preference data, and discover your team's
						workplace DNA profile in real-time.
					</p>
					<!-- Key Benefits with Swiss Layout -->
					<div class="swiss-cluster swiss-gap-md text-sm text-slate-300">
							<div class="flex items-center space-x-2">
								<svg class="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									></path>
								</svg>
								<span>No signup required</span>
							</div>
							<div class="flex items-center space-x-2">
								<svg class="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									></path>
								</svg>
								<span>QR code access</span>
							</div>
							<div class="flex items-center space-x-2">
								<svg class="w-4 h-4 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									></path>
								</svg>
								<span>Real-time workplace insights</span>
							</div>
					</div>

					<!-- Swiss CTA Section -->
					<div class="swiss-stack swiss-gap-lg">
						<div class="swiss-cluster swiss-gap-md">
							<Button
								onclick={enterDashboard}
								size="lg"
								class="text-sm gradient-zyeta text-white shadow-glass hover:shadow-glass-hover transform hover:scale-105 transition-all duration-300 hover-glow"
							>
								Create Your First Session
							</Button>
							<Button
								variant="secondary"
								size="lg"
								onclick={() => {
									/* TODO: Add participant join modal */
								}}
								class="text-sm surface-glass text-white hover:surface-frosted shadow-glass hover:shadow-glass-hover transition-all duration-300 hover-lift"
							>
								Enter Session with Code
							</Button>
						</div>
						<!-- Swiss Quick Join Input -->
						<div class="swiss-cluster swiss-gap-sm max-w-sm">
							<input
								type="text"
								placeholder="Enter 6-digit session code"
								class="flex-1 px-4 py-3 bg-slate-900/60 backdrop-blur-xl border border-slate-700/40 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300"
								maxlength="6"
								oninput={(e) => {
									const value = e.currentTarget.value.toUpperCase();
									e.currentTarget.value = value;
									if (value.length === 6) {
										goto(`/${value}`);
									}
								}}
							/>
							<Button
								size="md"
								variant="secondary"
								class="px-6 bg-slate-800/80 hover:bg-slate-700/90 text-slate-200 hover:text-white border border-slate-600/50"
							>
								Go
							</Button>
						</div>
					</div>

					<!-- Swiss Trust Indicators -->
					<div class="swiss-cluster swiss-gap-xl text-sm text-slate-400">
						<div class="flex items-center space-x-2">
							<span class="text-emerald-400">●</span>
							<span>Enterprise Security</span>
						</div>
						<div class="flex items-center space-x-2">
							<span class="text-cyan-400">●</span>
							<span>Real-time Analytics</span>
						</div>
						<div class="flex items-center space-x-2">
							<span class="text-violet-400">●</span>
							<span>Mobile Optimized</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Swiss Hero Visual -->
		<div class="swiss-hero-visual">
			<div class="relative">
				<!-- How It Works with Swiss Grid -->
				<div class="swiss-stack swiss-gap-xl">
					<h2 class="text-heading-1 gradient-text-primary text-center">How It Works</h2>

					<!-- Swiss Step Cards -->
					<div class="swiss-stats-card">
						<div class="swiss-cluster swiss-gap-md items-start">
							<div class="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
								1
							</div>
							<div class="swiss-flow-sm">
								<h3 class="text-heading-2 gradient-text-primary">Create Session</h3>
								<p class="text-caption text-slate-400">
									Set up your workplace assessment session with preference indicators and get a unique QR code
								</p>
							</div>
						</div>
					</div>

					<div class="swiss-stats-card">
						<div class="swiss-cluster swiss-gap-md items-start">
							<div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
								2
							</div>
							<div class="swiss-flow-sm">
								<h3 class="text-heading-2 gradient-text-primary">Share QR Code</h3>
								<p class="text-caption text-slate-400">
									Display the QR code for team members to scan and enter anonymously - no signup required
								</p>
							</div>
						</div>
					</div>

					<div class="swiss-stats-card">
						<div class="swiss-cluster swiss-gap-md items-start">
							<div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
								3
							</div>
							<div class="swiss-flow-sm">
								<h3 class="text-heading-2 gradient-text-primary">Get Real-time Workplace Insights</h3>
								<p class="text-caption text-slate-400">
									Watch preference data come in live and discover your team's workplace DNA profile with advanced analytics
								</p>
							</div>
						</div>
					</div>

					<!-- Demo QR Code -->
					<div class="swiss-stats-card swiss-center">
						<div class="w-24 h-24 bg-white rounded-lg mb-3 swiss-center">
							<div class="text-xs text-gray-600 text-center">Demo<br />QR Code</div>
						</div>
						<p class="text-sm text-slate-400">
							Try scanning this demo QR code to see how team members enter sessions
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Swiss Footer Section -->
	<footer class="swiss-container swiss-container-xl py-16">
		<div class="swiss-center">
			<div class="swiss-flow-lg swiss-center">
				<div class="swiss-flow-sm">
					<h3 class="text-heading-2 gradient-text-primary">Trusted by Teams Worldwide</h3>
					<p class="text-body text-slate-400">Simple, secure, and effective workplace preference analysis</p>
				</div>
				<div class="swiss-stats-grid max-w-4xl">
					{#each trustIndicators as indicator}
						<div class="swiss-stats-card swiss-center">
							<div class="text-3xl mb-2">{indicator.icon}</div>
							<div class="stats-number text-white">{indicator.value}</div>
							<div class="text-sm text-slate-400 font-medium">{indicator.title}</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</footer>
</div>

<style>
	/* Custom animations for the hero section */
	@keyframes float {
		0%,
		100% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(-10px);
		}
	}

	@keyframes glow {
		0%,
		100% {
			box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
		}
		50% {
			box-shadow: 0 0 30px rgba(59, 130, 246, 0.8);
		}
	}

	/* Performance optimization: reduce animations on mobile */
	@media (max-width: 768px) {
		/* Disable heavy animations on mobile for better performance */
		.floating-orbs {
			display: none;
		}

	}

	/* Accessibility: respect reduced motion preferences */
	@media (prefers-reduced-motion: reduce) {
		*,
		*::before,
		*::after {
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
			transition-duration: 0.01ms !important;
		}

		.floating-orbs {
			display: none;
		}
	}
</style>
