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
	}: {
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
	} = $props();

	const colors = {
		gray: 'text-gray-700 border-gray-200 hover:border-gray-400 data-[selected]:border-gray-600 data-[selected]:bg-gray-50 bg-gray-600',
		blue: 'text-blue-700 border-blue-200 hover:border-blue-400 data-[selected]:border-blue-600 data-[selected]:bg-blue-50 bg-blue-600',
		green: 'text-green-700 border-green-200 hover:border-green-400 data-[selected]:border-green-600 data-[selected]:bg-green-50 bg-green-600'
	}[colorScheme].split(' ');

	const [textColor, borderColor, hoverColor, selectedBorder, selectedBg, progressColor] = colors;
	const padding = { default: 'p-4', compact: 'p-3', card: 'p-6' }[variant];
</script>

<div class="w-full">
	{#if questionNumber && totalQuestions}
		<div class="mb-4">
			<div class="flex justify-between text-sm text-gray-600 mb-2">
				<span>Question {questionNumber} of {totalQuestions}</span>
				{#if progress}<span>{Math.round(progress)}% Complete</span>{/if}
			</div>
			{#if progress}
				<div class="w-full bg-gray-200 rounded-full h-2">
					<div class="{progressColor} h-2 rounded-full transition-all duration-300" style="width: {progress}%"></div>
				</div>
			{/if}
		</div>
	{/if}
	
	<div class="mb-6">
		<h2 class="text-2xl font-bold {textColor}">{title}</h2>
		{#if subtitle}<p class="text-gray-600 mt-2">{subtitle}</p>{/if}
	</div>
	
	<div class="space-y-3">
		{#each options as option (option.id)}
			{@const isSelected = selectedId === option.id}
			<button
				onclick={() => !disabled && onSelect(option.id)}
				{disabled}
				data-selected={isSelected || undefined}
				class="w-full text-left border-2 rounded-lg transition {padding} {borderColor} {hoverColor} 
					   {isSelected ? `${selectedBorder} ${selectedBg}` : 'hover:bg-gray-50'}
					   {disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}"
			>
				<div class="flex items-start gap-3">
					{#if option.icon}<span class="text-2xl flex-shrink-0">{option.icon}</span>{/if}
					<div class="flex-1 text-left">
						<div class="font-semibold {textColor}">{option.label}</div>
						{#if option.description}<div class="text-sm text-gray-500 mt-1">{option.description}</div>{/if}
						{#if import.meta.env.DEV && option.values}
							<div class="text-xs text-gray-400 mt-2 font-mono">
								C:{option.values.collaboration || 0} F:{option.values.formality || 0} T:{option.values.tech || 0} W:{option.values.wellness || 0}
							</div>
						{/if}
					</div>
					{#if variant === 'card'}
						<div class="flex-shrink-0">
							{#if isSelected}
								<svg class="w-6 h-6 {textColor}" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
								</svg>
							{:else}
								<div class="w-6 h-6 border-2 {borderColor} rounded-full"></div>
							{/if}
						</div>
					{/if}
				</div>
			</button>
		{/each}
	</div>
	
	{#if disabled}<div class="mt-4 text-center text-sm text-gray-600">Saving your response...</div>{/if}
</div>