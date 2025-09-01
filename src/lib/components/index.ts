// Organized component exports by category

// UI Components (organized by function)
export * from './ui';

// Chart Components
export * from './charts';

// Icon Components
export * from './icons';

// Module Components (feature-specific)
export * from './modules';

// Quiz Components
export { default as Quiz } from './Quiz.svelte';
export { default as QuestionRenderer } from './QuestionRenderer.svelte';

// Legacy aliases for backward compatibility
// These maintain the old import paths while using the new organized structure
export { default as TextInput } from './ui/forms/Input.svelte';
export { default as StatusIndicator } from './ui/data/Status.svelte';
export { default as Loading } from './ui/feedback/Feedback.svelte';
export { default as ErrorMessage } from './ui/feedback/Feedback.svelte';
