<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { getSessionAnalytics } from '../../../../../dashboard.remote';
	import type { Session, Participant } from '$lib/server/db/schema';
	
	let sessionSlug = $state('');
	let participantId = $state('');
	let sessionData = $state<{ session: Session; participants: Participant[]; analytics: any } | null>(null);
	let showConfetti = $state(false);
	
	// Initialize params and load data on mount
	onMount(async () => {
		const pageData = get(page);
		sessionSlug = pageData.params.slug;
		participantId = pageData.params.id;
		
		// Validate slug before loading session
		if (sessionSlug && sessionSlug.trim() !== '') {
			await fetchSession();
		}
		
		// Show confetti after a short delay
		setTimeout(() => {
			showConfetti = true;
		}, 500);
	});
	
	// Fetch session data using remote function
	async function fetchSession() {
		// Additional validation before API call
		if (!sessionSlug || sessionSlug.trim() === '') {
			console.error('Cannot fetch session with empty slug');
			return;
		}
		
		try {
			sessionData = await getSessionAnalytics(sessionSlug);
		} catch (error) {
			if (import.meta.env.DEV) {
				console.error('Failed to fetch session:', error);
			}
		}
	}
	
	// Get participant data with scores - simpler derived without .by()
	let participant = $derived(
		sessionData?.participants?.find((p: any) => p.id === participantId) ||
		sessionData?.attendees?.find((p: any) => p.id === participantId) ||
		null
	);
	
	let scores = $derived(
		participant?.preferenceScores || {
			collaboration: 0,
			formality: 0,
			tech: 0,
			wellness: 0
		}
	);
	
	// Generate workplace DNA - simpler logic
	let workplaceDNA = $derived((() => {
		const profiles = [];
		if (scores.collaboration >= 7) profiles.push('Collaborative');
		if (scores.formality >= 7) profiles.push('Structured');
		if (scores.tech >= 7) profiles.push('Digital-First');
		if (scores.wellness >= 7) profiles.push('Wellness-Focused');
		return profiles.length > 0 ? profiles.join(' & ') : 'Balanced';
	})());
	
	// Create confetti effect when showConfetti changes
	$effect(() => {
		if (showConfetti) {
			const colors = ['#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8'];
			for (let i = 0; i < 50; i++) {
				setTimeout(() => {
					const confetti = document.createElement('div');
					confetti.className = 'confetti';
					confetti.style.left = Math.random() * 100 + '%';
					confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
					confetti.style.animationDelay = Math.random() * 2 + 's';
					document.body.appendChild(confetti);
					setTimeout(() => confetti.remove(), 4000);
				}, i * 50);
			}
		}
	});
	
</script>

<style>
	:global(.confetti) {
		position: fixed;
		width: 10px;
		height: 10px;
		top: -10px;
		z-index: 9999;
		animation: fall 4s linear;
	}
	
	@keyframes fall {
		to {
			transform: translateY(100vh) rotate(360deg);
		}
	}
</style>

<div class="min-h-screen animated-gradient flex items-center justify-center px-4">
	<div class="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
		<div class="text-center mb-8">
			<div class="text-6xl mb-4">🎉</div>
			<h1 class="text-3xl font-bold text-gray-800 mb-2">Quiz Complete!</h1>
			<p class="text-gray-600">Thank you for participating!</p>
		</div>
		
		<div class="bg-gray-50 rounded-lg p-6 mb-6">
			<h2 class="text-xl font-semibold text-gray-800 mb-3">Your Workplace DNA</h2>
			<p class="text-2xl font-bold text-gray-700">{workplaceDNA}</p>
		</div>
		
		<div class="grid grid-cols-2 gap-4 mb-6">
			<div class="bg-gray-50 rounded p-4">
				<p class="text-sm text-gray-600 mb-1">Collaboration</p>
				<div class="flex items-center">
					<div class="w-full bg-gray-200 rounded-full h-2 mr-2">
						<div class="bg-gray-600 h-2 rounded-full" style="width: {scores.collaboration * 10}%"></div>
					</div>
					<span class="text-sm font-semibold">{scores.collaboration}/10</span>
				</div>
			</div>
			
			<div class="bg-gray-50 rounded p-4">
				<p class="text-sm text-gray-600 mb-1">Formality</p>
				<div class="flex items-center">
					<div class="w-full bg-gray-200 rounded-full h-2 mr-2">
						<div class="bg-gray-600 h-2 rounded-full" style="width: {scores.formality * 10}%"></div>
					</div>
					<span class="text-sm font-semibold">{scores.formality}/10</span>
				</div>
			</div>
			
			<div class="bg-gray-50 rounded p-4">
				<p class="text-sm text-gray-600 mb-1">Technology</p>
				<div class="flex items-center">
					<div class="w-full bg-gray-200 rounded-full h-2 mr-2">
						<div class="bg-gray-600 h-2 rounded-full" style="width: {scores.tech * 10}%"></div>
					</div>
					<span class="text-sm font-semibold">{scores.tech}/10</span>
				</div>
			</div>
			
			<div class="bg-gray-50 rounded p-4">
				<p class="text-sm text-gray-600 mb-1">Wellness</p>
				<div class="flex items-center">
					<div class="w-full bg-gray-200 rounded-full h-2 mr-2">
						<div class="bg-gray-600 h-2 rounded-full" style="width: {scores.wellness * 10}%"></div>
					</div>
					<span class="text-sm font-semibold">{scores.wellness}/10</span>
				</div>
			</div>
		</div>
		
		<div class="text-center">
			<p class="text-gray-600 text-sm">
				Your responses have been successfully recorded and will help shape our future workplace.
			</p>
		</div>
	</div>
</div>