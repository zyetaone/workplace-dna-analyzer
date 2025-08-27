<!-- 
	AnimateOnScroll.svelte
	Component that uses attachment pattern for scroll-based animations
	Implements IntersectionObserver for performance
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	
	interface Props {
		children?: Snippet;
		animation?: 'fade' | 'slide' | 'scale' | 'rotate';
		duration?: number;
		delay?: number;
		threshold?: number;
		once?: boolean;
		class?: string;
	}
	
	let {
		children,
		animation = 'fade',
		duration = 500,
		delay = 0,
		threshold = 0.1,
		once = true,
		class: className = ''
	}: Props = $props();
	
	// Attachment function for scroll animation behavior
	function animateOnScroll(node: HTMLElement) {
		let hasAnimated = false;
		
		// Set initial state based on animation type
		const initialStyles = {
			fade: { opacity: '0' },
			slide: { opacity: '0', transform: 'translateY(20px)' },
			scale: { opacity: '0', transform: 'scale(0.95)' },
			rotate: { opacity: '0', transform: 'rotate(-5deg)' }
		};
		
		const finalStyles = {
			fade: { opacity: '1' },
			slide: { opacity: '1', transform: 'translateY(0)' },
			scale: { opacity: '1', transform: 'scale(1)' },
			rotate: { opacity: '1', transform: 'rotate(0)' }
		};
		
		// Apply initial styles
		Object.assign(node.style, {
			transition: `all ${duration}ms ease-out ${delay}ms`,
			...initialStyles[animation]
		});
		
		// Create intersection observer
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && (!hasAnimated || !once)) {
						// Apply animation
						setTimeout(() => {
							Object.assign(node.style, finalStyles[animation]);
						}, 10); // Small delay to ensure transition works
						
						hasAnimated = true;
						
						if (once) {
							observer.disconnect();
						}
					} else if (!entry.isIntersecting && !once) {
						// Reset animation if not "once"
						Object.assign(node.style, initialStyles[animation]);
						hasAnimated = false;
					}
				});
			},
			{
				threshold,
				rootMargin: '50px'
			}
		);
		
		observer.observe(node);
		
		// Cleanup function
		return () => {
			observer.disconnect();
		};
	}
</script>

<div {@attach animateOnScroll} class={className}>
	{@render children?.()}
</div>