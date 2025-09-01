<script lang="ts">
	import { Sparkles, TrendingUp, AlertCircle, CheckCircle, XCircle, Info } from 'lucide-svelte';
	import { slide, fade } from 'svelte/transition';

	interface Insight {
		id: string;
		type: 'success' | 'warning' | 'error' | 'info' | 'trend';
		title: string;
		description: string;
		metric?: string;
		action?: {
			label: string;
			onClick: () => void;
		};
		timestamp?: Date;
	}

	interface Props {
		insights: Insight[];
		title?: string;
		loading?: boolean;
		aiPowered?: boolean;
		class?: string;
	}

	let {
		insights,
		title = 'Key Insights',
		loading = false,
		aiPowered = false,
		class: className = ''
	}: Props = $props();

	const iconMap = {
		success: CheckCircle,
		warning: AlertCircle,
		error: XCircle,
		info: Info,
		trend: TrendingUp
	};

	const colorClasses = {
		success: 'bg-green-50 text-green-800 border-green-200',
		warning: 'bg-amber-50 text-amber-800 border-amber-200',
		error: 'bg-red-50 text-red-800 border-red-200',
		info: 'bg-blue-50 text-blue-800 border-blue-200',
		trend: 'bg-purple-50 text-purple-800 border-purple-200'
	};

	const iconColorClasses = {
		success: 'text-green-600',
		warning: 'text-amber-600',
		error: 'text-red-600',
		info: 'text-blue-600',
		trend: 'text-purple-600'
	};

	function formatTimestamp(date: Date): string {
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return 'Just now';
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		if (days < 7) return `${days}d ago`;
		return date.toLocaleDateString();
	}
</script>

<div class="overflow-hidden rounded-xl border border-gray-200 bg-white {className}">
	<div class="border-b border-gray-100 p-6">
		<div class="flex items-center justify-between">
			<div class="flex items-center space-x-2">
				<h3 class="text-lg font-semibold text-gray-900">{title}</h3>
				{#if aiPowered}
					<span
						class="inline-flex items-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-2.5 py-1 text-xs font-medium text-white"
					>
						<Sparkles class="mr-1 h-3 w-3" />
						AI Powered
					</span>
				{/if}
			</div>
			{#if loading}
				<div class="flex items-center space-x-2 text-sm text-gray-500">
					<div
						class="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
					></div>
					<span>Analyzing...</span>
				</div>
			{/if}
		</div>
	</div>

	<div class="max-h-96 space-y-4 overflow-y-auto p-6">
		{#if loading && insights.length === 0}
			<div class="space-y-4">
				{#each Array(3) as _}
					<div class="animate-pulse">
						<div class="flex items-start space-x-3">
							<div class="h-10 w-10 rounded-lg bg-gray-200"></div>
							<div class="flex-1 space-y-2">
								<div class="h-4 w-3/4 rounded bg-gray-200"></div>
								<div class="h-3 w-full rounded bg-gray-200"></div>
								<div class="h-3 w-5/6 rounded bg-gray-200"></div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{:else if insights.length === 0}
			<div class="py-12 text-center">
				<Info class="mx-auto mb-3 h-12 w-12 text-gray-400" />
				<p class="text-gray-500">No insights available yet</p>
				<p class="mt-1 text-sm text-gray-400">Check back once more data is collected</p>
			</div>
		{:else}
			{#each insights as insight (insight.id)}
				<div
					transition:slide={{ duration: 300 }}
					class="group relative flex items-start space-x-3 rounded-lg border p-4 {colorClasses[
						insight.type
					]} transition-all duration-200 hover:shadow-sm"
				>
					<div class="flex-shrink-0">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-lg bg-white {iconColorClasses[
								insight.type
							]}"
						>
							{#if insight.type === 'success'}
								<CheckCircle class="h-5 w-5" />
							{:else if insight.type === 'warning'}
								<AlertCircle class="h-5 w-5" />
							{:else if insight.type === 'error'}
								<XCircle class="h-5 w-5" />
							{:else if insight.type === 'info'}
								<Info class="h-5 w-5" />
							{:else if insight.type === 'trend'}
								<TrendingUp class="h-5 w-5" />
							{/if}
						</div>
					</div>

					<div class="min-w-0 flex-1">
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<p class="text-sm font-medium text-gray-900">{insight.title}</p>
								<p class="mt-1 text-sm text-gray-600">{insight.description}</p>

								{#if insight.metric}
									<div class="mt-2">
										<span
											class="inline-flex items-center rounded-md bg-white/80 px-2.5 py-1 text-xs font-medium text-gray-700"
										>
											{insight.metric}
										</span>
									</div>
								{/if}

								{#if insight.action}
									<button
										onclick={insight.action.onClick}
										class="mt-3 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
									>
										{insight.action.label} →
									</button>
								{/if}
							</div>

							{#if insight.timestamp}
								<span class="ml-2 whitespace-nowrap text-xs text-gray-500">
									{formatTimestamp(insight.timestamp)}
								</span>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>

	{#if !loading && insights.length > 0}
		<div class="border-t border-gray-100 bg-gray-50 p-4">
			<div class="flex items-center justify-between text-sm">
				<span class="text-gray-500">
					{insights.length} insight{insights.length !== 1 ? 's' : ''} found
				</span>
				{#if aiPowered}
					<span class="text-xs text-gray-400">Powered by GPT-4</span>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style></style>
