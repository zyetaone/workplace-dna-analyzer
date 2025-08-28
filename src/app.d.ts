/// <reference types="@sveltejs/kit" />

declare global {
	namespace App {
		interface Locals {
			participantId?: string;
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