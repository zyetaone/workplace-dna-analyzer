<!--
	SharedSnippets.svelte
	Reusable UI snippets following Svelte 5 snippet pattern for DRY code
	These snippets reduce code duplication across dashboard and presenter views
-->

<script lang="ts" context="module">
	import type { Session, Participant, PreferenceScores } from '$lib/types';
	import type { ChartConfiguration } from 'chart.js';
	import { formatDate } from '$lib/utils/common';
	
	// Type definitions for snippet props
	export interface SessionCardProps {
		session: {
			name: string;
			slug: string;
			code: string;
			isActive: boolean;
			activeCount?: number;
			completedCount?: number;
			createdAt: Date | string;
		};
		onOpen?: (slug: string) => void;
		onCopyLink?: (slug: string) => void;
		onDelete?: (slug: string) => void;
		isDeleting?: boolean;
	}
	
	export interface ChartContainerProps {
		title: string;
		config: ChartConfiguration;
		height?: string;
		className?: string;
		loading?: boolean;
		error?: string;
		chartContent?: (config: ChartConfiguration) => void;
	}
	
	export interface ScoreCardProps {
		score: number;
		label: string;
		colorClass: string;
		showPercentage?: boolean;
		size?: 'sm' | 'md' | 'lg';
	}
	
	export interface ParticipantRowProps {
		participant: Participant;
		showId?: boolean;
		showGeneration?: boolean;
		showProgress?: boolean;
		showStatus?: boolean;
		showScores?: boolean;
		showLink?: boolean;
		showActions?: boolean;
		onDelete?: (id: string, name: string) => void;
		onCopyLink?: (id: string) => void;
	}
	
	export interface MetricCardProps {
		label: string;
		value: number | string;
		colorClass?: string;
		icon?: string;
		trend?: 'up' | 'down' | 'neutral';
		animate?: boolean;
	}
	
	export interface EmptyStateProps {
		icon?: string;
		title: string;
		message: string;
		action?: {
			label: string;
			onclick: () => void;
		};
	}
	
	export interface StatusBadgeProps {
		status: 'active' | 'inactive' | 'completed' | 'in-progress';
		animate?: boolean;
		size?: 'xs' | 'sm' | 'md';
	}
	
	export interface ProgressBarProps {
		current: number;
		total: number;
		showLabel?: boolean;
		colorClass?: string;
		height?: string;
		animate?: boolean;
	}
</script>

<!-- Session Card Snippet -->
{#snippet sessionCard(props: SessionCardProps)}
	{@const { session, onOpen, onCopyLink, onDelete, isDeleting } = props}
	
	
	<div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
		<!-- Card Header with Status -->
		<div class="p-6 border-b border-gray-100">
			<div class="flex justify-between items-start mb-3">
				<h3 class="text-xl font-semibold text-gray-800 truncate pr-2">
					{session.name}
				</h3>
				{@render statusBadge({ status: session.isActive ? 'active' : 'inactive', animate: session.isActive })}
			</div>
			
			<!-- Session Code -->
			<div class="mb-4">
				<span class="text-sm text-gray-500">Session Code:</span>
				<span class="ml-2 font-mono text-lg text-gray-700">{session.code}</span>
			</div>
			
			<!-- Stats -->
			<div class="grid grid-cols-2 gap-4">
				{@render metricCard({ 
					label: 'Active', 
					value: session.activeCount || 0,
					colorClass: 'text-gray-700'
				})}
				{@render metricCard({ 
					label: 'Completed', 
					value: session.completedCount || 0,
					colorClass: 'text-green-600'
				})}
			</div>
			
			<!-- Created Date -->
			<div class="mt-4 text-sm text-gray-500">
				Created: {formatDate(session.createdAt)}
			</div>
		</div>
		
		<!-- Card Actions -->
		<div class="p-4 bg-gray-50">
			<div class="grid grid-cols-3 gap-2">
				{#if onOpen}
					<button
						onclick={() => onOpen(session.slug)}
						class="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition text-sm font-medium"
					>
						Open
					</button>
				{/if}
				{#if onCopyLink}
					<button
						onclick={() => onCopyLink(session.slug)}
						class="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-sm font-medium"
						title="Copy participant link"
					>
						Copy Link
					</button>
				{/if}
				{#if onDelete}
					<button
						onclick={() => onDelete(session.slug)}
						disabled={isDeleting}
						class="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isDeleting ? '...' : 'Delete'}
					</button>
				{/if}
			</div>
		</div>
	</div>
{/snippet}

<!-- Chart Container Snippet -->
{#snippet chartContainer(props: ChartContainerProps)}
	{@const { title, config, height = '300px', className = '', loading = false, error, chartContent } = props}
	
	<div class="bg-white rounded-lg shadow-lg p-8 {className}">
		<h2 class="text-2xl font-semibold text-gray-800 mb-4">{title}</h2>
		
		{#if loading}
			<div class="flex items-center justify-center" style="height: {height}">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
			</div>
		{:else if error}
			<div class="flex items-center justify-center text-red-500" style="height: {height}">
				<p>{error}</p>
			</div>
		{:else}
			<!-- Import Chart component when using this snippet -->
			<div style="height: {height}">
				{@render chartContent?.(config)}
			</div>
		{/if}
	</div>
{/snippet}

<!-- Score Card Snippet -->
{#snippet scoreCard(props: ScoreCardProps)}
	{@const { score, label, colorClass, showPercentage = false, size = 'md' } = props}
	{@const sizeClasses = {
		sm: 'p-3 text-2xl',
		md: 'p-4 text-3xl',
		lg: 'p-6 text-4xl'
	}}
	
	<div class="bg-white rounded-lg shadow {sizeClasses[size]}">
		<div class="font-bold {colorClass}">
			{score}{showPercentage ? '%' : ''}
		</div>
		<div class="text-sm text-gray-600 mt-1">{label}</div>
	</div>
{/snippet}

<!-- Participant Row Snippet -->
{#snippet participantRow(props: ParticipantRowProps)}
	{@const { 
		participant, 
		showId = true, 
		showGeneration = true, 
		showProgress = true, 
		showStatus = true,
		showScores = false,
		showLink = true,
		showActions = true,
		onDelete,
		onCopyLink
	} = props}
	{@const getProgress = (responses: Record<number, any> | undefined) => {
		const responseCount = Object.keys(responses || {}).length;
		const totalQuestions = 7;
		return {
			count: responseCount,
			percentage: (responseCount / totalQuestions) * 100
		};
	}}
	{@const progress = getProgress(participant.responses)}
	{@const truncateId = (id: string) => `${id.substring(0, 8)}...`}
	{@const formatScore = (score: number | undefined) => score !== undefined ? score.toFixed(1) : '-'}
	
	<tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
		<!-- Name -->
		<td class="px-3 py-3 font-medium text-gray-900">
			{participant.name}
		</td>
		
		<!-- ID -->
		{#if showId}
			<td class="px-3 py-3 text-xs text-gray-500 font-mono">
				{truncateId(participant.id)}
			</td>
		{/if}
		
		<!-- Generation -->
		{#if showGeneration}
			<td class="px-3 py-3 text-gray-700">
				{participant.generation || '-'}
			</td>
		{/if}
		
		<!-- Progress -->
		{#if showProgress}
			<td class="px-3 py-3">
				{@render progressBar({ 
					current: progress.count, 
					total: 7, 
					showLabel: true,
					colorClass: 'bg-gradient-to-r from-gray-500 to-gray-600'
				})}
			</td>
		{/if}
		
		<!-- Status -->
		{#if showStatus}
			<td class="px-3 py-3">
				{@render statusBadge({ 
					status: participant.completed ? 'completed' : 'in-progress',
					size: 'sm'
				})}
			</td>
		{/if}
		
		<!-- Preference Scores -->
		{#if showScores && participant.preferenceScores}
			<td class="px-2 py-3 text-center text-sm font-medium text-blue-600">
				{formatScore(participant.preferenceScores.collaboration)}
			</td>
			<td class="px-2 py-3 text-center text-sm font-medium text-amber-600">
				{formatScore(participant.preferenceScores.formality)}
			</td>
			<td class="px-2 py-3 text-center text-sm font-medium text-green-600">
				{formatScore(participant.preferenceScores.tech)}
			</td>
			<td class="px-2 py-3 text-center text-sm font-medium text-red-600">
				{formatScore(participant.preferenceScores.wellness)}
			</td>
		{/if}
		
		<!-- Copy Link -->
		{#if showLink && onCopyLink}
			<td class="px-3 py-3">
				<button
					onclick={() => onCopyLink(participant.id)}
					class="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
					title="Copy participant link"
					aria-label="Copy participant link"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
							d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
					</svg>
				</button>
			</td>
		{/if}
		
		<!-- Actions -->
		{#if showActions && onDelete}
			<td class="px-3 py-3">
				<button
					onclick={() => onDelete(participant.id, participant.name)}
					class="px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded hover:bg-red-600 transition-colors"
				>
					Delete
				</button>
			</td>
		{/if}
	</tr>
{/snippet}

<!-- Metric Card Snippet -->
{#snippet metricCard(props: MetricCardProps)}
	{@const { label, value, colorClass = 'text-gray-700', icon, trend, animate = false } = props}
	
	<div class="text-center p-2 bg-gray-50 rounded">
		{#if icon}
			<div class="text-2xl mb-1">{icon}</div>
		{/if}
		<div class="text-2xl font-bold {colorClass} {animate ? 'animate-pulse' : ''}">
			{value}
			{#if trend}
				<span class="text-sm ml-1">
					{#if trend === 'up'}
						↑
					{:else if trend === 'down'}
						↓
					{:else}
						→
					{/if}
				</span>
			{/if}
		</div>
		<div class="text-xs text-gray-500">{label}</div>
	</div>
{/snippet}

<!-- Empty State Snippet -->
{#snippet emptyState(props: EmptyStateProps)}
	{@const { icon = '📋', title, message, action } = props}
	
	<div class="text-center py-12">
		<div class="text-6xl mb-4">{icon}</div>
		<h3 class="text-2xl font-semibold text-gray-800 mb-2">{title}</h3>
		<p class="text-gray-600 mb-6">{message}</p>
		{#if action}
			<button
				onclick={action.onclick}
				class="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
			>
				{action.label}
			</button>
		{/if}
	</div>
{/snippet}

<!-- Status Badge Snippet -->
{#snippet statusBadge(props: StatusBadgeProps)}
	{@const { status, animate = false, size = 'sm' } = props}
	{@const sizeClasses = {
		xs: 'text-xs px-1.5 py-0.5',
		sm: 'text-xs px-2.5 py-0.5',
		md: 'text-sm px-3 py-1'
	}}
	{@const statusConfig = {
		active: {
			bgColor: 'bg-green-100',
			textColor: 'text-green-600',
			label: 'Active',
			showPulse: true
		},
		inactive: {
			bgColor: 'bg-gray-100',
			textColor: 'text-gray-500',
			label: 'Inactive',
			showPulse: false
		},
		completed: {
			bgColor: 'bg-green-100',
			textColor: 'text-green-800',
			label: 'Completed',
			showPulse: false
		},
		'in-progress': {
			bgColor: 'bg-yellow-100',
			textColor: 'text-yellow-800',
			label: 'In Progress',
			showPulse: false
		}
	}}
	{@const config = statusConfig[status]}
	
	<div class="flex items-center gap-1">
		{#if animate && config.showPulse}
			<span class="relative flex h-3 w-3">
				<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
				<span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
			</span>
		{/if}
		<span class="inline-flex items-center rounded-full font-medium {sizeClasses[size]} {config.bgColor} {config.textColor}">
			{config.label}
		</span>
	</div>
{/snippet}

<!-- Progress Bar Snippet -->
{#snippet progressBar(props: ProgressBarProps)}
	{@const { 
		current, 
		total, 
		showLabel = false, 
		colorClass = 'bg-gray-600', 
		height = 'h-2',
		animate = true
	} = props}
	{@const percentage = total > 0 ? (current / total) * 100 : 0}
	
	<div class="flex items-center gap-3">
		{#if showLabel}
			<span class="text-sm text-gray-600 min-w-[3rem]">
				{current} / {total}
			</span>
		{/if}
		<div class="flex-1 bg-gray-200 rounded-full {height}">
			<div 
				class="{colorClass} {height} rounded-full {animate ? 'transition-all duration-300' : ''}"
				style="width: {percentage}%"
			></div>
		</div>
		{#if showLabel && percentage > 0}
			<span class="text-sm text-gray-600 min-w-[2.5rem] text-right">
				{Math.round(percentage)}%
			</span>
		{/if}
	</div>
{/snippet}

<!-- Connection Status Snippet -->
{#snippet connectionStatus(status: 'connected' | 'connecting' | 'disconnected')}
	<div class="flex items-center gap-2">
		<span class="relative flex h-3 w-3">
			{#if status === 'connected'}
				<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
				<span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
			{:else if status === 'connecting'}
				<span class="animate-pulse relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
			{:else}
				<span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
			{/if}
		</span>
		<span class="text-sm font-medium text-gray-700 capitalize">
			{status}
		</span>
	</div>
{/snippet}

<!-- Loading Indicator Snippet -->
{#snippet loadingIndicator(message = 'Loading...', size = 'md')}
	{@const sizeClasses = {
		sm: 'h-6 w-6 border',
		md: 'h-8 w-8 border-b-2',
		lg: 'h-12 w-12 border-b-2'
	}}
	
	<div class="flex flex-col items-center justify-center gap-4">
		<div class="animate-spin rounded-full {sizeClasses[size]} border-gray-600"></div>
		<p class="text-gray-600">{message}</p>
	</div>
{/snippet}

<!-- Action Button Snippet -->
{#snippet actionButton(props: {
	label: string;
	onclick: () => void;
	variant?: 'primary' | 'secondary' | 'danger';
	size?: 'sm' | 'md' | 'lg';
	disabled?: boolean;
	loading?: boolean;
	icon?: string;
})}
	{@const { label, onclick, variant = 'primary', size = 'md', disabled = false, loading = false, icon } = props}
	{@const variantClasses = {
		primary: 'bg-gray-600 text-white hover:bg-gray-700',
		secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
		danger: 'bg-red-500 text-white hover:bg-red-600'
	}}
	{@const sizeClasses = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-6 py-2',
		lg: 'px-8 py-3 text-lg'
	}}
	
	<button
		{onclick}
		{disabled}
		class="{variantClasses[variant]} {sizeClasses[size]} rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
	>
		{#if loading}
			<span class="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
		{/if}
		{#if icon && !loading}
			<span>{icon}</span>
		{/if}
		{label}
	</button>
{/snippet}

<!-- Export snippets for use in other components -->
<script lang="ts">
	export {
		sessionCard,
		chartContainer,
		scoreCard,
		participantRow,
		metricCard,
		emptyState,
		statusBadge,
		progressBar,
		connectionStatus,
		loadingIndicator,
		actionButton
	};
</script>