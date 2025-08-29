<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { Button, Card, StatsCard } from '$lib/components';
	import { SecurityIcon, AnalyticsIcon, MobileIcon, WorkplaceDNAIcon } from '$lib/components/icons';

	// State management
	let isLoaded = $state(false);
	let currentFeature = $state(0);

	// Features data with SVG components
	const features = [
		{
			IconComponent: SecurityIcon,
			title: 'Secure Authentication',
			description: 'Enterprise-grade security with role-based access control'
		},
		{
			IconComponent: AnalyticsIcon,
			title: 'Real-time Analytics',
			description: 'Live dashboard with instant insights and data visualization'
		},
		{
			IconComponent: MobileIcon,
			title: 'Mobile Optimized',
			description: 'Seamless experience across all devices and screen sizes'
		},
		{
			IconComponent: WorkplaceDNAIcon,
			title: 'Workplace DNA',
			description: 'Advanced profiling system for workplace preferences'
		}
	];

	// Stats data
	const stats = [
		{ title: 'Active Sessions', value: '150+', icon: '📈' },
		{ title: 'Participants', value: '2.5K+', icon: '👥' },
		{ title: 'Insights Generated', value: '10K+', icon: '💡' },
		{ title: 'Success Rate', value: '98%', icon: '✅' }
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

		// Auto-rotate features
		const interval = setInterval(() => {
			currentFeature = (currentFeature + 1) % features.length;
		}, 3000);

		return () => clearInterval(interval);
	});
</script>

<!-- Floating Orbs Background -->
<div class="floating-orbs">
	<div class="orb orb-1"></div>
	<div class="orb orb-2"></div>
	<div class="orb orb-3"></div>
	<div class="orb orb-4"></div>
</div>

<!-- Hero Section -->
<div class="min-h-screen relative flex flex-col">
		<!-- Header -->
		<header class="flex justify-between items-center card-spacing">
			<div class="flex items-center space-h-compact">
				<div class="w-12 h-12 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-xl flex items-center justify-center shadow-2xl card-hover-lift">
					<span class="text-display font-black text-white">Z</span>
				</div>
				<div>
					<h1 class="text-heading-4 font-bold text-white">Zyeta<span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">DX</span></h1>
					<p class="text-micro text-slate-400">Workplace Experience Platform</p>
				</div>
			</div>
			<Button
				onclick={enterDashboard}
				variant="secondary"
				class="bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 text-white hover:from-slate-800/90 hover:to-slate-700/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:shadow-cyan-500/25 btn-micro-lift"
			>
				Sign In
			</Button>
		</header>

		<!-- Hero Content -->
		<main class="flex-1 flex items-center justify-center card-spacing">
			<div class="max-w-7xl w-full">
				<div class="grid lg:grid-cols-2 gap-16 items-center">
					<!-- Left Column - Main Content -->
					<div class="text-center lg:text-left section-spacing">
						<div class="content-spacing">
							<h1 class="text-display text-white leading-none mb-6">
								Transform Your
								<span class="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-hover-gradient">
									Workplace Insights
								</span>
							</h1>
							<p class="text-body-lg text-slate-300 max-w-2xl mx-auto lg:mx-0">
								Discover your team's workplace DNA with our interactive analysis platform.
								Real-time engagement, advanced analytics, and actionable insights.
							</p>
						</div>

						<!-- CTA Buttons -->
						<div class="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
							<Button
								onclick={enterDashboard}
								size="lg"
								class="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:shadow-cyan-500/25 btn-micro-lift shimmer"
							>
								Get Started
							</Button>
							<Button
								variant="secondary"
								size="lg"
								class="bg-gradient-to-r from-slate-900/60 to-slate-800/60 backdrop-blur-xl border border-slate-700/40 text-slate-200 hover:from-slate-800/70 hover:to-slate-700/70 hover:text-white shadow-lg hover:shadow-xl transition-all duration-300 card-hover-glow"
							>
								Learn More
							</Button>
						</div>

						<!-- Trust Indicators -->
						<div class="flex items-center justify-center lg:justify-start space-x-6 text-sm text-slate-400">
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

					<!-- Right Column - Feature Showcase -->
					<div class="relative">
						<!-- Main Feature Card -->
						<Card
							variant="elevated"
							size="lg"
							class="bg-gradient-to-br from-slate-900/40 to-slate-800/40 backdrop-blur-2xl border border-slate-700/30 shadow-2xl transform hover:scale-105 transition-all duration-500 hover:shadow-cyan-500/10 card-hover-glow pulse-glow"
						>
							{#snippet children()}
								<div class="text-center content-spacing">
									<!-- Feature Icon with SVG Component -->
									<div class="w-32 h-32 bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto shadow-2xl border border-slate-700/30 group hover:scale-110 transition-all duration-500 card-hover-lift">
										{#if currentFeature === 0}
											<SecurityIcon
												size="lg"
												gradient={true}
												class="transform group-hover:scale-110 transition-transform duration-500 icon-hover-rotate"
											/>
										{:else if currentFeature === 1}
											<AnalyticsIcon
												size="lg"
												gradient={true}
												class="transform group-hover:scale-110 transition-transform duration-500 icon-hover-bounce"
											/>
										{:else if currentFeature === 2}
											<MobileIcon
												size="lg"
												gradient={true}
												class="transform group-hover:scale-110 transition-transform duration-500 icon-hover-rotate"
											/>
										{:else if currentFeature === 3}
											<WorkplaceDNAIcon
												size="2xl"
												gradient={true}
												class="transform group-hover:scale-110 transition-transform duration-500 icon-hover-bounce"
											/>
										{/if}
									</div>

									<!-- Feature Content -->
									<div class="content-spacing">
										<h3 class="text-heading-3 text-white text-hover-gradient">
											{features[currentFeature].title}
										</h3>
										<p class="text-body text-slate-300 leading-relaxed">
											{features[currentFeature].description}
										</p>
									</div>

									<!-- Feature Indicators -->
									<div class="flex justify-center space-h-compact">
										{#each features as _, index}
											<button
												class="w-3 h-3 rounded-full transition-all duration-300 btn-micro-lift {index === currentFeature ? 'bg-white scale-125 shadow-lg' : 'bg-white/40 hover:bg-white/60'}"
												onclick={() => currentFeature = index}
												aria-label={`View feature ${index + 1}`}
											></button>
										{/each}
									</div>
								</div>
							{/snippet}
						</Card>

						<!-- Floating Stats Cards -->
						<div class="absolute -top-6 -left-6 hidden lg:block">
							<div class="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-lg p-4 shadow-2xl border border-slate-700/40 hover:shadow-cyan-500/10 transition-all duration-300">
								<div class="flex items-center space-x-3">
									<span class="text-2xl">{stats[0].icon}</span>
									<div>
										<p class="text-sm text-slate-400">{stats[0].title}</p>
										<p class="text-lg font-bold text-white">{stats[0].value}</p>
									</div>
								</div>
							</div>
						</div>

						<div class="absolute -bottom-6 -right-6 hidden lg:block">
							<div class="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-lg p-4 shadow-2xl border border-slate-700/40 hover:shadow-purple-500/10 transition-all duration-300">
								<div class="flex items-center space-x-3">
									<span class="text-2xl">{stats[1].icon}</span>
									<div>
										<p class="text-sm text-slate-400">{stats[1].title}</p>
										<p class="text-lg font-bold text-white">{stats[1].value}</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>

		<!-- Footer Stats -->
		<footer class="p-6 lg:p-8">
			<div class="max-w-6xl mx-auto">
				<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
					{#each stats as stat}
						<div class="text-center bg-gradient-to-br from-slate-900/60 to-slate-800/60 backdrop-blur-xl rounded-lg p-4 border border-slate-700/30 hover:border-slate-600/40 transition-all duration-300">
							<div class="text-2xl mb-1">{stat.icon}</div>
							<div class="text-lg font-bold text-white">{stat.value}</div>
							<div class="text-sm text-slate-400">{stat.title}</div>
						</div>
					{/each}
				</div>
			</div>
		</footer>
</div>

<style>
	/* Custom animations for the hero section */
	@keyframes float {
		0%, 100% { transform: translateY(0px); }
		50% { transform: translateY(-10px); }
	}

	@keyframes glow {
		0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
		50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.8); }
	}
</style>
