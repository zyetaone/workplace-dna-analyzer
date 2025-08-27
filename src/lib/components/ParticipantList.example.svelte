<script lang="ts">
	/**
	 * Example usage of the ParticipantList component
	 * This file demonstrates various configurations of the component
	 */
	import ParticipantList from './ParticipantList.svelte';
	import type { Participant } from '$lib/types';
	
	// Sample data for demonstration
	const sampleParticipants: Participant[] = [
		{
			id: 'abc123def456',
			sessionId: 'session-1',
			name: 'Alice Johnson',
			generation: 'Millennial',
			responses: { 1: 'a', 2: 'b', 3: 'c', 4: 'd', 5: 'a', 6: 'b', 7: 'c' },
			preferenceScores: {
				collaboration: 8.5,
				formality: 6.2,
				tech: 9.1,
				wellness: 7.8
			},
			completed: true,
			joinedAt: '2024-01-15T10:00:00Z',
			completedAt: '2024-01-15T10:15:00Z'
		},
		{
			id: 'ghi789jkl012',
			sessionId: 'session-1',
			name: 'Bob Smith',
			generation: 'Gen X',
			responses: { 1: 'a', 2: 'b', 3: 'c' },
			preferenceScores: null,
			completed: false,
			joinedAt: '2024-01-15T10:05:00Z',
			completedAt: null
		},
		{
			id: 'mno345pqr678',
			sessionId: 'session-1',
			name: 'Carol White',
			generation: 'Baby Boomer',
			responses: { 1: 'a', 2: 'b', 3: 'c', 4: 'd', 5: 'a', 6: 'b', 7: 'c' },
			preferenceScores: {
				collaboration: 7.2,
				formality: 8.5,
				tech: 5.3,
				wellness: 9.0
			},
			completed: true,
			joinedAt: '2024-01-15T10:02:00Z',
			completedAt: '2024-01-15T10:20:00Z'
		}
	];
	
	// Example handlers
	function handleDelete(id: string, name: string) {
		console.log(`Delete participant: ${name} (${id})`);
		// In a real app, this would call a remote function to delete
	}
	
	function handleCopyLink(id: string) {
		const link = `${window.location.origin}/dashboard/session-1/p/${id}/quiz`;
		navigator.clipboard.writeText(link);
		console.log(`Copied link for participant: ${id}`);
	}
</script>

<div class="p-8 space-y-12 bg-gray-50 min-h-screen">
	<div>
		<h1 class="text-3xl font-bold text-gray-800 mb-8">ParticipantList Component Examples</h1>
		
		<!-- Example 1: Full featured list (Dashboard view) -->
		<section class="mb-12">
			<h2 class="text-xl font-semibold text-gray-700 mb-4">Example 1: Dashboard View (All Features)</h2>
			<div class="bg-white rounded-lg shadow-lg p-6">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">Session Participants</h3>
				<ParticipantList
					participants={sampleParticipants}
					onDelete={handleDelete}
					onCopyLink={handleCopyLink}
					showActions={true}
					showProgress={true}
					showStatus={true}
					showGeneration={true}
					showScores={false}
					showId={true}
					showLink={true}
					emptyMessage="No participants have joined this session yet."
				/>
			</div>
		</section>
		
		<!-- Example 2: Completed participants with scores -->
		<section class="mb-12">
			<h2 class="text-xl font-semibold text-gray-700 mb-4">Example 2: Results View (With Scores)</h2>
			<div class="bg-white rounded-lg shadow-lg p-6">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">Completed Participants</h3>
				<ParticipantList
					participants={sampleParticipants.filter(p => p.completed)}
					showActions={false}
					showProgress={false}
					showStatus={false}
					showGeneration={true}
					showScores={true}
					showId={false}
					showLink={false}
					emptyMessage="No participants have completed the quiz yet."
				/>
			</div>
		</section>
		
		<!-- Example 3: Minimal view -->
		<section class="mb-12">
			<h2 class="text-xl font-semibold text-gray-700 mb-4">Example 3: Minimal View</h2>
			<div class="bg-white rounded-lg shadow-lg p-6">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">Active Participants</h3>
				<ParticipantList
					participants={sampleParticipants.filter(p => !p.completed)}
					showActions={false}
					showProgress={true}
					showStatus={true}
					showGeneration={false}
					showScores={false}
					showId={false}
					showLink={false}
					emptyMessage="All participants have completed the quiz!"
				/>
			</div>
		</section>
		
		<!-- Example 4: Read-only view with custom styling -->
		<section class="mb-12">
			<h2 class="text-xl font-semibold text-gray-700 mb-4">Example 4: Read-only View (Custom Class)</h2>
			<div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">All Participants</h3>
				<ParticipantList
					participants={sampleParticipants}
					showActions={false}
					showProgress={true}
					showStatus={true}
					showGeneration={true}
					showScores={false}
					showId={true}
					showLink={false}
					className="border-2 border-indigo-200 rounded-lg"
					emptyMessage="No data available."
				/>
			</div>
		</section>
		
		<!-- Example 5: Empty state -->
		<section class="mb-12">
			<h2 class="text-xl font-semibold text-gray-700 mb-4">Example 5: Empty State</h2>
			<div class="bg-white rounded-lg shadow-lg p-6">
				<h3 class="text-lg font-semibold text-gray-800 mb-4">Waiting for Participants</h3>
				<ParticipantList
					participants={[]}
					onDelete={handleDelete}
					onCopyLink={handleCopyLink}
					emptyMessage="Share the QR code with your team to get started!"
				/>
			</div>
		</section>
	</div>
</div>

<style>
	/* Component-specific styles if needed */
</style>