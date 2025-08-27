<script context="module" lang="ts">
	import type { ChartConfiguration } from 'chart.js';
	import type { PreferenceScores } from '$lib/server/db/schema';
	
	/**
	 * Creates a radar chart configuration for preference scores
	 */
	export function createPreferenceRadarConfig(scores: PreferenceScores): ChartConfiguration {
		return {
			type: 'radar',
			data: {
				labels: ['Collaboration', 'Formality', 'Technology', 'Wellness'],
				datasets: [{
					label: 'Team Preferences',
					data: [scores.collaboration, scores.formality, scores.tech, scores.wellness],
					backgroundColor: 'rgba(59, 130, 246, 0.2)',
					borderColor: 'rgb(59, 130, 246)',
					pointBackgroundColor: 'rgb(59, 130, 246)',
					pointBorderColor: '#fff',
					pointHoverBackgroundColor: '#fff',
					pointHoverBorderColor: 'rgb(59, 130, 246)'
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					r: {
						min: 0,
						max: 10,
						ticks: {
							stepSize: 2
						},
						pointLabels: {
							font: {
								size: 12
							}
						}
					}
				},
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						callbacks: {
							label: (context) => {
								return `${context.label}: ${context.formattedValue}/10`;
							}
						}
					}
				}
			}
		};
	}

	/**
	 * Creates a bar chart configuration for preference scores
	 */
	export function createChartConfig(scores: PreferenceScores): ChartConfiguration {
		return {
			type: 'bar',
			data: {
				labels: ['Collaboration', 'Formality', 'Technology', 'Wellness'],
				datasets: [{
					label: 'Average Score',
					data: [scores.collaboration, scores.formality, scores.tech, scores.wellness],
					backgroundColor: [
						'rgba(59, 130, 246, 0.8)',
						'rgba(245, 158, 11, 0.8)',
						'rgba(34, 197, 94, 0.8)',
						'rgba(239, 68, 68, 0.8)'
					],
					borderColor: [
						'rgb(59, 130, 246)',
						'rgb(245, 158, 11)',
						'rgb(34, 197, 94)',
						'rgb(239, 68, 68)'
					],
					borderWidth: 1
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: {
						beginAtZero: true,
						max: 10,
						ticks: {
							stepSize: 2
						}
					}
				},
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						callbacks: {
							label: (context) => {
								return `${context.label}: ${context.formattedValue}/10`;
							}
						}
					}
				}
			}
		};
	}

	/**
	 * Creates a generation distribution chart configuration
	 */
	export function createGenerationChartConfig(distribution: Record<string, number>): ChartConfiguration {
		return {
			type: 'doughnut',
			data: {
				labels: Object.keys(distribution),
				datasets: [{
					data: Object.values(distribution),
					backgroundColor: [
						'rgba(147, 51, 234, 0.8)',
						'rgba(59, 130, 246, 0.8)',
						'rgba(34, 197, 94, 0.8)',
						'rgba(251, 146, 60, 0.8)'
					],
					borderColor: [
						'rgb(147, 51, 234)',
						'rgb(59, 130, 246)',
						'rgb(34, 197, 94)',
						'rgb(251, 146, 60)'
					],
					borderWidth: 1
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'bottom',
						labels: {
							padding: 15,
							font: {
								size: 12
							}
						}
					},
					tooltip: {
						callbacks: {
							label: (context: any) => {
								const total = (context.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0);
								const value = context.parsed || 0;
								const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
								return `${context.label}: ${value} (${percentage}%)`;
							}
						}
					}
				}
			}
		};
	}
</script>

<script lang="ts">
	// This component is purely for exporting chart configuration functions
	// No visual component needed
</script>

<!-- Empty component - only exports functions -->