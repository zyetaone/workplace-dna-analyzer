/// <reference types="@sveltejs/kit" />
import type { QuizSession, QuizParticipant, QuizAnalytics } from '$lib/types';
import type { AdminUser } from '$lib/server/db/schema';

declare global {
	namespace App {
		interface Locals {
			participantId?: string;
			user?: AdminUser;
			session: import('$lib/server/auth').SessionValidationResult['session'];
		}

		interface PageData {
			sessionCode?: string;
			participantId?: string;
			session?: QuizSession;
			participants?: QuizParticipant[];
			analytics?: QuizAnalytics;
		}

		interface Error {
			message: string;
			code?: string;
		}
	}
}

export {};
