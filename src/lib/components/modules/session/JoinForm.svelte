<script lang="ts">
	import { Card, Button, TextInput, Select } from '$lib/components';
	interface GenerationOption {
		id: string;
		label: string;
	}
	import { questions } from '$lib/questions';

	interface JoinFormProps {
		session?: { code: string; name?: string };
		participantName?: string;
		isJoining?: boolean;
		joinError?: string;
		onJoin?: (name: string, generation: GenerationOption) => Promise<void>;
	}

	let {
		session,
		participantName = $bindable(''),
		isJoining = false,
		joinError,
		onJoin
	}: JoinFormProps = $props();

	let selectedGeneration = $state<GenerationOption | null>(null);
	let isSubmitting = $state(false);

	// Get unique generation options from questions
	const generationOptions = $derived(() => {
		const gens = new Set<string>();
		questions.forEach((q) => {
			// Look for any question that might have generation options
			if (q.options) {
				q.options.forEach((opt) => {
					const label = opt.label.toLowerCase();
					if (
						label.includes('generation') ||
						label.includes('gen z') ||
						label.includes('millennial') ||
						label.includes('gen x') ||
						label.includes('baby boomer') ||
						label.includes('boomer')
					) {
						gens.add(opt.label);
					}
				});
			}
		});

		// Fallback options if none found
		if (gens.size === 0) {
			return [
				{ value: 'gen_z', label: 'Gen Z' },
				{ value: 'millennial', label: 'Millennial' },
				{ value: 'gen_x', label: 'Gen X' },
				{ value: 'baby_boomer', label: 'Baby Boomer' }
			];
		}

		return Array.from(gens).map((gen) => ({
			value: gen.toLowerCase().replace(/\s+/g, '_'),
			label: gen
		}));
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();

		if (!participantName.trim() || !selectedGeneration || !onJoin) {
			return;
		}

		isSubmitting = true;
		try {
			await onJoin(participantName.trim(), selectedGeneration);
		} catch (err) {
			console.error('Join failed:', err);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Card variant="default" class="mx-auto max-w-md">
	{#snippet children()}
		<div class="p-6">
			<div class="mb-6 text-center">
				<h2 class="mb-2 text-2xl font-bold text-slate-200">Join the Session</h2>
				{#if session?.name}
					<p class="text-slate-400">{session.name}</p>
				{/if}
				{#if session?.code}
					<p class="mt-1 text-sm text-slate-500">Session: {session.code}</p>
				{/if}
			</div>

			{#if joinError}
				<div class="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
					<p class="text-sm text-red-400">{joinError}</p>
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="space-y-4">
				<TextInput
					label="Your Name"
					placeholder="Enter your full name"
					bind:value={participantName}
					required
					disabled={isJoining || isSubmitting}
				/>

				<Select
					label="Generation"
					placeholder="Select your generation"
					options={generationOptions()}
					value={selectedGeneration?.id || ''}
					onValueChange={(value) => {
						const option = generationOptions().find((opt) => opt.value === value);
						selectedGeneration = option ? { id: option.value, label: option.label } : null;
					}}
					required
					disabled={isJoining || isSubmitting}
				/>

				<Button
					type="submit"
					disabled={!participantName.trim() || !selectedGeneration || isJoining || isSubmitting}
					class="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
				>
					{#if isSubmitting}
						<div class="flex items-center gap-2">
							<div
								class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
							></div>
							Joining...
						</div>
					{:else}
						Join Session
					{/if}
				</Button>
			</form>

			{#if isJoining && !isSubmitting}
				<div class="mt-4 text-center">
					<div class="inline-flex items-center gap-2 text-slate-400">
						<div
							class="h-4 w-4 animate-spin rounded-full border-2 border-slate-400/30 border-t-slate-400"
						></div>
						Loading session...
					</div>
				</div>
			{/if}
		</div>
	{/snippet}
</Card>
