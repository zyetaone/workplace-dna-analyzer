<script lang="ts">
	interface Props {
		url: string;
		size?: number;
		class?: string;
	}
	
	let { url, size = 256, class: className = '' }: Props = $props();
	let qrCodeGenerated = $state(false);
	let error = $state<string | null>(null);
	
	// QR Code attachment function using {@attach}
	function qrCodeAttachment(canvas: HTMLCanvasElement) {
		let QRCodeLib: any = null;
		
		// Function to generate QR code
		async function generateQR() {
			qrCodeGenerated = false;
			error = null;
			
			try {
				// Dynamically import QRCode library if not loaded
				if (!QRCodeLib) {
					const module = await import('qrcode');
					QRCodeLib = module.default;
				}
				
				// Generate QR code on canvas
				await QRCodeLib.toCanvas(canvas, url, {
					width: size,
					margin: 2,
					color: {
						dark: '#000000',
						light: '#FFFFFF'
					}
				});
				
				qrCodeGenerated = true;
				console.log('QR Code generated for URL:', url);
			} catch (err) {
				console.error('Failed to generate QR code:', err);
				error = err instanceof Error ? err.message : 'Failed to generate QR code';
				qrCodeGenerated = false;
			}
		}
		
		// Generate QR code immediately
		generateQR();
		
		// Watch for URL changes and regenerate
		const unsubscribe = $effect.root(() => {
			$effect(() => {
				// Only regenerate if URL actually changed
				generateQR();
			});
		});
		
		// Cleanup function
		return () => {
			unsubscribe?.();
		};
	}
</script>

<div class="qr-code-container {className}">
	{#if error}
		<div class="qr-error" style="width: {size}px; height: {size}px;">
			<p>⚠️ Error generating QR code</p>
			<small>{error}</small>
		</div>
	{:else if !qrCodeGenerated}
		<div class="qr-placeholder" style="width: {size}px; height: {size}px;">
			<div class="loading-spinner"></div>
			<p>Generating QR Code...</p>
		</div>
	{/if}
	<canvas 
		{@attach qrCodeAttachment}
		width={size} 
		height={size}
		style="display: {qrCodeGenerated && !error ? 'block' : 'none'}"
	></canvas>
</div>

<style>
	.qr-code-container {
		display: inline-block;
		background: white;
		padding: 1rem;
		border-radius: 0.5rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}
	
	.qr-placeholder, .qr-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: #f3f4f6;
		border-radius: 0.25rem;
		color: #6b7280;
		font-size: 0.875rem;
		gap: 1rem;
		padding: 1rem;
	}
	
	.qr-error {
		background: #fee2e2;
		color: #991b1b;
	}
	
	.qr-error small {
		color: #7f1d1d;
		text-align: center;
	}
	
	.loading-spinner {
		width: 24px;
		height: 24px;
		border: 3px solid #e5e7eb;
		border-top-color: #6b7280;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	
	canvas {
		display: block;
		max-width: 100%;
		height: auto;
	}
</style>