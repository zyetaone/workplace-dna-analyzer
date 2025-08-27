<script lang="ts">
	import { goto } from '$app/navigation';
	import { login } from './auth.remote';
	
	let password = $state('');
	let isLoggingIn = $state(false);
	let error = $state('');
	
	async function handleLogin(e: Event) {
		e.preventDefault();
		error = password.trim() ? '' : 'Please enter a password';
		if (error) return;
		
		isLoggingIn = true;
		try {
			await login({ password });
			await goto('/dashboard', { invalidateAll: true });
		} catch (err: any) {
			error = 'Invalid password';
			password = '';
		} finally {
			isLoggingIn = false;
		}
	}
</script>

<div class="min-h-screen animated-gradient flex items-center justify-center px-4">
	<div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
		<h1 class="text-3xl font-bold text-gray-800 mb-2 text-center">Presenter Login</h1>
		<p class="text-gray-600 mb-6 text-center">Enter your password to access the presenter dashboard</p>
		
		<form onsubmit={handleLogin}>
			<div class="mb-6">
				<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
					Password
				</label>
				<input
					type="password"
					id="password"
					bind:value={password}
					class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
					placeholder="Enter password"
					required
					disabled={isLoggingIn}
					autocomplete="current-password"
				/>
			</div>
			
			{#if error}
				<div class="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
					{error}
				</div>
			{/if}
			
			<button
				type="submit"
				disabled={isLoggingIn || !password.trim()}
				class="w-full py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
			>
				{isLoggingIn ? 'Logging in...' : 'Login'}
			</button>
		</form>
		
		<div class="mt-6 pt-6 border-t border-gray-200">
			<p class="text-sm text-gray-500 text-center">
				Authorized presenters only. Contact your administrator for access.
			</p>
		</div>
	</div>
</div>