<!-- Enhanced QR Code Component with {@attach...} and Reactive $state -->
<script lang="ts">
	import { tick } from 'svelte';

	interface Props {
		url: string;
		size?: number;
		class?: string;
		showDownload?: boolean;
		retryAttempts?: number;
		accessibilityLabel?: string;
	}

	let {
		url,
		size = 256,
		class: className = '',
		showDownload = false,
		retryAttempts = 3,
		accessibilityLabel = 'QR Code for session access'
	}: Props = $props();

	// Enhanced state management with Svelte 5 runes
	let qrCodeGenerated = $state(false);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let retryCount = $state(0);
	let isDownloading = $state(false);

	// Reactive data for attachment
	let qrData = $state({
		url,
		size,
		showDownload,
		retryAttempts,
		accessibilityLabel
	});

	// Update reactive data when props change
	$effect(() => {
		qrData.url = url;
		qrData.size = size;
		qrData.showDownload = showDownload;
		qrData.retryAttempts = retryAttempts;
		qrData.accessibilityLabel = accessibilityLabel;
	});

	// Enhanced QR code generation with modern qr library and {@attach...}
	function qrCodeAttachment(canvas: HTMLCanvasElement) {
		let QRCodeLib: any = null;
		let isGenerating = false;

		// Enhanced QR code generation function
		async function generateQRCode() {
			if (!canvas || !url || isGenerating) return;

			isGenerating = true;
			isLoading = true;
			error = null;
			qrCodeGenerated = false;

			try {
				// Load modern QR library with error handling
				if (!QRCodeLib) {
					try {
						const module = await import('qr');
						QRCodeLib = module;
					} catch (importError) {
						throw new Error('Failed to load QR code library');
					}
				}

				// Clear canvas before generating
				const ctx = canvas.getContext('2d');
				if (ctx) {
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					ctx.fillStyle = '#FFFFFF';
					ctx.fillRect(0, 0, size, size);
				}

				// Generate QR code using modern library
				const qr = QRCodeLib.create(url, {
					errorCorrectionLevel: 'M', // Medium error correction
					margin: 2,
					scale: Math.max(1, Math.floor(size / 25)) // Scale based on size
				});

				// Draw QR code on canvas
				const cellSize = size / qr.size;
				const margin = 2;

				if (ctx) {
					// Fill background
					ctx.fillStyle = '#FFFFFF';
					ctx.fillRect(0, 0, size, size);

					// Draw QR code modules
					ctx.fillStyle = '#000000';
					for (let y = 0; y < qr.size; y++) {
						for (let x = 0; x < qr.size; x++) {
							if (qr.get(x, y)) {
								const pixelX = margin + x * cellSize;
								const pixelY = margin + y * cellSize;
								ctx.fillRect(pixelX, pixelY, cellSize, cellSize);
							}
						}
					}
				}

				qrCodeGenerated = true;
				retryCount = 0; // Reset retry count on success

			} catch (err) {
				console.error('QR Code generation failed:', err);

				// Retry mechanism
				if (retryCount < retryAttempts) {
					retryCount++;
					console.log(`Retrying QR code generation (attempt ${retryCount}/${retryAttempts})`);

					// Exponential backoff
					const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
					setTimeout(() => generateQRCode(), delay);
					return;
				}

				// Final failure
				error = err instanceof Error ? err.message : 'Failed to generate QR code';
			} finally {
				isLoading = false;
				isGenerating = false;
			}
		}

		// Initial generation
		generateQRCode();

		// Watch for url/size changes and regenerate
		$effect(() => {
			url; // Track URL changes
			size; // Track size changes
			if (url && size) {
				generateQRCode();
			}
		});

		// Return cleanup function
		return () => {
			// Cleanup if needed
			isGenerating = false;
		};
	}

	// Download functionality
	async function downloadQRCode(canvas: HTMLCanvasElement) {
		if (!canvas || !qrCodeGenerated) return;

		isDownloading = true;
		try {
			const link = document.createElement('a');
			link.download = `session-qr-${Date.now()}.png`;
			link.href = canvas.toDataURL('image/png');
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (err) {
			console.error('Download failed:', err);
		} finally {
			isDownloading = false;
		}
	}

	// Keyboard navigation
	function handleKeydown(event: KeyboardEvent, canvas: HTMLCanvasElement) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			if (showDownload && qrCodeGenerated) {
				downloadQRCode(canvas);
			}
		}
	}
</script>

<div class="enhanced-qr-container {className}" role="region" aria-label={accessibilityLabel}>
	<!-- Loading State -->
	{#if isLoading}
		<div
			class="qr-loading"
			style="width: {size}px; height: {size}px;"
			role="status"
			aria-live="polite"
			aria-label="Generating QR code"
		>
			<div class="loading-spinner"></div>
			<p class="loading-text">Generating QR Code...</p>
			{#if retryCount > 0}
				<p class="retry-text">Retry attempt {retryCount}/{retryAttempts}</p>
			{/if}
		</div>
	{/if}

	<!-- Error State -->
	{#if error && !isLoading}
		<div
			class="qr-error"
			style="width: {size}px; height: {size}px;"
			role="alert"
			aria-live="assertive"
		>
			<div class="error-icon">⚠️</div>
			<p class="error-text">{error}</p>
			<button
				type="button"
				class="retry-button"
				onclick={() => {
					// Trigger regeneration by updating a reactive dependency
					retryCount = 0;
					isLoading = true;
					error = null;
				}}
				aria-label="Retry generating QR code"
			>
				Retry
			</button>
		</div>
	{/if}

	<!-- QR Code Canvas with {@attach...} -->
	{#if !isLoading && !error}
		<div class="qr-canvas-container">
			<canvas
				{@attach qrCodeAttachment}
				width={size}
				height={size}
				class="qr-canvas"
				role="img"
				aria-label="{accessibilityLabel} - {qrCodeGenerated ? 'Generated successfully' : 'Generating'}"
				tabindex={showDownload ? 0 : -1}
				onkeydown={(e) => handleKeydown(e, e.currentTarget as HTMLCanvasElement)}
			></canvas>

			<!-- Download Button -->
			{#if showDownload && qrCodeGenerated}
				<button
					type="button"
					class="download-button"
					onclick={(e) => {
						const canvas = e.currentTarget.previousElementSibling as HTMLCanvasElement;
						downloadQRCode(canvas);
					}}
					disabled={isDownloading}
					aria-label="Download QR code as PNG image"
				>
					{#if isDownloading}
						<div class="download-spinner"></div>
						<span>Downloading...</span>
					{:else}
						<span>📥 Download</span>
					{/if}
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.enhanced-qr-container {
		display: inline-block;
		position: relative;
	}

	.qr-loading, .qr-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
		border: 2px dashed #e5e7eb;
		text-align: center;
		padding: 1rem;
	}

	.loading-spinner {
		width: 2rem;
		height: 2rem;
		border: 3px solid #e5e7eb;
		border-top: 3px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 0.5rem;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.loading-text, .error-text, .retry-text {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0.25rem 0;
	}

	.error-icon {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	.retry-button {
		margin-top: 0.5rem;
		padding: 0.375rem 0.75rem;
		background: #3b82f6;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.retry-button:hover {
		background: #2563eb;
	}

	.qr-canvas-container {
		position: relative;
		display: inline-block;
	}

	.qr-canvas {
		display: block;
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
		transition: box-shadow 0.2s;
	}

	.qr-canvas.focused {
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
	}

	.download-button {
		position: absolute;
		bottom: -2.5rem;
		left: 50%;
		transform: translateX(-50%);
		padding: 0.375rem 0.75rem;
		background: #10b981;
		color: white;
		border: none;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		white-space: nowrap;
	}

	.download-button:hover:not(:disabled) {
		background: #059669;
		transform: translateX(-50%) translateY(-1px);
	}

	.download-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.download-spinner {
		width: 0.75rem;
		height: 0.75rem;
		border: 2px solid #ffffff;
		border-top: 2px solid transparent;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	/* Focus management for accessibility */
	.qr-canvas:focus {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	/* High contrast mode support */
	@media (prefers-contrast: high) {
		.qr-loading, .qr-error {
			border: 2px solid #000000;
		}

		.retry-button {
			border: 2px solid #000000;
		}

		.qr-canvas {
			border: 2px solid #000000;
		}
	}

	/* Reduced motion support */
	@media (prefers-reduced-motion: reduce) {
		.loading-spinner, .download-spinner {
			animation: none;
		}

		.retry-button, .download-button {
			transition: none;
		}

		.qr-canvas {
			transition: none;
		}
	}
</style>