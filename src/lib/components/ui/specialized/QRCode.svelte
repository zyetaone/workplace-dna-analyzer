<!--
  UNIFIED QR Code Component with multiple generation methods
-->
<script lang="ts">
	import QR from 'qr';

	interface Props {
		url: string;
		size?: number;
		sessionCode?: string;
		method?: 'api' | 'library';
		showCopy?: boolean;
		class?: string;
	}

	let {
		url,
		size = 200,
		sessionCode,
		method = 'library',
		showCopy = false,
		class: className = ''
	}: Props = $props();

	let copied = $state(false);

	// Generate QR data using selected method with explicit types
	let qrUrl = $state<string | null>(null);
	let qrSvg = $state<string | null>(null);

	$effect(() => {
		if (method === 'api') {
			qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
			qrSvg = null;
		} else {
			try {
				const code = (QR as any)(url);
				qrSvg = String(code);
				qrUrl = null;
			} catch (error) {
				console.error('Failed to generate QR code:', error);
				qrSvg = null;
				qrUrl = null;
			}
		}
	});

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(url);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}
</script>

{#if method === 'api' ? qrUrl : qrSvg}
	<div class="qr-code-container {className}">
		<div class="qr-wrapper">
			{#if sessionCode}
				<div class="session-code-badge">
					<span class="text-sm font-semibold text-slate-600">Session Code</span>
					<span class="text-lg font-bold text-blue-600">{sessionCode}</span>
				</div>
			{/if}

			{#if method === 'api'}
				<!-- API method: Use img tag -->
				<img
					src={qrUrl!}
					alt="QR Code for {url}"
					width={size}
					height={size}
					class="qr-image"
					loading="lazy"
				/>
			{:else}
				<!-- Library method: Use SVG -->
				<div
					class="rounded-xl border-2 border-gray-200 bg-white p-4 shadow-sm"
					style="width: {size + 32}px; height: {size + 32}px;"
				>
					<div
						class="flex h-full w-full items-center justify-center"
						style="width: {size}px; height: {size}px;"
					>
						{@html qrSvg}
					</div>
				</div>
			{/if}

			{#if showCopy}
				<div class="qr-label">
					<p class="mt-2 text-xs text-slate-500">Scan to join session</p>
					<div class="mt-1 flex items-center gap-2">
						<a
							href={url}
							target="_blank"
							rel="noopener noreferrer"
							class="flex-1 break-all font-mono text-xs text-blue-500 underline transition-colors hover:text-blue-700"
						>
							{url}
						</a>
						<button
							onclick={copyToClipboard}
							class="flex items-center gap-1 rounded bg-blue-500 px-2 py-1 text-xs text-white transition-colors hover:bg-blue-600"
							title="Copy link"
						>
							{#if copied}
								<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 13l4 4L19 7"
									></path>
								</svg>
								Copied!
							{:else}
								<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
									></path>
								</svg>
								Copy
							{/if}
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div
		class="flex items-center justify-center rounded-xl border-2 border-gray-200 bg-gray-100"
		style="width: {size + 32}px; height: {size + 32}px;"
	>
		<p class="text-sm text-gray-500">Failed to generate QR code</p>
	</div>
{/if}

<style>
	/* Ensure QR code SVG scales properly */
	:global(svg) {
		width: 100% !important;
		height: 100% !important;
	}

	/* Unified QR Code Styles */
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
