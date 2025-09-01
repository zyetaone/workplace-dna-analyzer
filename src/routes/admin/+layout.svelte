<script lang="ts">
	// Authentication is handled centrally in hooks.ts
	let { children } = $props();
</script>

<!-- Glass Container Wrapper for Admin Section -->
<div class="h-screen overflow-hidden p-4 md:p-6 lg:p-8">
	<!-- Glass Container with Margins - Fixed Height -->
	<div class="mx-auto h-full max-w-[1600px]">
		<div
			class="flex h-full flex-col overflow-hidden rounded-2xl border-2 border-slate-700/50 bg-slate-900/50 shadow-2xl backdrop-blur-2xl"
		>
			<!-- Glass Header Bar -->
			<div
				class="flex-shrink-0 border-b-2 border-slate-700/50 bg-gradient-to-r from-slate-800/80 to-slate-900/80 px-6 py-4 backdrop-blur-3xl"
			>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<!-- Logo/Icon -->
						<div
							class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 shadow-lg"
						>
							<span class="text-xl font-bold text-white">A</span>
						</div>
						<div>
							<h1 class="text-xl font-bold text-white">Admin Portal</h1>
							<p class="text-xs text-slate-400">Manage your sessions and analytics</p>
						</div>
					</div>

					<!-- Optional Navigation or User Info -->
					<div class="flex items-center gap-4">
						<div class="text-sm text-slate-400">
							<span class="hidden md:inline">Dashboard</span>
						</div>
						<div
							class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-600/50 bg-slate-800/80 backdrop-blur"
						>
							<span class="text-xs font-bold text-slate-300">U</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Main Content Area with Glass Effect - Scrollable -->
			<div class="relative flex-1 overflow-y-auto bg-slate-900/30 backdrop-blur-xl">
				<!-- Subtle Inner Glow Effect -->
				<div
					class="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5"
				></div>

				<!-- Content - Scrollable -->
				<div class="relative z-10">
					{@render children?.()}
				</div>
			</div>

			<!-- Glass Footer Bar - Fixed at Bottom -->
			<div
				class="flex-shrink-0 border-t-2 border-slate-700/50 bg-gradient-to-r from-slate-800/60 to-slate-900/60 px-6 py-3 backdrop-blur-2xl"
			>
				<div class="flex items-center justify-between text-xs text-slate-500">
					<div class="flex items-center gap-2">
						<span class="h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
						<span>System Online</span>
					</div>
					<div class="flex items-center gap-4">
						<span>© 2024 Zyeta DX</span>
						<span class="hidden md:inline">•</span>
						<span class="hidden md:inline">Version 2.0</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Floating Glass Orbs for Decoration -->
	<div
		class="pointer-events-none fixed left-10 top-20 h-32 w-32 animate-pulse rounded-full bg-gradient-to-br from-cyan-500/10 to-blue-500/10 blur-3xl"
	></div>
	<div
		class="pointer-events-none fixed bottom-20 right-10 h-40 w-40 animate-pulse rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-3xl"
		style="animation-delay: 2s;"
	></div>
</div>

<style></style>
