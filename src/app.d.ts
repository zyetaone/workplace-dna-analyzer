/// <reference types="@sveltejs/kit" />

declare global {
	namespace App {
		interface Locals {
			presenterId?: string | null;
			sessionId?: string;
			attendeeId?: string;
			isPresenter?: boolean;
			isAttendee?: boolean;
		}
		
		interface PageData {
			sessionCode?: string;
			attendeeId?: string;
			session?: any;
			attendees?: any[];
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