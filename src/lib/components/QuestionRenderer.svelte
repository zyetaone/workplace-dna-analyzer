<!--
  QuestionRenderer - Simplified question rendering component
  Works with the new Quiz component API
-->
<script lang="ts">
	import type { QuizQuestionComponent } from '$lib/types';

	interface Props {
		question: QuizQuestionComponent;
		value?: any;
		onAnswer: (answer: any) => void;
		disabled?: boolean;
	}

	let { question, value, onAnswer, disabled }: Props = $props();

	// Local state for form inputs
	let textValue = $state(value || '');
	let selectedValue = $state(value || null);
	let selectedValues = $state(Array.isArray(value) ? value : []);

	// Update local state when value prop changes
	$effect(() => {
		if (question.type === 'text') {
			textValue = value || '';
		} else if (question.type === 'multiselect') {
			selectedValues = Array.isArray(value) ? value : [];
		} else {
			selectedValue = value || null;
		}
	});

	// Handle option selection
	function handleOptionSelect(optionValue: string | number) {
		selectedValue = optionValue;
		onAnswer(optionValue);
	}

	// Handle checkbox selection
	function handleCheckboxChange(optionValue: string | number, checked: boolean) {
		if (checked) {
			selectedValues = [...selectedValues, optionValue];
		} else {
			selectedValues = selectedValues.filter((v) => v !== optionValue);
		}
		onAnswer(selectedValues);
	}

	// Handle text input
	function handleTextInput() {
		onAnswer(textValue);
	}

	// Get display options
	let displayOptions = $derived(() => {
		if (!question.options) return [];

		return question.options.map((option) => ({
			value: option.value,
			label: option.emoji ? `${option.emoji} ${option.label}` : option.label,
			description: option.description
		}));
	});
</script>

<div class="w-full">
	<!-- Question Header -->
	<div class="flex flex-col gap-2 mb-6">
		<h3 class="text-xl font-semibold leading-relaxed text-white">
			{question.text}
			{#if question.required}
				<span class="ml-1 text-xl font-bold text-red-400" title="Required">*</span>
			{/if}
		</h3>
	</div>

	<!-- Question Content -->
	<div class="mb-6">
		{#if question.type === 'rating'}
			<!-- Rating Scale -->
			<div class="flex flex-col gap-4">
				<div class="flex gap-2 justify-center">
					{#each Array.from({ length: (question.maxValue || 5) - (question.minValue || 1) + 1 }, (_, i) => (question.minValue || 1) + i) as rating}
						<button
							class={[
								'flex h-12 w-12 items-center justify-center rounded-full border-2 font-semibold transition-all duration-200',
								selectedValue === rating
									? 'btn-primary'
									: 'border-gray-600 bg-gray-800 text-gray-300 hover:border-purple-500 hover:bg-gray-700'
							]}
							onclick={() => handleOptionSelect(rating)}
							{disabled}
							type="button"
							aria-label={`Rate ${rating}`}
						>
							{rating}
						</button>
					{/each}
				</div>
				{#if question.labels}
					<div class="flex justify-between px-4">
						<span class="text-sm text-gray-400">{question.labels.min || 'Low'}</span>
						<span class="text-sm text-gray-400">{question.labels.max || 'High'}</span>
					</div>
				{/if}
			</div>
		{:else if question.type === 'emoji' || question.type === 'yesno'}
			<!-- Emoji or Yes/No Options -->
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each displayOptions as option}
					<button
						class={[
							'card-interactive flex min-h-[100px] flex-col items-center gap-3 p-6',
							selectedValue === option.value && 'bg-purple-500/20 ring-2 ring-purple-500'
						]}
						onclick={() => handleOptionSelect(option.value)}
						{disabled}
						type="button"
					>
						<span class="text-3xl">{option.label.split(' ')[0]}</span>
						<span class="text-center text-sm font-medium"
							>{option.label.split(' ').slice(1).join(' ')}</span
						>
					</button>
				{/each}
			</div>
		{:else if question.type === 'select'}
			<!-- Single Select Radio Group -->
			<div class="flex flex-col gap-4">
				{#each displayOptions as option}
					<label
						class="card-default flex cursor-pointer items-start gap-3 p-4 hover:ring-1 hover:ring-purple-500"
					>
						<input
							type="radio"
							name={`question-${question.id}`}
							value={option.value}
							checked={selectedValue === option.value}
							onchange={() => handleOptionSelect(option.value)}
							{disabled}
							class="mt-0.5 h-5 w-5 text-purple-600"
						/>
						<div class="flex flex-1 flex-col gap-1">
							<span class="text-sm text-white">
								{option.label}
							</span>
							{#if option.description}
								<span class="text-xs text-gray-400">{option.description}</span>
							{/if}
						</div>
					</label>
				{/each}
			</div>
		{:else if question.type === 'multiselect'}
			<!-- Multi Select Checkboxes -->
			<div class="flex flex-col gap-4">
				{#each displayOptions as option}
					<label
						class="card-default flex cursor-pointer items-start gap-3 p-4 hover:ring-1 hover:ring-purple-500"
					>
						<input
							type="checkbox"
							value={option.value}
							checked={selectedValues.includes(option.value)}
							onchange={(e) =>
								handleCheckboxChange(option.value, (e.target as HTMLInputElement).checked)}
							{disabled}
							class="mt-0.5 h-5 w-5 text-purple-600"
						/>
						<div class="flex flex-1 flex-col gap-1">
							<span class="text-sm text-white">
								{option.label}
							</span>
							{#if option.description}
								<span class="text-xs text-gray-400">{option.description}</span>
							{/if}
						</div>
					</label>
				{/each}
			</div>
		{:else if question.type === 'text'}
			<!-- Text Input -->
			<div class="w-full">
				<textarea
					bind:value={textValue}
					placeholder={question.placeholder || 'Enter your response...'}
					{disabled}
					rows={3}
					oninput={handleTextInput}
					class="input-default w-full"
				></textarea>
			</div>
		{/if}
	</div>
</div>

<!-- No styles needed - fully using Tailwind classes -->
