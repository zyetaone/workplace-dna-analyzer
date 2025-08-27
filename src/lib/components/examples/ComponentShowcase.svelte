<!-- 
	ComponentShowcase.svelte
	Example component demonstrating all improved patterns:
	- Children pattern usage
	- HOC wrappers
	- TypeScript interfaces
	- Attachment patterns
	- Component composition
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import PageWrapper from '../layouts/PageWrapper.svelte';
	import DashboardLayout from '../layouts/DashboardLayout.svelte';
	import CardLayout from '../layouts/CardLayout.svelte';
	import GridLayout from '../layouts/GridLayout.svelte';
	import WithLoading from '../hoc/WithLoading.svelte';
	import WithAuth from '../hoc/WithAuth.svelte';
	import AnimateOnScroll from '../behaviors/AnimateOnScroll.svelte';
	import Draggable from '../behaviors/Draggable.svelte';
	import Modal from '../ui/Modal.svelte';
	import FormField from '../forms/FormField.svelte';
	import Input from '../forms/Input.svelte';
	import Button from '../forms/Button.svelte';
	import LoadingScreen from '../LoadingScreen.svelte';
	import ErrorScreen from '../ErrorScreen.svelte';
	import Chart from '../charts/Chart.svelte';
	import type { ChartConfiguration } from 'chart.js';
	
	// Example state
	let isLoading = $state(false);
	let hasError = $state(false);
	let modalOpen = $state(false);
	let formValue = $state('');
	let formError = $state<string | null>(null);
	
	// Example user for auth
	const mockUser = { id: '1', name: 'John Doe', roles: ['admin'] };
	
	// Example chart config
	const chartConfig: ChartConfiguration = {
		type: 'bar',
		data: {
			labels: ['Jan', 'Feb', 'Mar', 'Apr'],
			datasets: [{
				label: 'Sales',
				data: [12, 19, 3, 5],
				backgroundColor: 'rgba(75, 192, 192, 0.2)',
				borderColor: 'rgba(75, 192, 192, 1)',
				borderWidth: 1
			}]
		},
		options: {
			responsive: true,
			plugins: {
				legend: {
					position: 'top',
				},
				title: {
					display: true,
					text: 'Monthly Sales'
				}
			}
		}
	};
	
	// Example functions
	function handleSubmit() {
		if (!formValue.trim()) {
			formError = 'This field is required';
			return;
		}
		formError = null;
		console.log('Form submitted:', formValue);
		modalOpen = false;
	}
	
	function simulateLoading() {
		isLoading = true;
		setTimeout(() => {
			isLoading = false;
		}, 2000);
	}
	
	function simulateError() {
		hasError = true;
		setTimeout(() => {
			hasError = false;
		}, 3000);
	}
</script>

{#snippet sidebar()}
	<nav class="space-y-2">
		<a href="#layouts" class="block px-3 py-2 rounded hover:bg-gray-100">Layouts</a>
		<a href="#hoc" class="block px-3 py-2 rounded hover:bg-gray-100">HOC Patterns</a>
		<a href="#behaviors" class="block px-3 py-2 rounded hover:bg-gray-100">Behaviors</a>
		<a href="#forms" class="block px-3 py-2 rounded hover:bg-gray-100">Forms</a>
		<a href="#charts" class="block px-3 py-2 rounded hover:bg-gray-100">Charts</a>
	</nav>
{/snippet}

{#snippet footer()}
	<div class="px-6 py-4 text-center text-sm text-gray-600">
		Component Showcase - Demonstrating Modern Svelte 5 Patterns
	</div>
{/snippet}

<PageWrapper variant="dashboard" background="gray">
	<DashboardLayout
		title="Component Architecture Showcase"
		subtitle="Demonstrating improved composition and patterns"
		{sidebar}
		{footer}
		showBreadcrumbs={true}
		breadcrumbs={[
			{ label: 'Home', href: '/' },
			{ label: 'Components', href: '/components' },
			{ label: 'Showcase' }
		]}
	>
		<!-- Section: Layout Components -->
		<section id="layouts" class="mb-12">
			<h2 class="text-2xl font-bold mb-6">Layout Components</h2>
			
			<GridLayout cols={{ default: 1, md: 2, lg: 3 }} gap="lg">
				<AnimateOnScroll animation="fade" duration={500}>
					<CardLayout
						title="Card with Header"
						subtitle="Using CardLayout component"
						variant="elevated"
					>
						<p class="text-gray-600">
							This card demonstrates the CardLayout component with title and subtitle props.
						</p>
					</CardLayout>
				</AnimateOnScroll>
				
				<AnimateOnScroll animation="slide" duration={500} delay={100}>
					<CardLayout variant="bordered">
						{#snippet header()}
							<div class="flex justify-between items-center">
								<h3 class="font-semibold">Custom Header</h3>
								<span class="text-sm text-gray-500">Status: Active</span>
							</div>
						{/snippet}
						
						<p class="text-gray-600">
							This card uses a custom header snippet for more control.
						</p>
						
						{#snippet footer()}
							<div class="flex justify-end gap-2">
								<Button variant="ghost" size="sm">Cancel</Button>
								<Button variant="primary" size="sm">Save</Button>
							</div>
						{/snippet}
					</CardLayout>
				</AnimateOnScroll>
				
				<AnimateOnScroll animation="scale" duration={500} delay={200}>
					<Draggable constraint="parent">
						<CardLayout variant="default" class="cursor-move">
							<div class="text-center">
								<p class="text-gray-600 mb-2">Draggable Card</p>
								<p class="text-sm text-gray-500">Try dragging me!</p>
							</div>
						</CardLayout>
					</Draggable>
				</AnimateOnScroll>
			</GridLayout>
		</section>
		
		<!-- Section: HOC Patterns -->
		<section id="hoc" class="mb-12">
			<h2 class="text-2xl font-bold mb-6">Higher Order Components</h2>
			
			<div class="grid gap-6">
				<CardLayout title="Loading States">
					<div class="space-y-4">
						<Button onclick={simulateLoading} variant="primary">
							Simulate Loading
						</Button>
						
						<WithLoading loading={isLoading} loadingMessage="Fetching data...">
							<p class="text-gray-600">
								This content is wrapped with WithLoading HOC. Click the button to see the loading state.
							</p>
						</WithLoading>
						
						<WithLoading loading={isLoading} showSkeleton={true} skeletonLines={4}>
							<p>This shows skeleton loading instead of spinner.</p>
						</WithLoading>
					</div>
				</CardLayout>
				
				<CardLayout title="Error Handling">
					<div class="space-y-4">
						<Button onclick={simulateError} variant="danger">
							Simulate Error
						</Button>
						
						{#if hasError}
							<ErrorScreen
								variant="inline"
								severity="error"
								title="Something went wrong"
								message="This is an example error message."
								onRetry={() => hasError = false}
								onDismiss={() => hasError = false}
							/>
						{:else}
							<p class="text-gray-600">
								Click the button to see error handling.
							</p>
						{/if}
					</div>
				</CardLayout>
				
				<CardLayout title="Authentication Wrapper">
					<WithAuth user={mockUser} requireRole="admin">
						<p class="text-green-600">
							You are authenticated as an admin! This content is protected.
						</p>
					</WithAuth>
					
					<WithAuth user={null} requireAuth={true} showUnauthorized={true}>
						<p>This content won't show without authentication.</p>
					</WithAuth>
				</CardLayout>
			</div>
		</section>
		
		<!-- Section: Behaviors -->
		<section id="behaviors" class="mb-12">
			<h2 class="text-2xl font-bold mb-6">Attachment Pattern Behaviors</h2>
			
			<GridLayout cols={{ default: 1, md: 2 }} gap="lg">
				<AnimateOnScroll animation="fade" once={false}>
					<CardLayout title="Scroll Animation">
						<p class="text-gray-600">
							This card fades in when scrolled into view. Scroll away and back to see it animate again!
						</p>
					</CardLayout>
				</AnimateOnScroll>
				
				<AnimateOnScroll animation="rotate" duration={700}>
					<CardLayout title="Rotation Animation">
						<p class="text-gray-600">
							This card rotates in when scrolled into view.
						</p>
					</CardLayout>
				</AnimateOnScroll>
			</GridLayout>
		</section>
		
		<!-- Section: Forms -->
		<section id="forms" class="mb-12">
			<h2 class="text-2xl font-bold mb-6">Form Components</h2>
			
			<CardLayout title="Form Example" variant="bordered">
				<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
					<FormField
						label="Email Address"
						name="email"
						required={true}
						error={formError}
						help="We'll never share your email."
					>
						<Input
							type="email"
							bind:value={formValue}
							placeholder="Enter your email"
							error={!!formError}
							leftIcon="✉️"
						/>
					</FormField>
					
					<div class="flex gap-3">
						<Button type="submit" variant="primary">
							Submit
						</Button>
						<Button 
							type="button" 
							variant="secondary"
							onclick={() => modalOpen = true}
						>
							Open Modal
						</Button>
					</div>
				</form>
			</CardLayout>
		</section>
		
		<!-- Section: Charts -->
		<section id="charts" class="mb-12">
			<h2 class="text-2xl font-bold mb-6">Enhanced Chart Component</h2>
			
			<CardLayout title="Sales Chart">
				<Chart
					config={chartConfig}
					height="400px"
					onChartCreated={(chart) => console.log('Chart created:', chart)}
					animateOnUpdate={true}
				/>
			</CardLayout>
		</section>
		
		<!-- Modal Example -->
		<Modal
			bind:open={modalOpen}
			title="Example Modal"
			size="md"
			closeOnEscape={true}
			closeOnOutsideClick={true}
		>
			<p class="text-gray-600 mb-4">
				This is a modal dialog demonstrating the Modal component with focus trap and keyboard navigation.
			</p>
			<FormField label="Modal Input" name="modalInput">
				<Input
					type="text"
					placeholder="Try tabbing through the modal"
				/>
			</FormField>
			
			{#snippet footer()}
				<Button variant="ghost" onclick={() => modalOpen = false}>
					Cancel
				</Button>
				<Button variant="primary" onclick={() => modalOpen = false}>
					Confirm
				</Button>
			{/snippet}
		</Modal>
	</DashboardLayout>
</PageWrapper>

<style>
	/* Component-specific styles if needed */
	:global(.animated-gradient) {
		background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
		background-size: 400% 400%;
		animation: gradient 15s ease infinite;
	}
	
	@keyframes gradient {
		0% { background-position: 0% 50%; }
		50% { background-position: 100% 50%; }
		100% { background-position: 0% 50%; }
	}
</style>