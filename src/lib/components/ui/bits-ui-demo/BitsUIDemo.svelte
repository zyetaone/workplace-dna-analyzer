<script lang="ts">
	// Demo of Bits UI Components Integration
	import { Tabs } from '$lib/components/ui/tabs';
	import { Portal } from '$lib/components/ui/portal';

	// Demo state
	let showModal = $state(false);
	let activeTab = $state('overview');

	// Tab configuration
	const tabs = [
		{
			value: 'overview',
			label: 'Overview',
			content: () => html`
				<div class="space-y-4 p-6">
					<h3 class="text-xl font-semibold">Quiz Application Overview</h3>
					<p class="text-gray-600">
						This is a comprehensive workplace preference assessment platform built with SvelteKit.
						The application uses a clean, modular architecture following the quiz component pattern.
					</p>
					<div class="mt-6 grid grid-cols-2 gap-4">
						<div class="rounded-lg bg-blue-50 p-4">
							<h4 class="font-semibold text-blue-900">Activities</h4>
							<p class="text-blue-700">Modular activity system</p>
						</div>
						<div class="rounded-lg bg-green-50 p-4">
							<h4 class="font-semibold text-green-900">Analytics</h4>
							<p class="text-green-700">Real-time insights</p>
						</div>
					</div>
				</div>
			`
		},
		{
			value: 'features',
			label: 'Features',
			content: () => html`
				<div class="space-y-4 p-6">
					<h3 class="text-xl font-semibold">Key Features</h3>
					<ul class="space-y-2">
						<li class="flex items-center space-x-2">
							<span class="h-2 w-2 rounded-full bg-blue-500"></span>
							<span>Workplace preference assessment</span>
						</li>
						<li class="flex items-center space-x-2">
							<span class="h-2 w-2 rounded-full bg-green-500"></span>
							<span>Real-time analytics dashboard</span>
						</li>
						<li class="flex items-center space-x-2">
							<span class="h-2 w-2 rounded-full bg-purple-500"></span>
							<span>Modular activity system</span>
						</li>
						<li class="flex items-center space-x-2">
							<span class="h-2 w-2 rounded-full bg-orange-500"></span>
							<span>Workplace DNA generation</span>
						</li>
					</ul>
				</div>
			`
		},
		{
			value: 'architecture',
			label: 'Architecture',
			content: () => html`
				<div class="space-y-4 p-6">
					<h3 class="text-xl font-semibold">Clean Architecture</h3>
					<div class="rounded-lg bg-gray-50 p-4 font-mono text-sm">
						<div>src/</div>
						<div class="ml-4">├── lib/</div>
						<div class="ml-8">├── components/</div>
						<div class="ml-12">├── ui/ (Bits UI components)</div>
						<div class="ml-12">└── modules/ (Feature modules)</div>
						<div class="ml-8">├── utils/ (Scoring, ID generation)</div>
						<div class="ml-8">└── server/ (Database, schemas)</div>
						<div class="ml-4">└── routes/ (SvelteKit pages)</div>
					</div>
					<p class="mt-4 text-gray-600">
						Following the quiz component pattern with clean separation of concerns, modular
						architecture, and focused single-responsibility components.
					</p>
				</div>
			`
		}
	];

	// Helper function for HTML content
	function html(strings: TemplateStringsArray, ...values: any[]) {
		return () => ({ __html: String.raw(strings, ...values) });
	}
</script>

<div class="mx-auto max-w-4xl space-y-6 p-6">
	<!-- Header -->
	<div class="text-center">
		<h1 class="mb-2 text-3xl font-bold text-gray-900">Bits UI Integration Demo</h1>
		<p class="text-gray-600">Demonstrating Portal and Tabs components in our quiz application</p>
	</div>

	<!-- Demo Controls -->
	<div class="flex justify-center space-x-4">
		<button
			class="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
			onclick={() => (showModal = true)}
		>
			Open Portal Modal
		</button>
		<button
			class="rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
			onclick={() => (activeTab = activeTab === 'overview' ? 'features' : 'overview')}
		>
			Switch Tab
		</button>
	</div>

	<!-- Tabs Demo -->
	<div class="overflow-hidden rounded-lg bg-white shadow-lg">
		<Tabs
			{tabs}
			bind:value={activeTab}
			onValueChange={(value) => console.log('Tab changed to:', value)}
		/>
	</div>

	<!-- Portal Modal -->
	{#if showModal}
		<Portal to="body">
			<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
				<div class="mx-4 w-full max-w-md rounded-lg bg-white shadow-xl">
					<div class="p-6">
						<h3 class="mb-4 text-xl font-semibold">Portal Modal</h3>
						<p class="mb-6 text-gray-600">
							This modal is rendered using the Portal component, which allows it to be positioned
							outside the normal DOM flow for better layering and accessibility.
						</p>
						<div class="flex justify-end space-x-3">
							<button
								class="px-4 py-2 text-gray-600 hover:text-gray-800"
								onclick={() => (showModal = false)}
							>
								Cancel
							</button>
							<button
								class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
								onclick={() => (showModal = false)}
							>
								Close
							</button>
						</div>
					</div>
				</div>
			</div>
		</Portal>
	{/if}
</div>

<style>
	/* Additional styles if needed */
</style>
