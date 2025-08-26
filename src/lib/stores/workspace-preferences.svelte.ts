/**
 * Workspace Preferences Store
 * Manages workspace concepts, themes, and AI-generated insights
 */

import { analyticsStore } from './analytics-state.svelte';
import { SvelteSet } from 'svelte/reactivity';

interface WorkspaceConcept {
	name: string;
	description: string;
	score: number;
	tags: string[];
	color: string;
}

interface DesignTheme {
	primary: string;
	secondary: string;
	accent: string;
	materials: string[];
	lighting: string;
	furniture: string[];
}

class WorkspacePreferencesStore {
	// Selected concepts
	selectedConcepts = new SvelteSet<string>();
	customConcepts = $state<string[]>([]);
	
	// AI-generated insights
	aiInsights = $state<string[]>([]);
	designRecommendations = $state<string[]>([]);
	
	// Workspace concepts based on DNA
	workspaceConcepts = $derived.by(() => {
		const concepts: WorkspaceConcept[] = [];
		const { preferenceScores, workplaceDNA } = analyticsStore;
		
		if (!workplaceDNA) return concepts;
		
		const { collaboration, formality, technology, wellness } = preferenceScores;
		
		// Collaboration-based concepts
		if (collaboration >= 7) {
			concepts.push({
				name: 'Open Collaboration Hub',
				description: 'Large open spaces with flexible seating, writable walls, and multiple screens for team brainstorming',
				score: collaboration,
				tags: ['teamwork', 'open-plan', 'flexible', 'interactive'],
				color: '#3b82f6'
			});
			concepts.push({
				name: 'Huddle Zones',
				description: 'Small, informal meeting spaces scattered throughout for quick team syncs',
				score: collaboration * 0.9,
				tags: ['agile', 'informal', 'quick-meetings'],
				color: '#60a5fa'
			});
		} else if (collaboration <= 3) {
			concepts.push({
				name: 'Focus Pods',
				description: 'Sound-proof individual work pods for deep concentration',
				score: 10 - collaboration,
				tags: ['quiet', 'private', 'focused'],
				color: '#6366f1'
			});
			concepts.push({
				name: 'Library Zone',
				description: 'Quiet study-like area with individual desks and minimal distractions',
				score: (10 - collaboration) * 0.9,
				tags: ['silent', 'studious', 'concentrated'],
				color: '#818cf8'
			});
		}
		
		// Formality-based concepts
		if (formality >= 7) {
			concepts.push({
				name: 'Executive Suite',
				description: 'Professional boardrooms with high-end finishes and formal meeting spaces',
				score: formality,
				tags: ['professional', 'executive', 'formal'],
				color: '#f59e0b'
			});
			concepts.push({
				name: 'Reception Lounge',
				description: 'Impressive client-facing areas with sophisticated design',
				score: formality * 0.85,
				tags: ['client-facing', 'impressive', 'sophisticated'],
				color: '#fbbf24'
			});
		} else if (formality <= 3) {
			concepts.push({
				name: 'Casual Cafe',
				description: 'Coffee shop-style workspace with comfortable seating and relaxed atmosphere',
				score: 10 - formality,
				tags: ['casual', 'comfortable', 'relaxed'],
				color: '#10b981'
			});
			concepts.push({
				name: 'Game Room',
				description: 'Recreation area with games and entertainment for breaks',
				score: (10 - formality) * 0.8,
				tags: ['fun', 'recreational', 'playful'],
				color: '#34d399'
			});
		}
		
		// Technology-based concepts
		if (technology >= 7) {
			concepts.push({
				name: 'Smart Office',
				description: 'IoT-enabled workspace with automated lighting, climate control, and booking systems',
				score: technology,
				tags: ['IoT', 'automated', 'smart', 'connected'],
				color: '#8b5cf6'
			});
			concepts.push({
				name: 'VR/AR Lab',
				description: 'Dedicated space for virtual and augmented reality experiences',
				score: technology * 0.9,
				tags: ['VR', 'AR', 'immersive', 'innovative'],
				color: '#a78bfa'
			});
			concepts.push({
				name: 'Digital Whiteboard Rooms',
				description: 'Rooms equipped with interactive digital displays for collaborative work',
				score: technology * 0.85,
				tags: ['digital', 'interactive', 'collaborative'],
				color: '#c084fc'
			});
		} else if (technology <= 3) {
			concepts.push({
				name: 'Analog Workshop',
				description: 'Traditional workspace with physical whiteboards and paper-based tools',
				score: 10 - technology,
				tags: ['traditional', 'analog', 'tactile'],
				color: '#14b8a6'
			});
		}
		
		// Wellness-based concepts
		if (wellness >= 7) {
			concepts.push({
				name: 'Wellness Center',
				description: 'On-site gym, meditation room, and wellness facilities',
				score: wellness,
				tags: ['health', 'fitness', 'meditation', 'wellbeing'],
				color: '#ef4444'
			});
			concepts.push({
				name: 'Biophilic Garden',
				description: 'Indoor garden spaces with natural light and living plants',
				score: wellness * 0.95,
				tags: ['nature', 'plants', 'natural-light', 'biophilic'],
				color: '#10b981'
			});
			concepts.push({
				name: 'Ergonomic Haven',
				description: 'Height-adjustable desks, ergonomic chairs, and wellness-focused furniture',
				score: wellness * 0.9,
				tags: ['ergonomic', 'adjustable', 'comfort', 'health'],
				color: '#f87171'
			});
		} else if (wellness <= 3) {
			concepts.push({
				name: 'High-Performance Zone',
				description: 'Efficiency-focused workspace optimized for maximum productivity',
				score: 10 - wellness,
				tags: ['efficient', 'productive', 'performance'],
				color: '#6b7280'
			});
		}
		
		// Mixed concepts based on combinations
		if (collaboration >= 6 && technology >= 6) {
			concepts.push({
				name: 'Digital Collaboration Theater',
				description: 'Large presentation space with advanced AV for hybrid meetings',
				score: (collaboration + technology) / 2,
				tags: ['hybrid', 'presentation', 'digital', 'collaborative'],
				color: '#06b6d4'
			});
		}
		
		if (wellness >= 6 && formality <= 4) {
			concepts.push({
				name: 'Relaxation Lounge',
				description: 'Comfortable break area with soft seating and calming ambiance',
				score: (wellness + (10 - formality)) / 2,
				tags: ['relaxation', 'comfort', 'break', 'calm'],
				color: '#ec4899'
			});
		}
		
		if (technology >= 6 && formality >= 6) {
			concepts.push({
				name: 'Executive Tech Center',
				description: 'High-end meeting rooms with cutting-edge presentation technology',
				score: (technology + formality) / 2,
				tags: ['executive', 'high-tech', 'premium', 'sophisticated'],
				color: '#7c3aed'
			});
		}
		
		// Sort by score (highest first)
		return concepts.sort((a, b) => b.score - a.score);
	});
	
	// Top workspace themes
	topThemes = $derived.by(() => {
		return this.workspaceConcepts.slice(0, 5);
	});
	
	// Design palette based on preferences
	designPalette = $derived.by(() => {
		const { preferenceScores } = analyticsStore;
		const palette: DesignTheme = {
			primary: '#000000',
			secondary: '#ffffff',
			accent: '#6b7280',
			materials: [],
			lighting: 'balanced',
			furniture: []
		};
		
		// Color scheme based on formality
		if (preferenceScores.formality >= 7) {
			palette.primary = '#1f2937'; // Dark gray
			palette.secondary = '#f3f4f6'; // Light gray
			palette.accent = '#d97706'; // Amber
			palette.materials = ['marble', 'dark wood', 'leather', 'glass'];
			palette.furniture = ['executive desk', 'leather chairs', 'conference table'];
		} else if (preferenceScores.formality <= 3) {
			palette.primary = '#ffffff';
			palette.secondary = '#fef3c7'; // Warm yellow
			palette.accent = '#10b981'; // Green
			palette.materials = ['reclaimed wood', 'fabric', 'cork', 'bamboo'];
			palette.furniture = ['bean bags', 'standing desks', 'modular seating'];
		} else {
			palette.primary = '#f9fafb';
			palette.secondary = '#e5e7eb';
			palette.accent = '#3b82f6'; // Blue
			palette.materials = ['laminate', 'mesh', 'aluminum', 'fabric'];
			palette.furniture = ['adjustable desks', 'task chairs', 'mobile storage'];
		}
		
		// Lighting based on wellness
		if (preferenceScores.wellness >= 7) {
			palette.lighting = 'natural + circadian';
		} else if (preferenceScores.wellness >= 4) {
			palette.lighting = 'balanced LED';
		} else {
			palette.lighting = 'bright task lighting';
		}
		
		return palette;
	});
	
	// Space allocation recommendations
	spaceAllocation = $derived.by(() => {
		const { preferenceScores } = analyticsStore;
		const allocation: Record<string, number> = {};
		
		// Base allocation
		allocation['Individual Work'] = 40;
		allocation['Meeting Spaces'] = 25;
		allocation['Social Areas'] = 15;
		allocation['Support Spaces'] = 20;
		
		// Adjust based on collaboration
		if (preferenceScores.collaboration >= 7) {
			allocation['Individual Work'] -= 10;
			allocation['Meeting Spaces'] += 10;
		} else if (preferenceScores.collaboration <= 3) {
			allocation['Individual Work'] += 10;
			allocation['Meeting Spaces'] -= 5;
			allocation['Social Areas'] -= 5;
		}
		
		// Adjust based on wellness
		if (preferenceScores.wellness >= 7) {
			allocation['Wellness Spaces'] = 10;
			allocation['Support Spaces'] -= 5;
			allocation['Individual Work'] -= 5;
		}
		
		return allocation;
	});
	
	// Add custom concept
	addCustomConcept(concept: string) {
		if (concept && !this.customConcepts.includes(concept)) {
			this.customConcepts.push(concept);
		}
	}
	
	// Toggle concept selection
	toggleConcept(conceptName: string) {
		if (this.selectedConcepts.has(conceptName)) {
			this.selectedConcepts.delete(conceptName);
		} else {
			this.selectedConcepts.add(conceptName);
		}
	}
	
	// Get selected concepts array
	getSelectedConcepts() {
		return Array.from(this.selectedConcepts);
	}
	
	// Set AI insights
	setAIInsights(insights: string[]) {
		this.aiInsights = insights;
	}
	
	// Set design recommendations
	setDesignRecommendations(recommendations: string[]) {
		this.designRecommendations = recommendations;
	}
	
	// Reset selections
	reset() {
		this.selectedConcepts.clear();
		this.customConcepts = [];
		this.aiInsights = [];
		this.designRecommendations = [];
	}
}

// Export singleton instance
export const workspacePreferencesStore = new WorkspacePreferencesStore();