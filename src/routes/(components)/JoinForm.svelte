<script lang="ts">
	import type { GenerationOption, Generation } from '$lib/questions';
	import type { Session } from '$lib/server/db/schema';
	import { Button, TextInput, RadioGroup } from '$lib/components';
	import { fade, fly } from 'svelte/transition';

	// Props interface
	interface JoinFormProps {
		session: Session;
		participantName: string;
		isJoining: boolean;
		joinError: string | null;
		onJoin: (name: string, generation: GenerationOption) => Promise<void>;
		onNameInput?: () => void;
	}

	let {
		session,
		participantName = $bindable(''),
		isJoining,
		joinError,
		onJoin,
		onNameInput = () => {}
	}: JoinFormProps = $props();

	// Generation options with better UX
	const generationOptions = [
		{
			value: 'Baby Boomers',
			label: 'Baby Boomers',
			description: 'Born 1946-1964',
			icon: '🏢',
			color: 'from-blue-500 to-indigo-500'
		},
		{
			value: 'Gen X',
			label: 'Gen X',
			description: 'Born 1965-1980',
			icon: '💼',
			color: 'from-purple-500 to-indigo-500'
		},
		{
			value: 'Millennials',
			label: 'Millennials',
			description: 'Born 1981-1996',
			icon: '💻',
			color: 'from-pink-500 to-purple-500'
		},
		{
			value: 'Gen Z',
			label: 'Gen Z',
			description: 'Born 1997-2012',
			icon: '📱',
			color: 'from-cyan-500 to-blue-500'
		}
	];

	let selectedGeneration = $state('');
	let nameInputFocused = $state(false);
	let showGenerationStep = $state(false);

	// Show generation step after name is entered
	$effect(() => {
		if (participantName.trim().length >= 2) {
			showGenerationStep = true;
		} else {
			showGenerationStep = false;
			selectedGeneration = '';
		}
	});

	// Handle form submission
	async function handleJoin() {
		if (!participantName.trim() || !selectedGeneration) {
			return;
		}

		const selectedOption = generationOptions.find((opt) => opt.value === selectedGeneration);
		if (selectedOption) {
			const generation: GenerationOption = {
				id: selectedOption.value as Generation,
				label: selectedOption.label,
				description: selectedOption.description
			};
			await onJoin(participantName.trim(), generation);
		}
	}

	// Handle keyboard navigation
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && participantName.trim() && selectedGeneration) {
			handleJoin();
		}
	}
</script>

<!-- Progressive Join Form with Enhanced UX -->
<form
	onsubmit={(e) => {
		e.preventDefault();
		handleJoin();
	}}
	onkeydown={handleKeyDown}
	class="space-y-6"
>
	<!-- Error Display with gentle animation -->
	{#if joinError}
		<div
			class="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl backdrop-blur-sm"
			in:fade={{ duration: 300 }}
		>
			<div class="flex items-center gap-3">
				<div
					class="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center"
				>
					<svg class="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
				</div>
				<p class="text-amber-400 text-sm">{joinError}</p>
			</div>
		</div>
	{/if}

	<!-- Step 1: Name Input with friendly prompt -->
	<div class="space-y-3">
		<label for="participantName" class="block">
			<span class="text-sm font-medium text-slate-300">Step 1: What's your name?</span>
			<span class="text-xs text-slate-500 block mt-1">This helps personalize your experience</span>
		</label>
		<div class="relative group">
			<input
				type="text"
				id="participantName"
				bind:value={participantName}
				oninput={onNameInput}
				onfocus={() => (nameInputFocused = true)}
				onblur={() => (nameInputFocused = false)}
				placeholder="e.g., John Smith"
				required
				disabled={isJoining}
				autocomplete="name"
				class="w-full pl-12 pr-12 py-4 bg-slate-800/50 border-2 {nameInputFocused
					? 'border-purple-500/50'
					: 'border-slate-600/30'} rounded-xl text-slate-200 placeholder-slate-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all duration-200 text-lg"
			/>
			<div
				class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-colors duration-200 {nameInputFocused
					? 'text-purple-400'
					: ''}"
			>
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
					></path>
				</svg>
			</div>
			{#if participantName.trim().length >= 2}
				<div
					class="absolute right-4 top-1/2 -translate-y-1/2 text-green-400"
					in:fade={{ duration: 200 }}
				>
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
			{/if}
		</div>
	</div>

	<!-- Step 2: Generation Selection (Progressive Disclosure) -->
	{#if showGenerationStep}
		<div class="space-y-4" in:fly={{ y: 20, duration: 400, delay: 100 }}>
			<div class="block">
				<span class="text-sm font-medium text-slate-300"
					>Step 2: Which generation are you from?</span
				>
				<span class="text-xs text-slate-500 block mt-1"
					>This helps us understand workplace preferences better</span
				>
			</div>
			<div class="grid grid-cols-2 gap-3">
				{#each generationOptions as option, i}
					<button
						type="button"
						onclick={() => !isJoining && (selectedGeneration = option.value)}
						disabled={isJoining || !participantName.trim()}
						class="generation-card group relative p-4 text-center transition-all duration-300 rounded-xl border-2 transform hover:scale-105 {selectedGeneration ===
						option.value
							? 'border-purple-500 bg-gradient-to-br ' +
								option.color +
								' bg-opacity-20 shadow-lg scale-105'
							: 'border-slate-600/30 bg-slate-800/30 hover:border-purple-400/50 hover:bg-slate-700/30'}"
						in:fly={{ y: 20, duration: 400, delay: 200 + i * 50 }}
					>
						<!-- Icon -->
						<div class="text-3xl mb-2">
							{option.icon}
						</div>
						<!-- Label -->
						<h3
							class="font-semibold text-slate-200 text-sm mb-1 {selectedGeneration === option.value
								? 'text-white'
								: ''}"
						>
							{option.label}
						</h3>
						<!-- Years -->
						<p
							class="text-xs text-slate-400 {selectedGeneration === option.value
								? 'text-slate-200'
								: ''}"
						>
							{option.description}
						</p>
						<!-- Selection indicator -->
						{#if selectedGeneration === option.value}
							<div
								class="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
								in:fade={{ duration: 200 }}
							>
								<svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Action Button with Dynamic Text -->
	{#if showGenerationStep}
		<div class="pt-2" in:fly={{ y: 20, duration: 400, delay: 300 }}>
			<button
				type="submit"
				disabled={isJoining || !participantName.trim() || !selectedGeneration}
				class="w-full py-4 px-6 bg-gradient-to-r {participantName.trim() && selectedGeneration
					? 'from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
					: 'from-slate-600 to-slate-700'} text-white font-semibold rounded-xl transition-all duration-300 transform {participantName.trim() &&
				selectedGeneration
					? 'hover:scale-[1.02]'
					: ''} shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if isJoining}
					<div class="flex items-center justify-center gap-3">
						<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
						<span>Getting ready...</span>
					</div>
				{:else if participantName.trim() && selectedGeneration}
					<div class="flex items-center justify-center gap-3">
						<span>Start Assessment</span>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13 7l5 5m0 0l-5 5m5-5H6"
							></path>
						</svg>
					</div>
				{:else}
					<span>Select your generation to continue</span>
				{/if}
			</button>
		</div>
	{/if}

	<!-- Progress Steps Indicator -->
	<div class="flex items-center justify-center gap-4 mt-6">
		<div class="flex items-center gap-2">
			<div
				class="w-8 h-8 rounded-full {participantName.trim().length >= 2
					? 'bg-gradient-to-br from-purple-500 to-pink-500'
					: 'bg-slate-700'} flex items-center justify-center text-white text-xs font-bold transition-all duration-300"
			>
				{#if participantName.trim().length >= 2}
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
				{:else}
					1
				{/if}
			</div>
			<span
				class="text-xs {participantName.trim().length >= 2 ? 'text-slate-300' : 'text-slate-500'}"
				>Name</span
			>
		</div>

		<div
			class="w-8 h-0.5 {participantName.trim().length >= 2
				? 'bg-purple-500/50'
				: 'bg-slate-700'} transition-all duration-300"
		></div>

		<div class="flex items-center gap-2">
			<div
				class="w-8 h-8 rounded-full {selectedGeneration
					? 'bg-gradient-to-br from-purple-500 to-pink-500'
					: 'bg-slate-700'} flex items-center justify-center text-white text-xs font-bold transition-all duration-300"
			>
				{#if selectedGeneration}
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
				{:else}
					2
				{/if}
			</div>
			<span class="text-xs {selectedGeneration ? 'text-slate-300' : 'text-slate-500'}"
				>Generation</span
			>
		</div>
	</div>
</form>
