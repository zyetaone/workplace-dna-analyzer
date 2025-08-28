<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	interface Props {
		url: string;
		size?: number;
		class?: string;
		sessionName?: string;
		participantCount?: number;
	}

	let {
		url,
		size = 256,
		class: className = '',
		sessionName = '',
		participantCount = 0
	}: Props = $props();

	let qrCodeGenerated = $state(false);
	let error = $state<string | null>(null);
	let isHovered = $state(false);
	let containerRef: HTMLElement;

	let canvasElement = $state<HTMLCanvasElement | null>(null);
	let QRCodeLib: any = null;

	// Responsive sizing based on container
	let containerSize = $state(size);

	$effect(() => {
		if (containerRef) {
			const updateSize = () => {
				const rect = containerRef.getBoundingClientRect();
				const minDimension = Math.min(rect.width, rect.height);
				containerSize = Math.min(minDimension * 0.8, 384); // Max 384px for large screens
			};

			updateSize();
			const resizeObserver = new ResizeObserver(updateSize);
			resizeObserver.observe(containerRef);
			return () => resizeObserver.disconnect();
		}
	});

	// Function to generate QR code
	async function generateQR() {
		if (!canvasElement || !url) return;

		qrCodeGenerated = false;
		error = null;

		try {
			// Dynamically import QRCode library if not loaded
			if (!QRCodeLib) {
				const module = await import('qrcode');
				QRCodeLib = module.default;
			}

			// Generate QR code on canvas
			await QRCodeLib.toCanvas(canvasElement, url, {
				width: containerSize,
				margin: 2,
				color: {
					dark: '#000000',
					light: '#FFFFFF'
				}
			});

			qrCodeGenerated = true;
		} catch (err) {
			console.error('Failed to generate QR code:', err);
			error = err instanceof Error ? err.message : 'Failed to generate QR code';
			qrCodeGenerated = false;
		}
	}

	// Generate QR code when canvas is available or when URL changes
	$effect(() => {
		if (canvasElement && url) {
			generateQR();
		}
	});
</script>

<div
	bind:this={containerRef}
	class="qr-hero-container {className}"
	onmouseenter={() => isHovered = true}
	onmouseleave={() => isHovered = false}
	role="img"
	aria-label="QR Code for session access"
>
	<!-- QR Code Card -->
	<div
		class="qr-card bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
		in:scale={{ duration: 500, easing: quintOut }}
	>
		<!-- Header with Session Info -->
		{#if sessionName}
			<div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
				<h2 class="text-xl font-bold text-center">{sessionName}</h2>
				{#if participantCount > 0}
					<div class="flex items-center justify-center gap-2 mt-2">
						<div class="live-pulse-enhanced"></div>
						<span class="text-sm font-medium">
							{participantCount} participant{participantCount !== 1 ? 's' : ''} joined
						</span>
					</div>
				{/if}
			</div>
		{/if}

		<!-- QR Code Content -->
		<div class="p-6 flex flex-col items-center">
			{#if error}
				<div
					class="qr-error flex flex-col items-center justify-center text-center"
					style="width: {containerSize}px; height: {containerSize}px;"
					in:fade={{ duration: 300 }}
				>
					<div class="text-4xl mb-2">⚠️</div>
					<p class="text-red-600 font-medium">QR Code Error</p>
					<small class="text-gray-500 text-xs mt-1">{error}</small>
				</div>
			{:else if !qrCodeGenerated}
				<div
					class="qr-placeholder flex flex-col items-center justify-center text-center"
					style="width: {containerSize}px; height: {containerSize}px;"
					in:fade={{ duration: 300 }}
				>
					<div class="loading-spinner w-8 h-8 border-3 border-gray-300 border-t-blue-600 mx-auto"></div>
					<p class="text-gray-600 font-medium mt-3">Generating QR Code...</p>
				</div>
			{:else}
				<div
					class="qr-code-wrapper relative"
					in:scale={{ duration: 600, delay: 200, easing: quintOut }}
				>
					<canvas
						bind:this={canvasElement}
						width={containerSize}
						height={containerSize}
						class="qr-canvas rounded-lg shadow-sm border border-gray-100"
						style="display: {qrCodeGenerated && !error ? 'block' : 'none'}"
					></canvas>

					<!-- Hover overlay with instructions -->
					{#if isHovered}
						<div
							class="qr-overlay absolute inset-0 bg-black/10 rounded-lg flex items-center justify-center"
							in:fade={{ duration: 200 }}
						>
							<div class="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
								<p class="text-sm font-medium text-gray-800">📱 Scan to join</p>
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Instructions -->
			{#if qrCodeGenerated && !error}
				<div
					class="qr-instructions mt-4 text-center max-w-xs"
					in:fade={{ duration: 400, delay: 400 }}
				>
					<p class="text-sm text-gray-600">
						Scan this QR code with your phone to join the session and start the workplace preference quiz.
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.qr-hero-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 60vh;
		padding: 2rem;
	}

	.qr-card {
		max-width: 500px;
		width: 100%;
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
		            box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.qr-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.15);
	}

	.qr-code-wrapper {
		position: relative;
		display: inline-block;
	}

	.qr-canvas {
		transition: transform 0.2s ease;
	}

	.qr-card:hover .qr-canvas {
		transform: scale(1.02);
	}

	.qr-placeholder, .qr-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: #f3f4f6;
		border-radius: 0.5rem;
		color: #6b7280;
		font-size: 0.875rem;
		gap: 1rem;
		padding: 2rem;
		border: 2px dashed #d1d5db;
	}

	.qr-error {
		background: #fee2e2;
		color: #991b1b;
		border-color: #fca5a5;
	}

	.qr-error small {
		color: #7f1d1d;
		text-align: center;
	}

	.loading-spinner {
		border: 3px solid #e5e7eb;
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.qr-overlay {
		transition: opacity 0.2s ease;
	}

	.live-pulse-enhanced {
		position: relative;
	}

	.live-pulse-enhanced::before {
		content: '';
		position: absolute;
		left: -12px;
		top: 50%;
		transform: translateY(-50%);
		width: 6px;
		height: 6px;
		background: linear-gradient(45deg, #ef4444, #f97316);
		border-radius: 50%;
		animation: live-pulse-enhanced 1.5s ease-in-out infinite;
	}

	@keyframes live-pulse-enhanced {
		0%, 100% {
			transform: translateY(-50%) scale(1);
			opacity: 1;
		}
		50% {
			transform: translateY(-50%) scale(1.3);
			opacity: 0.7;
		}
	}

	@media (max-width: 640px) {
		.qr-hero-container {
			padding: 1rem;
			min-height: 50vh;
		}

		.qr-card {
			max-width: 100%;
		}
	}
</style>