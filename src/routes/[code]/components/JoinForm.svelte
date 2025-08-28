<script lang="ts">
	import type { GenerationOption } from '$lib/questions';
	import type { Session } from '$lib/types';
	import { Button } from '$lib/components';
	
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
	
	// Generation options with icons
	const generationOptions = [
		{ id: 'Baby Boomers', label: 'Baby Boomers', emoji: '👔', years: '1946-1964', color: 'from-blue-500 to-blue-600' },
		{ id: 'Gen X', label: 'Gen X', emoji: '💼', years: '1965-1980', color: 'from-purple-500 to-purple-600' },
		{ id: 'Millennials', label: 'Millennials', emoji: '💻', years: '1981-1996', color: 'from-green-500 to-green-600' },
		{ id: 'Gen Z', label: 'Gen Z', emoji: '📱', years: '1997-2012', color: 'from-pink-500 to-pink-600' }
	];
	
	let selectedGeneration = $state<GenerationOption | ''>('');
	
	// Handle form submission
	async function handleJoin() {
		if (!participantName.trim() || !selectedGeneration) {
			return;
		}
		
		await onJoin(participantName.trim(), selectedGeneration as GenerationOption);
	}
</script>

<!-- Join form -->
{#if joinError}
	<div class="mb-4 p-4 bg-red-100 text-red-700 rounded">
		{joinError}
	</div>
{/if}

<h1 class="text-3xl font-bold text-gray-800 mb-2">Join Session</h1>
<p class="text-gray-600 mb-6">Session: {session.name}</p>

<div class="space-y-6">
	<div class="mb-6">
		<label for="participantName" class="block text-sm font-medium text-gray-700 mb-2">
			Your Name
			<span class="text-red-500" aria-label="required">*</span>
		</label>
		<input
			id="participantName"
			bind:value={participantName}
			placeholder="Enter your name"
			required
			disabled={isJoining}
			class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
		/>
	</div>
	
	<!-- Generation Selection with Icons -->
	<fieldset>
		<legend class="block text-sm font-medium text-gray-700 mb-3">
			Select Your Generation
		</legend>
		<div class="grid grid-cols-2 gap-3">
			{#each generationOptions as gen}
				<button
					type="button"
					onclick={() => selectedGeneration = gen.id as GenerationOption}
					disabled={isJoining}
					class="relative p-4 rounded-lg border-2 transition-all cursor-pointer
						{selectedGeneration === gen.id 
							? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-offset-2' 
							: 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
						{isJoining ? 'opacity-50 cursor-not-allowed' : ''}"
				>
					<div class="text-center">
						<div class="text-3xl mb-2">{gen.emoji}</div>
						<div class="font-semibold text-gray-800">{gen.label}</div>
						<div class="text-xs text-gray-500 mt-1">{gen.years}</div>
					</div>
					{#if selectedGeneration === gen.id}
						<div class="absolute top-2 right-2">
							<svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
							</svg>
						</div>
					{/if}
				</button>
			{/each}
		</div>
	</fieldset>
	
	<Button
		onclick={handleJoin}
		disabled={isJoining || !participantName.trim() || !selectedGeneration}
		loading={isJoining}
		variant="default"
		size="lg"
		class="w-full"
	>
		{isJoining ? 'Joining...' : 'Start Quiz'}
	</Button>
</div>