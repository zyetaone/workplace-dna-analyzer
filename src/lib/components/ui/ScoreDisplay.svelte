<!-- Simplified Score Display Component -->
<script lang="ts">
	interface PreferenceScores {
		collaboration: number;
		formality: number;
		tech: number;
		wellness: number;
	}

	interface Props {
		scores: PreferenceScores;
		maxScore?: number;
		variant?: 'bars' | 'cards';
		animated?: boolean;
		showLabels?: boolean;
		showValues?: boolean;
		showProgress?: boolean;
	}

	let {
		scores,
		maxScore = 10,
		variant = 'cards',
		animated = true,
		showLabels = true,
		showValues = true,
		showProgress = true
	}: Props = $props();

	const scoreConfig = {
		collaboration: { label: 'Collaboration', icon: '👥', color: 'blue' },
		formality: { label: 'Formality', icon: '📋', color: 'purple' },
		tech: { label: 'Technology', icon: '💻', color: 'green' },
		wellness: { label: 'Wellness', icon: '🌱', color: 'teal' }
	};

	const colorClasses = {
		blue: 'bg-blue-50 text-blue-700 border-blue-200',
		purple: 'bg-purple-50 text-purple-700 border-purple-200', 
		green: 'bg-green-50 text-green-700 border-green-200',
		teal: 'bg-teal-50 text-teal-700 border-teal-200'
	};

	const progressClasses = {
		blue: 'bg-blue-500',
		purple: 'bg-purple-500',
		green: 'bg-green-500',
		teal: 'bg-teal-500'
	};
</script>

{#if variant === 'cards'}
	<div class="grid grid-cols-2 gap-4">
		{#each Object.entries(scores) as [key, value]}
			{@const config = scoreConfig[key as keyof PreferenceScores]}
			{@const percentage = (value / maxScore) * 100}
			<div class="p-4 rounded-lg border {colorClasses[config.color as keyof typeof colorClasses]} {animated ? '[transition:var(--transition-smooth)]' : ''}">
				<div class="flex items-center gap-2 mb-2">
					<span class="text-2xl">{config.icon}</span>
					{#if showLabels}
						<span class="font-medium text-sm">{config.label}</span>
					{/if}
				</div>
				{#if showValues}
					<div class="text-2xl font-bold mb-2">{value}/{maxScore}</div>
				{/if}
				{#if showProgress}
					<div class="w-full bg-gray-200 rounded-full h-2">
						<div class="{progressClasses[config.color as keyof typeof progressClasses]} h-2 rounded-full {animated ? '[transition:var(--transition-bounce)] delay-300' : ''}" 
							style="width: {percentage}%"></div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
{:else}
	<!-- Simple bars variant -->
	<div class="space-y-4">
		{#each Object.entries(scores) as [key, value]}
			{@const config = scoreConfig[key as keyof PreferenceScores]}
			{@const percentage = (value / maxScore) * 100}
			<div class="flex items-center gap-4">
				<span class="text-lg">{config.icon}</span>
				{#if showLabels}
					<span class="w-24 text-sm font-medium">{config.label}</span>
				{/if}
				<div class="flex-1 bg-gray-200 rounded-full h-3">
					<div class="{progressClasses[config.color as keyof typeof progressClasses]} h-3 rounded-full {animated ? '[transition:var(--transition-bounce)]' : ''}" 
						style="width: {percentage}%"></div>
				</div>
				{#if showValues}
					<span class="text-sm font-mono w-12">{value}/{maxScore}</span>
				{/if}
			</div>
		{/each}
	</div>
{/if}