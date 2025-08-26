<script lang="ts">
	import { qrCode } from '$lib/attachments';
	
	interface Props {
		url: string;
		size?: number;
		class?: string;
	}
	
	let { url, size = 256, class: className = '' }: Props = $props();
	let canvas: HTMLCanvasElement;
	let qrCodeGenerated = $state(false);
	
	$effect(() => {
		if (!canvas) return;
		
		qrCodeGenerated = false;
		
		import('qrcode').then(({ default: QRCode }) => {
			QRCode.toCanvas(canvas, url, {
				width: size,
				margin: 2,
				color: {
					dark: '#000000',
					light: '#FFFFFF'
				}
			}).then(() => {
				qrCodeGenerated = true;
			}).catch((err) => {
				console.error('Failed to generate QR code:', err);
			});
		});
	});
</script>

<div class="qr-code-container {className}">
	<canvas bind:this={canvas} width={size} height={size}></canvas>
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