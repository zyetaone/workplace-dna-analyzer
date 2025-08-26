/**
 * Analytics Store with Derived Computations
 * All analytics calculations are reactive and auto-update
 */

import { sessionStore } from './session-state.svelte';
import type { Attendee } from './session-state.svelte';
import { generateWorkplaceDNA, calculateAverageScores } from '$lib/utils/workplace-dna';
import type { 
	PreferenceScores, 
	GenerationPreferences, 
	WordCloudItem 
} from '$lib/types';

class AnalyticsStore {
	// Derived from session store
	attendees = $derived.by(() => {
		const attendees = sessionStore.currentAttendees;
		console.log('[AnalyticsStore] Derived attendees:', attendees.length);
		return attendees;
	});
	completed = $derived.by(() => {
		const completed = sessionStore.completedAttendees;
		console.log('[AnalyticsStore] Derived completed:', completed.length);
		return completed;
	});
	
	// Generation distribution
	generationDistribution = $derived.by(() => {
		const dist: Record<string, number> = {
			'Baby Boomer': 0,
			'Gen X': 0,
			'Millennial': 0,
			'Gen Z': 0
		};
		
		this.attendees.forEach(attendee => {
			if (attendee.generation) {
				dist[attendee.generation] = (dist[attendee.generation] || 0) + 1;
			}
		});
		
		return dist;
	});
	
	// Average preference scores
	preferenceScores = $derived.by(() => {
		console.log('[AnalyticsStore] Computing preference scores, completed count:', this.completed.length);
		
		if (this.completed.length === 0) {
			return { collaboration: 0, formality: 0, technology: 0, wellness: 0 };
		}
		
		const totals = this.completed.reduce((acc, attendee) => {
			const scores = attendee.preferenceScores as PreferenceScores | null;
			console.log('[AnalyticsStore] Processing attendee:', attendee.name, 'scores:', scores);
			
			if (scores) {
				acc.collaboration += scores.collaboration || 0;
				acc.formality += scores.formality || 0;
				acc.technology += (scores as any).tech || scores.technology || 0;
				acc.wellness += scores.wellness || 0;
			}
			return acc;
		}, { collaboration: 0, formality: 0, technology: 0, wellness: 0 });
		
		const multiplier = 1 / this.completed.length;
		
		const result = {
			collaboration: Math.round(totals.collaboration * multiplier),
			formality: Math.round(totals.formality * multiplier),
			technology: Math.round(totals.technology * multiplier),
			wellness: Math.round(totals.wellness * multiplier)
		};
		
		console.log('[AnalyticsStore] Computed preference scores:', result);
		return result;
	});
	
	// Preferences by generation
	generationPreferences = $derived.by(() => {
		const prefs: Record<string, GenerationPreferences> = {};
		
		['Baby Boomer', 'Gen X', 'Millennial', 'Gen Z'].forEach(generation => {
			const genParticipants = this.completed.filter(a => a.generation === generation);
			
			if (genParticipants.length > 0) {
				const genTotals = genParticipants.reduce((acc, attendee) => {
					const scores = attendee.preferenceScores as PreferenceScores | null;
					if (scores) {
						acc.collaboration += scores.collaboration || 0;
						acc.formality += scores.formality || 0;
						acc.technology += (scores as any).tech || scores.technology || 0;
						acc.wellness += scores.wellness || 0;
					}
					return acc;
				}, { collaboration: 0, formality: 0, technology: 0, wellness: 0 });
				
				const genAvg = 1 / genParticipants.length;
				
				prefs[generation] = {
					collaboration: Math.round(genTotals.collaboration * genAvg),
					formality: Math.round(genTotals.formality * genAvg),
					technology: Math.round(genTotals.technology * genAvg),
					wellness: Math.round(genTotals.wellness * genAvg),
					count: genParticipants.length
				};
			}
		});
		
		return prefs;
	});
	
	// Workplace DNA using centralized utility
	workplaceDNA = $derived.by(() => {
		if (this.completed.length === 0) return '';
		return generateWorkplaceDNA(this.preferenceScores);
	});
	
	// Word cloud data generation
	wordCloudData = $derived.by(() => {
		const items: WordCloudItem[] = [];
		
		if (this.completed.length === 0 || !this.workplaceDNA) {
			return items;
		}
		
		const { collaboration, formality, technology, wellness } = this.preferenceScores;
		
		// Add main DNA components with largest size
		this.workplaceDNA.split(' · ').forEach(component => {
			items.push({ text: component, size: 60 + Math.random() * 20 });
		});
		
		// Add collaboration-related terms
		if (collaboration >= 7) {
			items.push(
				{ text: 'Teamwork', size: 45 },
				{ text: 'Open Space', size: 40 },
				{ text: 'Huddle Rooms', size: 35 },
				{ text: 'Collaboration', size: 42 },
				{ text: 'Co-creation', size: 38 }
			);
		} else if (collaboration >= 4) {
			items.push(
				{ text: 'Balanced Teams', size: 40 },
				{ text: 'Flexible Work', size: 35 },
				{ text: 'Hybrid Meetings', size: 33 }
			);
		} else {
			items.push(
				{ text: 'Focus Zones', size: 40 },
				{ text: 'Private Offices', size: 35 },
				{ text: 'Deep Work', size: 38 },
				{ text: 'Individual Space', size: 33 }
			);
		}
		
		// Add formality-related terms
		if (formality >= 7) {
			items.push(
				{ text: 'Professional', size: 45 },
				{ text: 'Executive', size: 40 },
				{ text: 'Boardroom', size: 35 },
				{ text: 'Corporate', size: 38 }
			);
		} else if (formality >= 4) {
			items.push(
				{ text: 'Smart Casual', size: 40 },
				{ text: 'Adaptable', size: 35 },
				{ text: 'Dynamic', size: 33 }
			);
		} else {
			items.push(
				{ text: 'Relaxed', size: 40 },
				{ text: 'Informal', size: 35 },
				{ text: 'Casual Friday', size: 33 },
				{ text: 'Laid-back', size: 30 }
			);
		}
		
		// Add technology-related terms
		if (technology >= 7) {
			items.push(
				{ text: 'Smart Office', size: 45 },
				{ text: 'IoT', size: 40 },
				{ text: 'Digital Tools', size: 35 },
				{ text: 'Automation', size: 30 },
				{ text: 'AI-Powered', size: 38 },
				{ text: 'Cloud-First', size: 33 }
			);
		} else if (technology >= 4) {
			items.push(
				{ text: 'Hybrid Tech', size: 40 },
				{ text: 'Essential Digital', size: 35 },
				{ text: 'Practical Tools', size: 30 }
			);
		} else {
			items.push(
				{ text: 'Analog', size: 40 },
				{ text: 'In-Person', size: 35 },
				{ text: 'Face-to-Face', size: 33 },
				{ text: 'Traditional', size: 30 }
			);
		}
		
		// Add wellness-related terms
		if (wellness >= 7) {
			items.push(
				{ text: 'Wellbeing', size: 45 },
				{ text: 'Biophilic', size: 40 },
				{ text: 'Ergonomic', size: 35 },
				{ text: 'Natural Light', size: 30 },
				{ text: 'Mindfulness', size: 33 },
				{ text: 'Work-Life Balance', size: 38 }
			);
		} else if (wellness >= 4) {
			items.push(
				{ text: 'Work-Life', size: 40 },
				{ text: 'Comfort', size: 35 },
				{ text: 'Healthy Options', size: 30 }
			);
		} else {
			items.push(
				{ text: 'Efficiency', size: 40 },
				{ text: 'Productivity', size: 35 },
				{ text: 'Performance', size: 33 },
				{ text: 'Results-Driven', size: 30 }
			);
		}
		
		// Add generation-specific concepts
		const dominantGen = Object.entries(this.generationDistribution)
			.filter(([_, count]) => count > 0)
			.sort(([, a], [, b]) => b - a)[0];
		
		if (dominantGen) {
			const [generation] = dominantGen;
			switch (generation) {
				case 'Gen Z':
					items.push(
						{ text: 'Sustainable', size: 35 },
						{ text: 'Inclusive', size: 30 },
						{ text: 'Purpose-Driven', size: 28 },
						{ text: 'Social Impact', size: 25 }
					);
					break;
				case 'Millennial':
					items.push(
						{ text: 'Flexible Hours', size: 35 },
						{ text: 'Remote-First', size: 30 },
						{ text: 'Experience', size: 28 },
						{ text: 'Meaningful Work', size: 25 }
					);
					break;
				case 'Gen X':
					items.push(
						{ text: 'Work Ethic', size: 35 },
						{ text: 'Results-Driven', size: 30 },
						{ text: 'Pragmatic', size: 28 },
						{ text: 'Self-Reliant', size: 25 }
					);
					break;
				case 'Baby Boomer':
					items.push(
						{ text: 'Experience', size: 35 },
						{ text: 'Mentorship', size: 30 },
						{ text: 'Leadership', size: 28 },
						{ text: 'Dedication', size: 25 }
					);
					break;
			}
		}
		
		// Add some universal concepts
		items.push(
			{ text: 'Innovation', size: 25 },
			{ text: 'Culture', size: 25 },
			{ text: 'Growth', size: 20 },
			{ text: 'Community', size: 20 },
			{ text: 'Agile', size: 18 },
			{ text: 'Future of Work', size: 22 }
		);
		
		return items;
	});
	
	// Statistics
	activeCount = $derived(sessionStore.activeAttendees.length);
	completedCount = $derived(this.completed.length);
	responseRate = $derived(sessionStore.responseRate);
	
	// Chart-ready data
	generationChartData = $derived.by(() => {
		const labels = Object.keys(this.generationDistribution);
		const data = labels.map(label => this.generationDistribution[label]);
		
		return {
			labels,
			datasets: [{
				label: 'Participants',
				data,
				backgroundColor: [
					'rgba(255, 99, 132, 0.8)',
					'rgba(54, 162, 235, 0.8)',
					'rgba(255, 206, 86, 0.8)',
					'rgba(75, 192, 192, 0.8)'
				],
				borderColor: [
					'rgba(255, 99, 132, 1)',
					'rgba(54, 162, 235, 1)',
					'rgba(255, 206, 86, 1)',
					'rgba(75, 192, 192, 1)'
				],
				borderWidth: 2
			}]
		};
	});
	
	preferenceChartData = $derived.by(() => {
		const { collaboration, formality, technology, wellness } = this.preferenceScores;
		
		return {
			labels: ['Collaboration', 'Formality', 'Technology', 'Wellness'],
			datasets: [{
				label: 'Average Score',
				data: [collaboration, formality, technology, wellness],
				backgroundColor: 'rgba(75, 192, 192, 0.8)',
				borderColor: 'rgba(75, 192, 192, 1)',
				borderWidth: 2,
				borderRadius: 5,
				barThickness: 40
			}]
		};
	});
	
	// Real-time activity indicators
	lastUpdateTime = $state<Date>(new Date());
	recentActivity = $derived.by(() => {
		const now = Date.now();
		const lastUpdate = this.lastUpdateTime.getTime();
		const diff = now - lastUpdate;
		
		if (diff < 5000) return 'Very Active';
		if (diff < 30000) return 'Active';
		if (diff < 60000) return 'Recent';
		return 'Idle';
	});
	
	// Update activity timestamp
	recordActivity() {
		this.lastUpdateTime = new Date();
	}
}

// Export singleton instance
export const analyticsStore = new AnalyticsStore();