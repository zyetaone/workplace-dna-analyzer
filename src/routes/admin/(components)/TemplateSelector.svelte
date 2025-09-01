<script lang="ts">
	import { Card, Button, Select } from '$lib/components/ui';
	import { getTemplates, applyTemplate } from '../../../app.remote';
	import { showToast } from './Toast.svelte';

	interface Props {
		sessionCode?: string;
		onTemplateApplied?: (templateSlug: string) => void;
	}

	let { sessionCode, onTemplateApplied }: Props = $props();

	// Template state
	let templates = $state<any[]>([]);
	let selectedTemplate = $state<string>('');
	let isLoading = $state(false);
	let isApplying = $state(false);

	// Load templates on mount
	async function loadTemplates() {
		try {
			const result = await getTemplates({});
			if (result.success && 'templates' in result) {
				templates = result.templates;
			}
		} catch (error) {
			console.error('Failed to load templates:', error);
			showToast({
				title: 'Error',
				description: 'Failed to load templates',
				variant: 'error'
			});
		}
	}

	// Apply selected template
	async function applySelectedTemplate() {
		if (!selectedTemplate || !sessionCode) return;

		isApplying = true;
		try {
			const result = await applyTemplate({
				templateSlug: selectedTemplate,
				sessionCode
			});

			if (result.success) {
				showToast({
					title: 'Success',
					description: `Template applied successfully! ${result.activitiesAdded} activities added.`,
					variant: 'success'
				});

				onTemplateApplied?.(selectedTemplate);
				selectedTemplate = '';
			} else {
				showToast({
					title: 'Error',
					description: result.error || 'Failed to apply template',
					variant: 'error'
				});
			}
		} catch (error) {
			console.error('Failed to apply template:', error);
			showToast({
				title: 'Error',
				description: 'Failed to apply template',
				variant: 'error'
			});
		} finally {
			isApplying = false;
		}
	}

	// Group templates by category
	function getTemplatesByCategory() {
		const grouped: Record<string, any[]> = {};

		for (const template of templates) {
			const category = template.category.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
			if (!grouped[category]) {
				grouped[category] = [];
			}
			grouped[category].push(template);
		}

		return grouped;
	}

	// Get complexity color
	function getComplexityColor(complexity: string) {
		switch (complexity) {
			case 'beginner':
				return 'text-green-400 bg-green-900/30';
			case 'intermediate':
				return 'text-yellow-400 bg-yellow-900/30';
			case 'advanced':
				return 'text-red-400 bg-red-900/30';
			default:
				return 'text-slate-400 bg-slate-900/30';
		}
	}

	// Load templates on mount
	$effect(() => {
		loadTemplates();
	});
</script>

<Card variant="analytics" class="p-6">
	{#snippet children()}
		<div class="space-y-6">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-xl font-semibold text-slate-200">Apply Activity Template</h3>
					<p class="mt-1 text-sm text-slate-400">
						Choose from predefined activity sets to quickly set up your session
					</p>
				</div>
				<div class="text-right">
					<div class="text-2xl font-bold text-cyan-400">{templates.length}</div>
					<div class="text-xs text-slate-400">Templates Available</div>
				</div>
			</div>

			{#if templates.length === 0}
				<div class="py-8 text-center">
					<div class="mb-4 text-4xl">📋</div>
					<h4 class="mb-2 text-lg font-semibold text-slate-200">No Templates Available</h4>
					<p class="mb-4 text-slate-400">Templates need to be seeded into the database first.</p>
					<Button onclick={loadTemplates} disabled={isLoading} variant="secondary" size="sm">
						{isLoading ? 'Loading...' : 'Refresh Templates'}
					</Button>
				</div>
			{:else}
				<div class="space-y-4">
					<!-- Template Selector -->
					<div>
						<label for="template-select" class="mb-2 block text-sm font-medium text-slate-300">
							Select Template
						</label>
						<Select
							id="template-select"
							bind:value={selectedTemplate}
							placeholder="Choose a template..."
							options={templates.map((t) => ({
								value: t.slug,
								label: t.name,
								description: t.description
							}))}
							disabled={isApplying}
						/>
					</div>

					<!-- Selected Template Preview -->
					{#if selectedTemplate}
						{@const template = templates.find((t) => t.slug === selectedTemplate)}
						{#if template}
							<Card variant="analytics" class="border border-slate-700/50 bg-slate-900/50">
								{#snippet children()}
									<div class="space-y-4">
										<div class="flex items-start justify-between">
											<div>
												<h4 class="text-lg font-semibold text-slate-200">{template.name}</h4>
												<p class="mt-1 text-sm text-slate-400">{template.description}</p>
											</div>
											<div class="flex items-center gap-2">
												<span
													class={`rounded-full px-2 py-1 text-xs font-medium ${getComplexityColor(template.complexity)}`}
												>
													{template.complexity}
												</span>
												{#if template.isDefault}
													<span
														class="rounded-full bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-400"
													>
														Default
													</span>
												{/if}
											</div>
										</div>

										<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
											<div>
												<div class="text-sm text-slate-400">Target Audience</div>
												<div class="text-sm text-slate-200">{template.targetAudience}</div>
											</div>
											<div>
												<div class="text-sm text-slate-400">Estimated Duration</div>
												<div class="text-sm text-slate-200">
													{template.estimatedDuration} minutes
												</div>
											</div>
										</div>

										<div>
											<div class="mb-2 text-sm text-slate-400">
												Activities ({template.activities.length})
											</div>
											<div class="space-y-2">
												{#each template.activities as activity}
													<div
														class="flex items-center justify-between rounded-lg border border-slate-700/30 bg-slate-800/50 p-3"
													>
														<div class="flex items-center gap-3">
															<div class="h-2 w-2 rounded-full bg-cyan-400"></div>
															<span class="text-sm capitalize text-slate-200">
																{activity.activitySlug.replace('-', ' ')}
															</span>
														</div>
														<div class="text-xs text-slate-400">
															Order: {activity.order}
														</div>
													</div>
												{/each}
											</div>
										</div>
									</div>
								{/snippet}
							</Card>
						{/if}
					{/if}

					<!-- Apply Button -->
					<div class="flex justify-end">
						<Button
							onclick={applySelectedTemplate}
							disabled={!selectedTemplate || isApplying || !sessionCode}
							loading={isApplying}
							class="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
						>
							{isApplying ? 'Applying Template...' : 'Apply Template'}
						</Button>
					</div>
				</div>
			{/if}
		</div>
	{/snippet}
</Card>
