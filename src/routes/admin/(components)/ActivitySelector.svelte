<script lang="ts">
	import { Card, Button, RadioGroup, Checkbox } from '$lib/components';

	interface Props {
		selectedTemplate?: string;
		selectedActivities?: string[];
		onTemplateChange?: (template: string) => void;
		onActivitiesChange?: (activities: string[]) => void;
	}

	let {
		selectedTemplate: propSelectedTemplate = 'basic',
		selectedActivities: propSelectedActivities = ['workplace-preference'],
		onTemplateChange,
		onActivitiesChange
	}: Props = $props();

	// State variables
	let selectedTemplate = $state(propSelectedTemplate);
	let selectedActivities = $state(propSelectedActivities);

	// Available activities
	const availableActivities = [
		{
			slug: 'workplace-preference',
			name: 'Workplace Preference Assessment',
			description: 'Assess collaboration, formality, tech, and wellness preferences',
			estimatedDuration: 20,
			type: 'assessment'
		},
		{
			slug: 'pulse-survey',
			name: 'Team Pulse Check',
			description: 'Quick survey on satisfaction, engagement, and support',
			estimatedDuration: 15,
			type: 'survey'
		},
		{
			slug: 'team-health',
			name: 'Team Health Assessment',
			description: 'Evaluate communication, trust, and goal alignment',
			estimatedDuration: 10,
			type: 'assessment'
		}
	];

	// Session creation templates
	const templates = getSessionCreationTemplates();

	// Handle template selection
	function handleTemplateChange(templateSlug: string) {
		selectedTemplate = templateSlug;
		onTemplateChange?.(templateSlug);

		// Auto-select activities based on template
		if (templateSlug === 'basic') {
			selectedActivities = ['workplace-preference'];
		} else if (templateSlug === 'advanced') {
			selectedActivities = ['workplace-preference', 'pulse-survey', 'team-health'];
		} else if (templateSlug === 'custom') {
			selectedActivities = [];
		}

		onActivitiesChange?.(selectedActivities);
	}

	// Handle custom activity selection
	function handleActivityToggle(activitySlug: string, checked: boolean) {
		if (checked) {
			selectedActivities = [...selectedActivities, activitySlug];
		} else {
			selectedActivities = selectedActivities.filter((slug) => slug !== activitySlug);
		}
		onActivitiesChange?.(selectedActivities);
	}

	// Calculate total duration
	let totalDuration = $derived(
		selectedActivities.reduce((total, slug) => {
			const activity = availableActivities.find((a) => a.slug === slug);
			return total + (activity?.estimatedDuration || 0);
		}, 0)
	);

	// Get selected template details
	let selectedTemplateDetails = $derived(templates.find((t) => t.slug === selectedTemplate));

	// Sync with prop changes
	$effect(() => {
		selectedActivities = propSelectedActivities;
	});

	// Initialize activities based on template
	$effect(() => {
		if (selectedTemplate === 'basic' && selectedActivities.length === 0) {
			selectedActivities = ['workplace-preference'];
			onActivitiesChange?.(selectedActivities);
		} else if (selectedTemplate === 'advanced' && selectedActivities.length === 0) {
			selectedActivities = ['workplace-preference', 'pulse-survey', 'team-health'];
			onActivitiesChange?.(selectedActivities);
		}
	});
</script>

<Card variant="analytics" class="p-6">
	{#snippet children()}
		<div class="space-y-6">
			<div>
				<h3 class="mb-2 text-xl font-semibold text-slate-200">Select Activities</h3>
				<p class="text-sm text-slate-400">Choose a template or customize your session activities</p>
			</div>

			<!-- Template Selection -->
			<div class="space-y-4">
				<RadioGroup
					label="Session Type"
					bind:value={selectedTemplate}
					onValueChange={handleTemplateChange}
					options={templates.map((template) => ({
						value: template.slug,
						label: template.name,
						description: template.description
					}))}
				/>
			</div>

			<!-- Activity Preview -->
			{#if selectedActivities.length > 0}
				<Card variant="analytics" class="border border-slate-700/50 bg-slate-900/50">
					{#snippet children()}
						<div class="space-y-4">
							<div class="flex items-center justify-between">
								<h4 class="text-lg font-semibold text-slate-200">Activity Preview</h4>
								<div class="text-right">
									<div class="text-sm font-medium text-cyan-400">
										{selectedActivities.length} Activities
									</div>
									<div class="text-xs text-slate-400">{totalDuration} minutes total</div>
								</div>
							</div>

							<div class="space-y-3">
								{#each selectedActivities as activitySlug, index}
									{@const activity = availableActivities.find((a) => a.slug === activitySlug)}
									{#if activity}
										<div
											class="flex items-center justify-between rounded-lg border border-slate-700/30 bg-slate-800/50 p-3"
										>
											<div
												class="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-600/30 text-xs font-medium text-cyan-400"
											>
												{index + 1}
											</div>
											<div>
												<div class="text-sm font-medium text-slate-200">{activity.name}</div>
												<div class="text-xs text-slate-400">{activity.description}</div>
											</div>
											<div class="text-xs text-slate-400">
												{activity.estimatedDuration} min
											</div>
										</div>
									{/if}
								{/each}
							</div>
						</div>
					{/snippet}
				</Card>
			{/if}
		</div>
	{/snippet}
</Card>
