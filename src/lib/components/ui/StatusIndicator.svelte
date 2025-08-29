<script lang="ts">
	interface StatusIndicatorProps {
		status: 'success' | 'error' | 'warning' | 'info' | 'loading';
		message?: string;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
		showIcon?: boolean;
	}

	let {
		status = 'info',
		message = '',
		size = 'md',
		class: className = '',
		showIcon = true
	}: StatusIndicatorProps = $props();

	const statusConfig = {
		success: {
			bg: 'bg-green-500/10',
			border: 'border-green-500/20',
			text: 'text-green-600',
			icon: '✅'
		},
		error: {
			bg: 'bg-red-500/10',
			border: 'border-red-500/20',
			text: 'text-red-600',
			icon: '❌'
		},
		warning: {
			bg: 'bg-amber-500/10',
			border: 'border-amber-500/20',
			text: 'text-amber-600',
			icon: '⚠️'
		},
		info: {
			bg: 'bg-blue-500/10',
			border: 'border-blue-500/20',
			text: 'text-blue-600',
			icon: 'ℹ️'
		},
		loading: {
			bg: 'bg-purple-500/10',
			border: 'border-purple-500/20',
			text: 'text-purple-600',
			icon: '⏳'
		}
	};

	const sizeConfig = {
		sm: 'text-xs',
		md: 'text-sm',
		lg: 'text-base'
	};

	const currentConfig = statusConfig[status];
</script>

{#if status === 'loading'}
  <div class="inline-flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm border {currentConfig.bg} {currentConfig.border} {currentConfig.text} {sizeConfig[size]} {className}">
    {#if showIcon}
      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
    {/if}
    {#if message}
      <span>{message}</span>
    {/if}
  </div>
{:else}
  <div class="inline-flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm border {currentConfig.bg} {currentConfig.border} {currentConfig.text} {sizeConfig[size]} {className}">
    {#if showIcon}
      <span class="text-lg">{currentConfig.icon}</span>
    {/if}
    {#if message}
      <span>{message}</span>
    {/if}
  </div>
{/if}
