<script lang="ts">
	interface Props {
		url: string;
		size?: number;
		class?: string;
	}
	
	let { url, size = 256, class: className = '' }: Props = $props();
	let qrCodeGenerated = $state(false);
	
	// QR Code attachment function
	function qrCodeAttachment(canvas: HTMLCanvasElement) {
		let QRCodeLib: any = null;
		
		// Load QRCode library and generate code
		async function generateQR() {
			qrCodeGenerated = false;
			
			try {
				if (!QRCodeLib) {
					const module = await import('qrcode');
					QRCodeLib = module.default;
				}
				
				await QRCodeLib.toCanvas(canvas, url, {
					width: size,
					margin: 2,
					color: {
						dark: '#000000',
						light: '#FFFFFF'
					}
				});
				
				qrCodeGenerated = true;
			} catch (err) {
				if (import.meta.env.DEV) {
					console.error('Failed to generate QR code:', err);
				}
			}
		}
		
		// Initial generation
		generateQR();
		
		// Watch for url/size changes
		$effect(() => {
			generateQR();
		});
		
		// Return cleanup function
		return () => {
			// Cleanup if needed
		};
	}
</script>

<div class="qr-code-container {className}">
	<canvas {@attach qrCodeAttachment} width={size} height={size}></canvas>
	{#if !qrCodeGenerated}
		<div class="qr-placeholder" style="width: {size}px; height: {size}px;">
			<p>Loading QR Code...</p>
		</div>
	{/if}
</div>

<style>
	.qr-code-container {
		display: inline-block;
		background: white;
		padding: 1rem;
		border-radius: 0.5rem;
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
	}
	
	.qr-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f3f4f6;
		border-radius: 0.25rem;
		color: #6b7280;
		font-size: 0.875rem;
	}
	
	canvas {
		display: block;
	}
</style>