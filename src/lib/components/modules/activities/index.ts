/**
 * Activities Module - Simple and Clean
 */

// Core Quiz Components (following quiz component pattern)
export { default as Quiz } from '../../Quiz.svelte';
export { default as QuestionRenderer } from '../../QuestionRenderer.svelte';

// Simple Activity Container
export { default as ActivityContainer } from './components/ActivityContainer.svelte';

// Quiz Store (Svelte 5 runes)
export { createQuizStore, type QuizStore } from './quiz-store';
