<script lang="ts">
	import { AlertDialog } from 'bits-ui';
	
	interface Props {
		open: boolean;
		onOpenChange?: (open: boolean) => void;
		title: string;
		description: string;
		confirmText?: string;
		cancelText?: string;
		onConfirm: () => void | Promise<void>;
		variant?: 'default' | 'danger';
	}
	
	let {
		open = $bindable(false),
		onOpenChange,
		title,
		description,
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		onConfirm,
		variant = 'default'
	}: Props = $props();
	
	let isLoading = $state(false);
	
	async function handleConfirm() {
		isLoading = true;
		try {
			await onConfirm();
			open = false;
		} finally {
			isLoading = false;
		}
	}
</script>

<AlertDialog.Root bind:open onOpenChange={onOpenChange}>
	<AlertDialog.Portal>
		<AlertDialog.Overlay class="fixed inset-0 bg-black/50 z-50" />
		<AlertDialog.Content class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-md z-50">
			<AlertDialog.Title class="text-lg font-semibold text-gray-900 mb-2">
				{title}
			</AlertDialog.Title>
			<AlertDialog.Description class="text-gray-600 mb-6">
				{description}
			</AlertDialog.Description>
			
			<div class="flex justify-end gap-3">
				<AlertDialog.Cancel 
					class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
					disabled={isLoading}
				>
					{cancelText}
				</AlertDialog.Cancel>
				<AlertDialog.Action
					onclick={handleConfirm}
					disabled={isLoading}
					class="px-4 py-2 rounded-lg transition disabled:opacity-50 {variant === 'danger' 
						? 'bg-red-500 text-white hover:bg-red-600' 
						: 'bg-gray-600 text-white hover:bg-gray-700'}"
				>
					{isLoading ? 'Processing...' : confirmText}
				</AlertDialog.Action>
			</div>
		</AlertDialog.Content>
	</AlertDialog.Portal>
</AlertDialog.Root>