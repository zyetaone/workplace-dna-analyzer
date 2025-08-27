<!-- 
	Draggable.svelte
	Component that uses attachment pattern for drag and drop behavior
	Supports both mouse and touch events
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	
	interface Position {
		x: number;
		y: number;
	}
	
	interface Props {
		children?: Snippet;
		onDragStart?: (pos: Position) => void;
		onDrag?: (pos: Position) => void;
		onDragEnd?: (pos: Position) => void;
		constraint?: 'parent' | 'viewport' | 'none';
		handle?: string; // CSS selector for drag handle
		disabled?: boolean;
		class?: string;
	}
	
	let {
		children,
		onDragStart,
		onDrag,
		onDragEnd,
		constraint = 'none',
		handle,
		disabled = false,
		class: className = ''
	}: Props = $props();
	
	// Attachment function for draggable behavior
	function makeDraggable(node: HTMLElement) {
		if (disabled) return;
		
		let isDragging = false;
		let startPos: Position = { x: 0, y: 0 };
		let currentPos: Position = { x: 0, y: 0 };
		let offset: Position = { x: 0, y: 0 };
		
		// Get the drag handle or use the entire element
		const getDragHandle = () => {
			if (handle) {
				return node.querySelector(handle) as HTMLElement || node;
			}
			return node;
		};
		
		const dragHandle = getDragHandle();
		
		// Make element draggable
		node.style.position = 'relative';
		dragHandle.style.cursor = 'move';
		dragHandle.style.userSelect = 'none';
		
		// Get constraint boundaries
		const getConstraints = () => {
			if (constraint === 'parent' && node.parentElement) {
				const parent = node.parentElement;
				const parentRect = parent.getBoundingClientRect();
				const nodeRect = node.getBoundingClientRect();
				return {
					minX: 0,
					maxX: parentRect.width - nodeRect.width,
					minY: 0,
					maxY: parentRect.height - nodeRect.height
				};
			} else if (constraint === 'viewport') {
				const nodeRect = node.getBoundingClientRect();
				return {
					minX: -nodeRect.left,
					maxX: window.innerWidth - nodeRect.width - nodeRect.left,
					minY: -nodeRect.top,
					maxY: window.innerHeight - nodeRect.height - nodeRect.top
				};
			}
			return null;
		};
		
		// Apply constraints to position
		const applyConstraints = (pos: Position): Position => {
			const constraints = getConstraints();
			if (!constraints) return pos;
			
			return {
				x: Math.max(constraints.minX, Math.min(constraints.maxX, pos.x)),
				y: Math.max(constraints.minY, Math.min(constraints.maxY, pos.y))
			};
		};
		
		// Handle drag start
		const handleStart = (clientX: number, clientY: number) => {
			isDragging = true;
			startPos = { x: clientX, y: clientY };
			
			// Get current transform values
			const transform = window.getComputedStyle(node).transform;
			if (transform !== 'none') {
				const matrix = new DOMMatrix(transform);
				currentPos = { x: matrix.e, y: matrix.f };
			}
			
			offset = {
				x: currentPos.x - clientX,
				y: currentPos.y - clientY
			};
			
			document.body.style.userSelect = 'none';
			onDragStart?.(currentPos);
		};
		
		// Handle drag move
		const handleMove = (clientX: number, clientY: number) => {
			if (!isDragging) return;
			
			let newPos = {
				x: clientX + offset.x,
				y: clientY + offset.y
			};
			
			newPos = applyConstraints(newPos);
			currentPos = newPos;
			
			node.style.transform = `translate(${newPos.x}px, ${newPos.y}px)`;
			onDrag?.(newPos);
		};
		
		// Handle drag end
		const handleEnd = () => {
			if (!isDragging) return;
			
			isDragging = false;
			document.body.style.userSelect = '';
			onDragEnd?.(currentPos);
		};
		
		// Mouse events
		const handleMouseDown = (e: MouseEvent) => {
			e.preventDefault();
			handleStart(e.clientX, e.clientY);
		};
		
		const handleMouseMove = (e: MouseEvent) => {
			handleMove(e.clientX, e.clientY);
		};
		
		const handleMouseUp = () => {
			handleEnd();
		};
		
		// Touch events
		const handleTouchStart = (e: TouchEvent) => {
			const touch = e.touches[0];
			handleStart(touch.clientX, touch.clientY);
		};
		
		const handleTouchMove = (e: TouchEvent) => {
			e.preventDefault();
			const touch = e.touches[0];
			handleMove(touch.clientX, touch.clientY);
		};
		
		const handleTouchEnd = () => {
			handleEnd();
		};
		
		// Add event listeners
		dragHandle.addEventListener('mousedown', handleMouseDown);
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
		
		dragHandle.addEventListener('touchstart', handleTouchStart, { passive: false });
		document.addEventListener('touchmove', handleTouchMove, { passive: false });
		document.addEventListener('touchend', handleTouchEnd);
		
		// Cleanup function
		return () => {
			dragHandle.removeEventListener('mousedown', handleMouseDown);
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
			
			dragHandle.removeEventListener('touchstart', handleTouchStart);
			document.removeEventListener('touchmove', handleTouchMove);
			document.removeEventListener('touchend', handleTouchEnd);
		};
	}
</script>

<div {@attach makeDraggable} class={className}>
	{@render children?.()}
</div>