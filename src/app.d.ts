/// <reference types="@sveltejs/kit" />

declare global {
	namespace App {
		interface Locals {
			presenterId?: string | null;
			sessionId?: string;
			participantId?: string;
			isPresenter?: boolean;
			isParticipant?: boolean;
		}
		
		interface PageData {
			sessionCode?: string;
			participantId?: string;
			session?: any;
			participants?: any[];
			analytics?: any;
			streamUrl?: string;
		}
		
		interface Error {
			message: string;
			code?: string;
		}
	}
}

export {};