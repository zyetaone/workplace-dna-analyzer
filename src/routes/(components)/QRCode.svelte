<!-- Simple QR Code Component -->
<script lang="ts">
	interface Props {
		url: string;
		size?: number;
		class?: string;
		sessionCode?: string;
	}

	let {
		url,
		size = 256,
		class: className = '',
		sessionCode = ''
	}: Props = $props();

	let copied = $state(false);

	// Generate QR code URL using qr-server.com API (free, no library needed)
	const qrCodeUrl = $derived(
		`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`
	);

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(url);
			copied = true;
			setTimeout(() => copied = false, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}
</script>

<div class="qr-code-container {className}">
	<div class="qr-wrapper">
		{#if sessionCode}
			<div class="session-code-badge">
				<span class="text-sm font-semibold text-slate-600">Session Code</span>
				<span class="text-lg font-bold text-blue-600">{sessionCode}</span>
			</div>
		{/if}
		<img
			src={qrCodeUrl}
			alt="QR Code for {url}"
			width={size}
			height={size}
			class="qr-image"
			loading="lazy"
		/>
		<div class="qr-label">
			<p class="text-xs text-slate-500 mt-2">Scan to join session</p>
			<div class="flex items-center gap-2 mt-1">
				<a 
					href={url} 
					target="_blank" 
					rel="noopener noreferrer"
					class="text-xs text-blue-500 hover:text-blue-700 font-mono break-all underline transition-colors flex-1"
				>
					{url}
				</a>
				<button
					onclick={copyToClipboard}
					class="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors flex items-center gap-1"
					title="Copy link"
				>
					{#if copied}
						<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
						Copied!
					{:else}
						<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
						</svg>
						Copy
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.qr-code-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1rem;
		background: white;
		border-radius: 0.75rem;
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
	}

	.qr-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.qr-image {
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		background: white;
	}

	.qr-label {
		text-align: center;
		max-width: 100%;
	}

	.session-code-badge {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.5rem 1rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-radius: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.session-code-badge span:first-child {
		color: rgba(255, 255, 255, 0.9);
	}

	.session-code-badge span:last-child {
		color: white;
	}
</style>