<!--
	QuestionCard.svelte
	Reusable question card component for quiz interfaces
-->

<script lang="ts">
	interface Option {
		id: string;
		label: string;
		description?: string;
		icon?: string;
		values?: {
			collaboration?: number;
			formality?: number;
			tech?: number;
			wellness?: number;
		};
	}
	
	interface Props {
		title: string;
		subtitle?: string;
		options: Option[];
		selectedId?: string;
		onSelect: (optionId: string) => void;
		disabled?: boolean;
		questionNumber?: number;
		totalQuestions?: number;
		progress?: number;
		variant?: 'default' | 'compact' | 'card';
		colorScheme?: 'gray' | 'blue' | 'green';
	}
	
	let { 
		title,
		subtitle,
		options,
		selectedId,
		onSelect,
		disabled = false,
		questionNumber,
		totalQuestions,
		progress,
		variant = 'default',
		colorScheme = 'gray'
	}: Props = $props();
	
	const colorClasses = {
		gray: {
			border: 'border-gray-200',
			borderHover: 'hover:border-gray-400',
			borderSelected: 'border-gray-600',
			bg: 'bg-gray-50',
			text: 'text-gray-700'
		},
		blue: {
			border: 'border-blue-200',
			borderHover: 'hover:border-blue-400',
			borderSelected: 'border-blue-600',
			bg: 'bg-blue-50',
			text: 'text-blue-700'
		},
		green: {
			border: 'border-green-200',
			borderHover: 'hover:border-green-400',
			borderSelected: 'border-green-600',
			bg: 'bg-green-50',
			text: 'text-green-700'
		}
	};
	
	const colors = colorClasses[colorScheme];
	
	function getOptionClasses(optionId: string) {
		const isSelected = selectedId === optionId;
		const baseClasses = 'w-full text-left border-2 rounded-lg transition';
		const stateClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
		const borderClasses = isSelected 
			? `${colors.borderSelected} ${colors.bg}` 
			: `${colors.border} ${colors.borderHover} hover:bg-gray-50`;
		
		const sizeClasses = {
			default: 'p-4',
			compact: 'p-3',
			card: 'p-6'
		}[variant];
		
		return `${baseClasses} ${stateClasses} ${borderClasses} ${sizeClasses}`;
	}
</script>

<div class="w-full">
	<!-- Progress Header -->
	{#if questionNumber !== undefined && totalQuestions !== undefined}
		<div class="mb-4">
			<div class="flex justify-between text-sm text-gray-600 mb-2">
				<span>Question {questionNumber} of {totalQuestions}</span>
				{#if progress !== undefined}
					<span>{Math.round(progress)}% Complete</span>
				{/if}
			</div>
			{#if progress !== undefined}
				<div class="w-full bg-gray-200 rounded-full h-2">
					<div 
						class="bg-{colorScheme}-600 h-2 rounded-full transition-all duration-300"
						style="width: {progress}%"
					></div>
				</div>
			{/if}
		</div>
	{/if}
	
	<!-- Question Title -->
	<div class="mb-6">
		<h2 class="text-2xl font-bold {colors.text}">{title}</h2>
		{#if subtitle}
			<p class="text-gray-600 mt-2">{subtitle}</p>
		{/if}
	</div>
	
	<!-- Options -->
	<div class="space-y-3">
		{#each options as option (option.id)}
			<button
				onclick={() => !disabled && onSelect(option.id)}
				{disabled}
				class={getOptionClasses(option.id)}
			>
				<div class="flex items-start gap-3">
					{#if option.icon}
						<span class="text-2xl flex-shrink-0">{option.icon}</span>
					{/if}
					<div class="flex-1 text-left">
						<div class="font-semibold {colors.text}">{option.label}</div>
						{#if option.description}
							<div class="text-sm text-gray-500 mt-1">{option.description}</div>
						{/if}
						
						<!-- Show values in development mode -->
						{#if import.meta.env.DEV && option.values}
							<div class="text-xs text-gray-400 mt-2 font-mono">
								C:{option.values.collaboration || 0} 
								F:{option.values.formality || 0} 
								T:{option.values.tech || 0} 
								W:{option.values.wellness || 0}
							</div>
						{/if}
					</div>
					
					<!-- Selection Indicator -->
					{#if variant === 'card'}
						<div class="flex-shrink-0">
							{#if selectedId === option.id}
								<svg class="w-6 h-6 text-{colorScheme}-600" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
								</svg>
							{:else}
								<div class="w-6 h-6 border-2 {colors.border} rounded-full"></div>
							{/if}
						</div>
					{/if}
				</div>
			</button>
		{/each}
	</div>
	
	<!-- Loading State -->
	{#if disabled}
		<div class="mt-4 text-center text-sm text-gray-600">
			Saving your response...
		</div>
	{/if}
</div>