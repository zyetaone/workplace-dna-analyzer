<script lang="ts">
	import { Dialog, Button } from 'bits-ui';

	interface Props {
		open: boolean;
		title: string;
		message: string;
		confirmText?: string;
		cancelText?: string;
		variant?: 'destructive' | 'danger' | 'default';
		onConfirm: () => void;
		onCancel: () => void;
	}

	let {
		open = $bindable(),
		title,
		message,
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		variant = 'default',
		onConfirm,
		onCancel
	}: Props = $props();

	function handleConfirm() {
		onConfirm();
		open = false;
	}

	function handleCancel() {
		onCancel();
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 bg-black/50 z-50" />
		<Dialog.Content 
			class="fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-white p-6 shadow-lg rounded-lg"
			role="alertdialog"
			aria-labelledby="dialog-title"
			aria-describedby="dialog-description"
		>
			<div class="flex flex-col space-y-2 text-center sm:text-left">
				<Dialog.Title>
					<h2 id="dialog-title" class="text-lg font-semibold text-gray-900">
						{title}
					</h2>
				</Dialog.Title>
			</div>
			<div class="py-4">
				<Dialog.Description>
					<p id="dialog-description" class="text-gray-600">
						{message}
					</p>
				</Dialog.Description>
			</div>
			<div class="flex justify-end gap-3">
				<button 
					type="button"
					class="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
					onclick={handleCancel}
					aria-label="{cancelText} - Cancel this action"
				>
					{cancelText}
				</button>
				<button 
					type="button"
					class="inline-flex items-center justify-center rounded-md text-sm font-medium px-4 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 {variant === 'destructive' || variant === 'danger' ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500' : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'}"
					onclick={handleConfirm}
					aria-label="{confirmText} - {variant === 'destructive' || variant === 'danger' ? 'Warning: This action is destructive' : 'Confirm this action'}"
				>
					{confirmText}
				</button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>