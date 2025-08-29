<script lang="ts">
	import type { Session, Participant } from '$lib/server/db/schema';

	interface Props {
		session: Session;
		participants: Participant[];
		insights?: string;
	}

	let { session, participants, insights }: Props = $props();

	// Calculate workplace DNA metrics
	let workplaceDNA = $derived(() => {
		const completed = participants.filter((p) => p.completed);
		if (completed.length === 0) return null;

		const scores = {
			collaboration: 0,
			formality: 0,
			technology: 0,
			wellness: 0
		};

		completed.forEach((p) => {
			if (p.preferenceScores) {
				scores.collaboration += p.preferenceScores.collaboration || 0;
				scores.formality += p.preferenceScores.formality || 0;
				scores.technology += p.preferenceScores.tech || 0;
				scores.wellness += p.preferenceScores.wellness || 0;
			}
		});

		const count = completed.length;
		return {
			collaboration: Math.round(scores.collaboration / count),
			formality: Math.round(scores.formality / count),
			technology: Math.round(scores.technology / count),
			wellness: Math.round(scores.wellness / count),
			dominant: Object.entries(scores).sort(([, a], [, b]) => b - a)[0][0]
		};
	});

	// Generation breakdown
	const generationStats = $derived((): Array<{ generation: string; count: number; percentage: number }> => {
		const stats: Record<string, number> = {};
		participants.forEach((p) => {
			if (p.generation) {
				stats[p.generation] = (stats[p.generation] || 0) + 1;
			}
		});
		return Object.entries(stats)
			.sort(([, a], [, b]) => b - a)
			.map(([gen, count]) => ({
				generation: gen,
				count,
				percentage: Math.round((count / participants.length) * 100)
			}));
	});
</script>

<div class="insights-container space-y-8">
	<!-- Session Overview with Typography -->
	<div class="card-elevated p-8">
		<div class="prose prose-workplace prose-lg max-w-none">
			<h2 class="gradient-text">Session Insights</h2>
			<p class="lead">
				Analysis for <strong>{session.name}</strong> with {participants.length} participants
			</p>

			{#if workplaceDNA()}
				<h3>Workplace DNA Profile</h3>
				<p>
					Your organization shows a <strong class="text-cyan-400">{workplaceDNA().dominant}</strong
					>-dominant culture based on the preferences of your team members.
				</p>
			{/if}
		</div>
	</div>

	<!-- Workplace DNA Visualization -->
	{#if workplaceDNA()}
		<div class="card-elevated p-8">
			<h3 class="text-xl font-semibold text-slate-200 mb-6">Workplace DNA Breakdown</h3>

			<div class="space-y-4">
				<!-- Collaboration -->
				<div class="dna-trait">
					<div class="flex items-center gap-3 min-w-[140px]">
						<div
							class="w-10 h-10 rounded-lg gradient-radial-collaboration flex items-center justify-center"
						>
							<span class="text-lg">🤝</span>
						</div>
						<span class="text-sm font-medium text-slate-300">Collaboration</span>
					</div>
					<div class="flex-1 mx-4">
						<div class="h-2 bg-slate-700/50 rounded-full overflow-hidden">
							<div
								class="h-full gradient-collaboration rounded-full transition-all duration-1000"
								style="width: {workplaceDNA().collaboration}%"
							></div>
						</div>
					</div>
					<span class="text-sm font-bold text-cyan-400 min-w-[45px] text-right">
						{workplaceDNA().collaboration}%
					</span>
				</div>

				<!-- Formality -->
				<div class="dna-trait">
					<div class="flex items-center gap-3 min-w-[140px]">
						<div class="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
							<span class="text-lg">📋</span>
						</div>
						<span class="text-sm font-medium text-slate-300">Formality</span>
					</div>
					<div class="flex-1 mx-4">
						<div class="h-2 bg-slate-700/50 rounded-full overflow-hidden">
							<div
								class="h-full gradient-formality rounded-full transition-all duration-1000"
								style="width: {workplaceDNA().formality}%"
							></div>
						</div>
					</div>
					<span class="text-sm font-bold text-slate-400 min-w-[45px] text-right">
						{workplaceDNA().formality}%
					</span>
				</div>

				<!-- Technology -->
				<div class="dna-trait">
					<div class="flex items-center gap-3 min-w-[140px]">
						<div
							class="w-10 h-10 rounded-lg gradient-radial-technology flex items-center justify-center"
						>
							<span class="text-lg">💻</span>
						</div>
						<span class="text-sm font-medium text-slate-300">Technology</span>
					</div>
					<div class="flex-1 mx-4">
						<div class="h-2 bg-slate-700/50 rounded-full overflow-hidden">
							<div
								class="h-full gradient-technology rounded-full transition-all duration-1000"
								style="width: {workplaceDNA().technology}%"
							></div>
						</div>
					</div>
					<span class="text-sm font-bold text-purple-400 min-w-[45px] text-right">
						{workplaceDNA().technology}%
					</span>
				</div>

				<!-- Wellness -->
				<div class="dna-trait">
					<div class="flex items-center gap-3 min-w-[140px]">
						<div
							class="w-10 h-10 rounded-lg gradient-radial-wellness flex items-center justify-center"
						>
							<span class="text-lg">🌱</span>
						</div>
						<span class="text-sm font-medium text-slate-300">Wellness</span>
					</div>
					<div class="flex-1 mx-4">
						<div class="h-2 bg-slate-700/50 rounded-full overflow-hidden">
							<div
								class="h-full gradient-wellness rounded-full transition-all duration-1000"
								style="width: {workplaceDNA().wellness}%"
							></div>
						</div>
					</div>
					<span class="text-sm font-bold text-green-400 min-w-[45px] text-right">
						{workplaceDNA().wellness}%
					</span>
				</div>
			</div>
		</div>
	{/if}

	<!-- Generation Breakdown with Container Queries -->
	{#if generationStats().length > 0}
		<div class="card-elevated p-8">
			<h3 class="text-xl font-semibold text-slate-200 mb-6">Generation Distribution</h3>

			<div class="container-responsive">
				<div class="grid gap-4 stats-grid-responsive">
					{#each generationStats() as stat}
						<div class="glass-surface-v4 rounded-xl p-4 hover:scale-105 transition-transform">
							<div class="text-2xl font-bold gradient-text">{stat.percentage}%</div>
							<div class="text-sm text-slate-400 mt-1">{stat.generation}</div>
							<div class="text-xs text-slate-500">{stat.count} participants</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- AI Insights with Typography -->
	{#if insights}
		<div class="card-elevated p-8">
			<div class="prose prose-insight prose-lg max-w-none">
				<h3>AI-Powered Insights</h3>
				<div class="whitespace-pre-wrap">{insights}</div>
			</div>
		</div>
	{:else}
		<div class="card-elevated p-8">
			<div class="prose prose-workplace max-w-none">
				<h3>Key Observations</h3>
				<ul>
					<li>
						<strong>Participation Rate:</strong>
						{Math.round(
							(participants.filter((p) => p.completed).length / participants.length) * 100
						)}% of participants have completed the survey
					</li>
					{#if workplaceDNA()}
						<li>
							<strong>Cultural Profile:</strong> Your team shows strongest alignment with
							<span class="text-cyan-400">{workplaceDNA().dominant}</span> values
						</li>
					{/if}
					{#if generationStats().length > 0}
						<li>
							<strong>Generational Diversity:</strong>
							{generationStats().length} different generations represented, with {generationStats()[0]
								.generation} being the most common
						</li>
					{/if}
				</ul>
			</div>
		</div>
	{/if}

	<!-- Recommendations with Typography -->
	<div class="card-elevated p-8">
		<div class="prose prose-workplace max-w-none">
			<h3>Recommendations</h3>

			{#if workplaceDNA()}
				{#if workplaceDNA().collaboration > 70}
					<div class="card-international mb-4">
						<h4>High Collaboration Culture</h4>
						<p>Your team values teamwork and open communication. Consider:</p>
						<ul>
							<li>Open office layouts with collaboration zones</li>
							<li>Regular team-building activities</li>
							<li>Shared project spaces and tools</li>
						</ul>
					</div>
				{/if}

				{#if workplaceDNA().technology > 70}
					<div class="card-international mb-4">
						<h4>Tech-Forward Environment</h4>
						<p>Your team embraces digital transformation. Focus on:</p>
						<ul>
							<li>Latest collaboration tools and platforms</li>
							<li>Digital-first processes</li>
							<li>Continuous learning programs for new technologies</li>
						</ul>
					</div>
				{/if}

				{#if workplaceDNA().wellness > 70}
					<div class="card-international mb-4">
						<h4>Wellness-Oriented Workplace</h4>
						<p>Your team prioritizes work-life balance. Implement:</p>
						<ul>
							<li>Flexible working arrangements</li>
							<li>Wellness programs and mental health support</li>
							<li>Ergonomic workspaces and quiet zones</li>
						</ul>
					</div>
				{/if}
			{/if}
		</div>
	</div>
</div>

<style>
	.dna-trait {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.lead {
		font-size: 1.125rem;
		color: rgb(148 163 184);
		margin-bottom: 1.5rem;
	}
</style>
