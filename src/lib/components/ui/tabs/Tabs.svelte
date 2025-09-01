<script lang="ts">
	// Clean Tabs Component following quiz pattern
	interface TabItem {
		value: string;
		label: string;
		content: any;
		disabled?: boolean;
	}

	interface Props {
		tabs: TabItem[];
		value?: string;
		orientation?: 'horizontal' | 'vertical';
		onValueChange?: (value: string) => void;
	}

	let {
		tabs,
		value = $bindable(tabs[0]?.value || ''),
		orientation = 'horizontal',
		onValueChange
	}: Props = $props();

	// Handle tab change
	function handleTabChange(newValue: string) {
		value = newValue;
		onValueChange?.(newValue);
	}

	// Get current tab content
	$: currentTab = tabs.find((tab) => tab.value === value);
</script>

<div class="tabs-container" data-orientation={orientation}>
	<!-- Tab List -->
	<div class="tabs-list" role="tablist" data-orientation={orientation}>
		{#each tabs as tab}
			<button
				class="tab-trigger"
				class:active={value === tab.value}
				class:disabled={tab.disabled}
				data-state={value === tab.value ? 'active' : 'inactive'}
				data-value={tab.value}
				data-orientation={orientation}
				disabled={tab.disabled}
				onclick={() => handleTabChange(tab.value)}
				role="tab"
				aria-selected={value === tab.value}
			>
				{tab.label}
			</button>
		{/each}
	</div>

	<!-- Tab Content -->
	<div class="tabs-content" role="tabpanel">
		{#if currentTab}
			{@render currentTab.content()}
		{/if}
	</div>
</div>

<style>
	.tabs-container {
		width: 100%;
	}

	.tabs-list {
		display: flex;
		border-bottom: 1px solid #e2e8f0;
		margin-bottom: 1rem;
	}

	.tabs-list[data-orientation='vertical'] {
		flex-direction: column;
		border-bottom: none;
		border-right: 1px solid #e2e8f0;
		margin-bottom: 0;
		margin-right: 1rem;
	}

	.tab-trigger {
		padding: 0.75rem 1rem;
		border: none;
		background: none;
		color: #64748b;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: all 0.2s ease;
		font-weight: 500;
	}

	.tab-trigger:hover:not(.disabled) {
		color: #334155;
	}

	.tab-trigger.active {
		color: #3b82f6;
		border-bottom-color: #3b82f6;
	}

	.tab-trigger.disabled {
		color: #94a3b8;
		cursor: not-allowed;
	}

	.tabs-list[data-orientation='vertical'] .tab-trigger {
		border-bottom: none;
		border-right: 2px solid transparent;
		text-align: left;
	}

	.tabs-list[data-orientation='vertical'] .tab-trigger.active {
		border-right-color: #3b82f6;
		border-bottom: none;
	}

	.tabs-content {
		padding: 1rem 0;
		min-height: 200px;
	}
</style>
