<script lang="ts">
	import {
		Card,
		Button,
		TextInput,
		Select,
		ConfirmationDialog,
		Feedback
	} from '$lib/components/ui';
	import {
		getTemplates,
		createTemplate,
		updateTemplate,
		deleteTemplate,
		seedTemplates
	} from '../../../app.remote';
	import { showToast } from './Toast.svelte';

	// Template state
	let templates = $state<any[]>([]);
	let isLoading = $state(false);
	let showCreateForm = $state(false);
	let editingTemplate = $state<any | null>(null);
	let deleteDialog = $state({ open: false, template: null as any });

	// Form state
	let formData = $state({
		name: '',
		slug: '',
		description: '',
		category: '',
		targetAudience: '',
		estimatedDuration: 30,
		complexity: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
		activities: [] as any[]
	});

	// Load templates
	async function loadTemplates() {
		isLoading = true;
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
		} finally {
			isLoading = false;
		}
	}

	// Seed default templates
	async function seedDefaultTemplates() {
		try {
			const result = await seedTemplates({});
			if (result.success) {
				showToast({
					title: 'Success',
					description: result.message || 'Templates seeded successfully',
					variant: 'success'
				});
				await loadTemplates();
			} else {
				showToast({
					title: 'Error',
					description: result.error || 'Failed to seed templates',
					variant: 'error'
				});
			}
		} catch (error) {
			console.error('Failed to seed templates:', error);
			showToast({
				title: 'Error',
				description: 'Failed to seed templates',
				variant: 'error'
			});
		}
	}

	// Reset form
	function resetForm() {
		formData = {
			name: '',
			slug: '',
			description: '',
			category: '',
			targetAudience: '',
			estimatedDuration: 30,
			complexity: 'beginner',
			activities: []
		};
		editingTemplate = null;
		showCreateForm = false;
	}

	// Start editing template
	function startEditing(template: any) {
		editingTemplate = template;
		formData = {
			name: template.name,
			slug: template.slug,
			description: template.description,
			category: template.category,
			targetAudience: template.targetAudience,
			estimatedDuration: template.estimatedDuration,
			complexity: template.complexity,
			activities: [...template.activities]
		};
		showCreateForm = true;
	}

	// Save template
	async function saveTemplate() {
		try {
			const templateData = {
				...formData,
				isDefault: false,
				isActive: true,
				version: '1.0.0'
			};

			let result;
			if (editingTemplate) {
				result = await updateTemplate({
					id: editingTemplate.id,
					updates: templateData
				});
			} else {
				result = await createTemplate({ template: templateData });
			}

			if (result.success) {
				showToast({
					title: 'Success',
					description: `Template ${editingTemplate ? 'updated' : 'created'} successfully`,
					variant: 'success'
				});
				resetForm();
				await loadTemplates();
			} else {
				showToast({
					title: 'Error',
					description: result.error || 'Failed to save template',
					variant: 'error'
				});
			}
		} catch (error) {
			console.error('Failed to save template:', error);
			showToast({
				title: 'Error',
				description: 'Failed to save template',
				variant: 'error'
			});
		}
	}

	// Delete template
	async function confirmDelete() {
		if (!deleteDialog.template) return;

		try {
			const result = await deleteTemplate({ id: deleteDialog.template.id });
			if (result.success) {
				showToast({
					title: 'Success',
					description: 'Template deleted successfully',
					variant: 'success'
				});
				deleteDialog = { open: false, template: null };
				await loadTemplates();
			} else {
				showToast({
					title: 'Error',
					description: result.error || 'Failed to delete template',
					variant: 'error'
				});
			}
		} catch (error) {
			console.error('Failed to delete template:', error);
			showToast({
				title: 'Error',
				description: 'Failed to delete template',
				variant: 'error'
			});
		}
	}

	// Get category display name
	function getCategoryDisplayName(category: string) {
		return category.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
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
					<h3 class="text-xl font-semibold text-slate-200">Template Management</h3>
					<p class="mt-1 text-sm text-slate-400">Create, edit, and manage activity templates</p>
				</div>
				<div class="flex gap-2">
					<Button onclick={seedDefaultTemplates} variant="secondary" size="sm" disabled={isLoading}>
						Seed Defaults
					</Button>
					<Button
						onclick={() => {
							resetForm();
							showCreateForm = true;
						}}
						class="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
						size="sm"
					>
						Create Template
					</Button>
				</div>
			</div>

			<!-- Create/Edit Form -->
			{#if showCreateForm}
				<Card variant="analytics" class="border border-slate-700/50 bg-slate-900/50">
					{#snippet children()}
						<div class="space-y-4">
							<div class="flex items-center justify-between">
								<h4 class="text-lg font-semibold text-slate-200">
									{editingTemplate ? 'Edit Template' : 'Create New Template'}
								</h4>
								<Button onclick={resetForm} variant="secondary" size="sm">✕</Button>
							</div>

							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								<TextInput
									label="Template Name"
									bind:value={formData.name}
									placeholder="e.g., Team Building Icebreaker"
									required
								/>
								<TextInput
									label="Slug"
									bind:value={formData.slug}
									placeholder="e.g., team-building-icebreaker"
									required
									disabled={!!editingTemplate}
								/>
							</div>

							<div class="space-y-1">
								<label class="block text-sm font-medium text-slate-300">Description</label>
								<textarea
									bind:value={formData.description}
									placeholder="Describe what this template is for..."
									required
									class="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-slate-200 placeholder-slate-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
									rows="3"
								></textarea>
							</div>

							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								<Select
									label="Category"
									bind:value={formData.category}
									options={[
										{ value: 'team-building', label: 'Team Building' },
										{ value: 'leadership-development', label: 'Leadership Development' },
										{ value: 'employee-onboarding', label: 'Employee Onboarding' },
										{ value: 'performance-reviews', label: 'Performance Reviews' },
										{ value: 'culture-assessment', label: 'Culture Assessment' },
										{ value: 'custom', label: 'Custom' }
									]}
									required
								/>
								<Select
									label="Complexity"
									bind:value={formData.complexity}
									options={[
										{ value: 'beginner', label: 'Beginner' },
										{ value: 'intermediate', label: 'Intermediate' },
										{ value: 'advanced', label: 'Advanced' }
									]}
									required
								/>
							</div>

							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								<TextInput
									label="Target Audience"
									bind:value={formData.targetAudience}
									placeholder="e.g., New teams, remote teams..."
									required
								/>
								<TextInput
									label="Estimated Duration (minutes)"
									bind:value={formData.estimatedDuration}
									type="number"
									min="1"
									required
								/>
							</div>

							<div class="flex justify-end gap-2">
								<Button onclick={resetForm} variant="secondary">Cancel</Button>
								<Button
									onclick={saveTemplate}
									class="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700"
								>
									{editingTemplate ? 'Update Template' : 'Create Template'}
								</Button>
							</div>
						</div>
					{/snippet}
				</Card>
			{/if}

			<!-- Templates List -->
			{#if isLoading}
				<Feedback status="loading" message="Loading templates..." />
			{:else if templates.length === 0}
				<div class="py-8 text-center">
					<div class="mb-4 text-4xl">📋</div>
					<h4 class="mb-2 text-lg font-semibold text-slate-200">No Templates Found</h4>
					<p class="mb-4 text-slate-400">Create your first template or seed the default ones.</p>
					<Button onclick={seedDefaultTemplates} variant="secondary">Seed Default Templates</Button>
				</div>
			{:else}
				<div class="grid gap-4">
					{#each templates as template}
						<Card variant="analytics" class="border border-slate-700/50 bg-slate-900/50">
							{#snippet children()}
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<div class="mb-2 flex items-center gap-3">
											<h4 class="text-lg font-semibold text-slate-200">{template.name}</h4>
											{#if template.isDefault}
												<span
													class="rounded-full bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-400"
												>
													Default
												</span>
											{/if}
											<span
												class={`rounded-full px-2 py-1 text-xs font-medium ${getComplexityColor(template.complexity)}`}
											>
												{template.complexity}
											</span>
										</div>
										<p class="mb-3 text-sm text-slate-400">{template.description}</p>
										<div class="flex items-center gap-4 text-xs text-slate-500">
											<span>Category: {getCategoryDisplayName(template.category)}</span>
											<span>•</span>
											<span>Duration: {template.estimatedDuration}min</span>
											<span>•</span>
											<span>Activities: {template.activities.length}</span>
										</div>
									</div>
									<div class="ml-4 flex gap-2">
										<Button onclick={() => startEditing(template)} variant="secondary" size="sm">
											Edit
										</Button>
										<Button
											onclick={() => (deleteDialog = { open: true, template })}
											variant="destructive"
											size="sm"
											disabled={template.isDefault}
										>
											Delete
										</Button>
									</div>
								</div>
							{/snippet}
						</Card>
					{/each}
				</div>
			{/if}
		</div>
	{/snippet}
</Card>

<!-- Delete Confirmation Dialog -->
<ConfirmationDialog
	bind:open={deleteDialog.open}
	title="Delete Template"
	message="Are you sure you want to delete this template? This action cannot be undone."
	confirmText="Delete"
	variant="destructive"
	onConfirm={confirmDelete}
	onCancel={() => (deleteDialog = { open: false, template: null })}
/>
