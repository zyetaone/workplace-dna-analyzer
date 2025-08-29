<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  interface Props {
    show?: boolean;
    message?: string;
    variant?: 'fullscreen' | 'modal';
    autoHide?: boolean;
  }

  let {
    show = true,
    message = 'Loading...',
    variant = 'modal',
    autoHide = true
  }: Props = $props();

  let showLoader = $state(show);
  let minimumTimeElapsed = $state(false);

  // React to show prop changes
  $effect(() => {
    showLoader = show;
  });

  // Ensure minimum display time
  onMount(() => {
    // Set minimum display time
    const minDisplayTime = autoHide ? 1000 : 500;
    
    setTimeout(() => {
      minimumTimeElapsed = true;
      if (autoHide) {
        showLoader = false;
      }
    }, minDisplayTime);
  });

  // Only hide if minimum time has elapsed
  $effect(() => {
    if (!show && minimumTimeElapsed && !autoHide) {
      // Add small delay for smooth transition
      setTimeout(() => {
        showLoader = false;
      }, 100);
    }
  });
</script>

{#if showLoader}
	<!-- Glass Effect Background -->
	<div
		id="zyeta-loading-overlay"
		class="fixed inset-0 z-[9999] bg-black {variant === 'modal'
			? 'bg-opacity-80 backdrop-blur-sm'
			: ''}"
		transition:fade={{ duration: 800, easing: quintOut }}
	>
		<!-- Modal Container -->
		<div class="flex items-center justify-center min-h-screen p-4">
			<div
				class="loading-modal max-w-md w-full"
				in:scale={{ duration: 600, opacity: 1, start: 0.85, easing: quintOut }}
				out:scale={{ duration: 800, opacity: 0, start: 0.85, easing: quintOut }}
			>
				<!-- Glass Effect Card -->
				<div
					class="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl"
				>
					<!-- Animated Background Gradient -->
					<div
						class="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse"
					></div>

					<!-- Content Container -->
					<div class="relative z-10 p-8 text-center">
						<!-- Logo Section -->
						<div class="logo-section mb-8">
							<div class="flex items-center justify-center mb-4">
								<svg
									class="zyeta-logo w-20 h-20 animate-pulse drop-shadow-lg"
									style="animation-delay: 0.1s; filter: drop-shadow(0 0 20px rgba(255,255,255,0.3));"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 300 300"
								>
									<rect x="25.04" y="25.04" width="249.93" height="249.93" fill="#ffffff" rx="12" />
									<g>
										<polygon
											fill="#000"
											points="64.6 160.09 60.75 165.55 83.17 165.55 83.17 172.19 52.46 172.19 52.46 165.78 52.62 165.55 56.48 160.09 66.69 145.62 74.57 134.45 52.46 134.45 52.46 127.81 83.17 127.81 83.17 133.78 82.7 134.45 74.82 145.62 64.6 160.09"
										/>
										<polygon
											fill="#000"
											points="205.35 127.81 205.35 134.45 192.76 134.45 192.76 172.19 186.12 172.19 186.12 134.45 173.53 134.45 173.53 127.81 205.35 127.81"
										/>
										<path
											fill="#000"
											d="M244.96,165.55l-2.13-5.47-2.59-6.64-3.05-7.83-4.35-11.17-2.37-6.08-.22-.56h-6.69l-.22.56-2.37,6.08-4.35,11.17-3.05,7.83-2.59,6.64-2.13,5.47-2.59,6.64h7.12l2.59-6.64,2.13-5.47h17.6l2.13,5.47,2.59,6.64h7.12l-2.59-6.64ZM220.69,153.45l3.05-7.83,3.16-8.11,3.16,8.11,3.05,7.83h-12.42Z"
										/>
										<polygon
											fill="#000"
											points="127.24 127.81 123.3 134.45 116.67 145.62 112.61 152.46 112.56 152.54 112.56 172.19 104.86 172.19 104.86 152.41 100.82 145.62 94.2 134.45 90.25 127.81 97.98 127.81 101.92 134.45 104.86 139.4 108.55 145.62 108.75 145.95 108.95 145.62 112.56 139.53 115.58 134.45 119.52 127.81 127.24 127.81"
										/>
										<polygon
											fill="#000"
											points="143.6 134.45 143.6 145.62 161.45 145.62 161.45 152.25 143.6 152.25 143.6 165.55 164.23 165.55 164.23 172.19 136.96 172.19 136.96 127.81 164.23 127.81 164.23 134.45 143.6 134.45"
										/>
									</g>
								</svg>
							</div>

							<!-- Brand Text -->
							<div class="brand-text">
								<h1 class="text-3xl font-bold text-white mb-1 tracking-tight">
									Zyeta<span
										class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 animate-slideIn"
										style="animation-delay: 0.3s;">DX</span
									>
								</h1>
								<p class="text-white/70 text-sm font-medium">Workplace Experience Platform</p>
							</div>
						</div>

						<!-- Loading Animation -->
						<div class="loading-animation mb-6">
							<div class="flex justify-center space-x-1 mb-4">
								{#each Array(3) as _, i}
									<div
										class="w-2 h-2 bg-white rounded-full animate-bounce"
										style="animation-delay: {i * 0.1}s; animation-duration: 0.6s;"
									></div>
								{/each}
							</div>

							<!-- Progress Bar -->
							<div class="loading-bar w-full h-1 bg-white/20 rounded-full overflow-hidden">
								<div
									class="loading-progress h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-loading-bar rounded-full"
								></div>
							</div>
						</div>

						<!-- Status Message -->
						<div class="status-message">
							<p class="text-white/90 text-sm font-medium">
								{message}
							</p>
							<p class="text-white/60 text-xs mt-1">Please wait while we prepare your experience</p>
						</div>
					</div>

					<!-- Decorative Elements -->
					<div class="absolute top-0 left-0 w-full h-full pointer-events-none">
						<div
							class="absolute top-4 right-4 w-8 h-8 border border-white/20 rounded-full animate-spin"
							style="animation-duration: 3s;"
						></div>
						<div
							class="absolute bottom-4 left-4 w-4 h-4 bg-white/10 rounded-full animate-pulse"
							style="animation-delay: 1s;"
						></div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Glass Effect Modal Styles */
	.loading-modal {
		/* Initial state handled by Svelte transitions */
		will-change: transform, opacity;
	}

	@keyframes slideIn {
		0% {
			opacity: 0;
			transform: translateX(-20px);
		}
		100% {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes loading {
		0% {
			transform: translateX(-100%);
			opacity: 0;
		}
		10% {
			opacity: 1;
		}
		90% {
			opacity: 1;
		}
		100% {
			transform: translateX(200%);
			opacity: 0;
		}
	}

	.animate-slideIn {
		animation: slideIn 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.5s both;
	}

	.animate-loading-bar {
		animation: loading 2.5s ease-in-out 0.8s infinite;
	}

	/* Glass Effect Enhancements */
	.loading-modal {
		filter: drop-shadow(0 25px 50px rgba(0, 0, 0, 0.25));
	}

	.loading-modal::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			135deg,
			rgba(255, 255, 255, 0.1) 0%,
			transparent 50%,
			rgba(255, 255, 255, 0.05) 100%
		);
		pointer-events: none;
		border-radius: inherit;
	}

	/* Responsive Design */
	@media (max-width: 640px) {
		.loading-modal {
			margin: 1rem;
			max-width: calc(100vw - 2rem);
		}

		.zyeta-logo {
			width: 4rem;
			height: 4rem;
		}

		.brand-text h1 {
			font-size: 1.5rem;
		}
	}
</style>
