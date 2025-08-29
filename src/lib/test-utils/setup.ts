import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';

// Mock SvelteKit modules
vi.mock('$app/state', () => ({
	page: vi.fn(() => ({
		params: { code: 'TEST123' },
		url: new URL('http://localhost:5173/TEST123')
	})),
	goto: vi.fn()
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn()
}));

vi.mock('$app/stores', () => ({
	page: {
		subscribe: vi.fn(),
		set: vi.fn()
	},
	navigating: {
		subscribe: vi.fn(),
		set: vi.fn()
	}
}));

// Mock environment variables
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(), // deprecated
		removeListener: vi.fn(), // deprecated
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
});

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
	value: localStorageMock
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn()
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn()
}));

// Cleanup after each test
afterEach(() => {
	vi.clearAllMocks();
});
