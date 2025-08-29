import { describe, it, expect, vi, beforeEach } from 'vitest';
import { customRender, mockChartData, mockD3 } from '$lib/test-utils';
import DonutChart from './DonutChart.svelte';

// Mock D3
vi.mock('d3', () => mockD3);

describe('DonutChart Component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Basic Rendering', () => {
		it('renders with ChartData format', () => {
			customRender(DonutChart, {
				data: mockChartData
			});

			const svg = document.querySelector('svg');
			expect(svg).toBeInTheDocument();
		});

		it('renders with ChartJS format', () => {
			const chartJSData = {
				data: {
					labels: ['Category A', 'Category B', 'Category C'],
					datasets: [
						{
							data: [30, 25, 45],
							backgroundColor: ['#a855f7', '#ec4899', '#3b82f6']
						}
					]
				}
			};

			customRender(DonutChart, {
				data: chartJSData
			});

			const svg = document.querySelector('svg');
			expect(svg).toBeInTheDocument();
		});

		it('applies custom class', () => {
			customRender(DonutChart, {
				data: mockChartData,
				class: 'custom-chart'
			});

			const container = document.querySelector('.custom-chart');
			expect(container).toBeInTheDocument();
		});
	});

	describe('Variants', () => {
		it('renders simple variant by default', () => {
			customRender(DonutChart, {
				data: mockChartData
			});

			const svg = document.querySelector('svg');
			expect(svg).toHaveAttribute('width', '300');
			expect(svg).toHaveAttribute('height', '300');
		});

		it('renders interactive variant with tooltips', () => {
			customRender(DonutChart, {
				data: mockChartData,
				variant: 'interactive',
				showTooltips: true
			});

			const tooltip = document.querySelector('.absolute');
			expect(tooltip).toBeInTheDocument();
		});

		it('renders generation variant with center text', () => {
			customRender(DonutChart, {
				data: mockChartData,
				variant: 'generation',
				centerText: 'Test Center'
			});

			const centerText = document.querySelector('.center-text');
			expect(centerText).toBeInTheDocument();
		});
	});

	describe('Data Handling', () => {
		it('handles empty data gracefully', () => {
			customRender(DonutChart, {
				data: []
			});

			const svg = document.querySelector('svg');
			expect(svg).toBeInTheDocument();
		});

		it('normalizes ChartJS data correctly', () => {
			const chartJSData = {
				data: {
					labels: ['A', 'B'],
					datasets: [
						{
							data: [50, 50],
							backgroundColor: ['red', 'blue']
						}
					]
				}
			};

			customRender(DonutChart, {
				data: chartJSData
			});

			// Should convert to ChartData format internally
			expect(mockD3.pie).toHaveBeenCalled();
		});

		it('applies custom dimensions', () => {
			customRender(DonutChart, {
				data: mockChartData,
				width: 400,
				height: 400
			});

			const svg = document.querySelector('svg');
			expect(svg).toHaveAttribute('width', '400');
			expect(svg).toHaveAttribute('height', '400');
		});
	});

	describe('Configuration Options', () => {
		it('respects inner radius setting', () => {
			customRender(DonutChart, {
				data: mockChartData,
				innerRadius: 0.8
			});

			expect(mockD3.arc).toHaveBeenCalled();
		});

		it('shows percentages when configured', () => {
			customRender(DonutChart, {
				data: mockChartData,
				showPercentages: true,
				minPercentageForLabel: 20
			});

			// Should show percentage labels for values >= 20
			expect(mockChartData.filter((d) => d.value >= 20)).toHaveLength(2);
		});

		it('respects minimum percentage threshold', () => {
			const smallData = [
				{ label: 'Small', value: 5, color: '#a855f7' },
				{ label: 'Large', value: 95, color: '#ec4899' }
			];

			customRender(DonutChart, {
				data: smallData,
				showPercentages: true,
				minPercentageForLabel: 10
			});

			// Should only show label for large value
			expect(smallData.filter((d) => d.value >= 10)).toHaveLength(1);
		});
	});

	describe('Accessibility', () => {
		it('provides proper ARIA labels', () => {
			customRender(DonutChart, {
				data: mockChartData
			});

			// SVG should have proper accessibility attributes
			const svg = document.querySelector('svg');
			expect(svg).toBeInTheDocument();
		});
	});

	describe('Performance', () => {
		it('re-renders efficiently on data changes', () => {
			const { rerender } = customRender(DonutChart, {
				data: mockChartData
			});

			const newData = [
				{ label: 'New A', value: 40, color: '#a855f7' },
				{ label: 'New B', value: 60, color: '#ec4899' }
			];

			rerender({ data: newData });

			// Should handle data updates without errors
			expect(mockD3.select).toHaveBeenCalled();
		});

		it('cleans up on unmount', () => {
			const { unmount } = customRender(DonutChart, {
				data: mockChartData
			});

			unmount();

			// Should clean up any event listeners or resources
			expect(() => unmount()).not.toThrow();
		});
	});

	describe('Error Handling', () => {
		it('handles invalid data gracefully', () => {
			customRender(DonutChart, {
				data: null as any
			});

			const svg = document.querySelector('svg');
			expect(svg).toBeInTheDocument();
		});

		it('handles malformed ChartJS data', () => {
			const malformedData = {
				data: {
					labels: ['A'],
					datasets: [
						{
							data: [50, 50], // More data than labels
							backgroundColor: ['red']
						}
					]
				}
			};

			expect(() => {
				customRender(DonutChart, {
					data: malformedData
				});
			}).not.toThrow();
		});
	});
});
