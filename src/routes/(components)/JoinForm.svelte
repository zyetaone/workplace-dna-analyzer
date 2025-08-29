<script lang="ts">
	import type { GenerationOption, Generation } from '$lib/questions';
	import type { Session } from '$lib/types';
	import { Button, TextInput, RadioGroup } from '$lib/components';
	
	// Props interface
	interface JoinFormProps {
		session: Session;
		participantName: string;
		isJoining: boolean;
		joinError: string | null;
		onJoin: (name: string, generation: GenerationOption) => Promise<void>;
	}
	
	let { 
		session, 
		participantName = $bindable(''), 
		isJoining, 
		joinError, 
		onJoin 
	}: JoinFormProps = $props();
	
	// Generation options for RadioGroup
	const generationOptions = [
		{ value: 'Baby Boomers', label: '👔 Baby Boomers', description: '1946-1964' },
		{ value: 'Gen X', label: '💼 Gen X', description: '1965-1980' },
		{ value: 'Millennials', label: '💻 Millennials', description: '1981-1996' },
		{ value: 'Gen Z', label: '📱 Gen Z', description: '1997-2012' }
	];
	
	let selectedGeneration = $state('');
	
	// Handle form submission
	async function handleJoin() {
		if (!participantName.trim() || !selectedGeneration) {
			return;
		}
		
		const selectedOption = generationOptions.find(opt => opt.value === selectedGeneration);
		if (selectedOption) {
			const generation: GenerationOption = {
				id: selectedOption.value as Generation,
				label: selectedOption.label,
				description: selectedOption.description
			};
			await onJoin(participantName.trim(), generation);
		}
	}
</script>

<!-- Enhanced Join Form with Better UX -->
<div class="space-y-8">
	<!-- Header Section -->
	<div class="text-center mb-8">
		<div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
			<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
			</svg>
		</div>
		<h1 class="text-3xl font-bold gradient-text mb-2">Join Workplace Quiz</h1>
		<p class="text-slate-400">Session: <span class="font-semibold text-slate-200">{session.name}</span></p>
	</div>

	<!-- Error Display -->
	{#if joinError}
		<div class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl backdrop-blur-sm">
			<div class="flex items-center gap-3">
				<div class="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
					<svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
					</svg>
				</div>
				<p class="text-red-400 text-sm">{joinError}</p>
			</div>
		</div>
	{/if}

	<!-- Name Input Section -->
	<div class="space-y-3">
		<label for="participantName" class="block text-sm font-medium text-slate-300">
			Your Name
		</label>
		<div class="relative">
			<TextInput
				id="participantName"
				bind:value={participantName}
				placeholder="Enter your full name"
				required
				disabled={isJoining}
				class="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-slate-200 placeholder-slate-400 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200"
			/>
			<div class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400">
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
				</svg>
			</div>
		</div>
	</div>

	<!-- Generation Selection -->
	<div class="space-y-4">
		<label class="block text-sm font-medium text-slate-300">
			Select Your Generation
		</label>
		<div class="grid grid-cols-1 gap-3">
			{#each generationOptions as option}
				<button
					type="button"
					onclick={() => !isJoining && (selectedGeneration = option.value)}
					disabled={isJoining}
					class="generation-option-card group relative w-full p-4 text-left transition-all duration-300 rounded-xl border-2 {selectedGeneration === option.value
						? 'border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-500/20'
						: 'border-slate-600/50 bg-slate-800/30 hover:border-purple-400/30 hover:bg-slate-700/30'}"
				>
					<div class="flex items-center gap-4">
						<div class="flex-shrink-0 text-2xl">
							{option.label.split(' ')[0]}
						</div>
						<div class="flex-1">
							<h3 class="font-semibold text-slate-200 group-hover:text-purple-200 transition-colors">
								{option.label.split(' ').slice(1).join(' ')}
							</h3>
							<p class="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
								{option.description}
							</p>
						</div>
						<div class="flex-shrink-0 w-5 h-5 rounded-full border-2 {selectedGeneration === option.value
							? 'border-purple-400 bg-gradient-to-br from-purple-500 to-pink-500'
							: 'border-slate-500'} flex items-center justify-center">
							{#if selectedGeneration === option.value}
								<svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
								</svg>
							{/if}
						</div>
					</div>
				</button>
			{/each}
		</div>
	</div>

	<!-- Action Button -->
	<div class="pt-4">
		<Button
			onclick={handleJoin}
			disabled={isJoining || !participantName.trim() || !selectedGeneration}
			loading={isJoining}
			size="lg"
			class="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:transform-none shadow-lg hover:shadow-xl"
		>
			{#if isJoining}
				<div class="flex items-center gap-3">
					<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
					<span>Joining Session...</span>
				</div>
			{:else}
				<div class="flex items-center gap-3">
					<span>🚀 Start Your Quiz</span>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
					</svg>
				</div>
			{/if}
		</Button>
	</div>

	<!-- Progress Indicator -->
	{#if isJoining}
		<div class="mt-6">
			<div class="flex items-center justify-center gap-2 text-sm text-slate-400">
				<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
				<span>Preparing your personalized quiz experience...</span>
			</div>
		</div>
	{/if}
</div>