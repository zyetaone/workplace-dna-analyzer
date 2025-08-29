<script lang="ts">
	// Authentication is handled centrally in hooks.ts
	let { children } = $props();
</script>



<!-- Glass Container Wrapper for Admin Section -->
<div class="h-screen p-4 md:p-6 lg:p-8 overflow-hidden">
	<!-- Glass Container with Margins - Fixed Height -->
	<div class="max-w-[1600px] mx-auto h-full">
		<div class="bg-slate-900/50 backdrop-blur-2xl rounded-2xl border-2 border-slate-700/50 shadow-2xl h-full flex flex-col overflow-hidden">
			<!-- Glass Header Bar -->
			<div class="bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-3xl border-b-2 border-slate-700/50 px-6 py-4 flex-shrink-0">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<!-- Logo/Icon -->
						<div class="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
							<span class="text-white font-bold text-xl">A</span>
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
						<div class="w-8 h-8 bg-slate-800/80 backdrop-blur rounded-full border border-slate-600/50 flex items-center justify-center">
							<span class="text-slate-300 text-xs font-bold">U</span>
						</div>
					</div>
				</div>
			</div>
			
			<!-- Main Content Area with Glass Effect - Scrollable -->
			<div class="bg-slate-900/30 backdrop-blur-xl flex-1 overflow-y-auto relative">
				<!-- Subtle Inner Glow Effect -->
				<div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
				
				<!-- Content - Scrollable -->
				<div class="relative z-10">
					{@render children?.()}
				</div>
			</div>
			
			<!-- Glass Footer Bar - Fixed at Bottom -->
			<div class="bg-gradient-to-r from-slate-800/60 to-slate-900/60 backdrop-blur-2xl border-t-2 border-slate-700/50 px-6 py-3 flex-shrink-0">
				<div class="flex items-center justify-between text-xs text-slate-500">
					<div class="flex items-center gap-2">
						<span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
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
	<div class="fixed top-20 left-10 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
	<div class="fixed bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style="animation-delay: 2s;"></div>
</div>