import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { message, systemPrompt, mode, sessionId } = await request.json();
		
		// Check if OpenAI key is configured
		const openAIKey = process.env.OPENAI_API_KEY;
		
		if (!openAIKey) {
			// Return a helpful fallback response if no API key
			return json({
				response: generateFallbackResponse(message, mode)
			});
		}
		
		// Call OpenAI API with latest format
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${openAIKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: 'gpt-4-turbo',  // Latest model name
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: message }
				],
				temperature: 0.8,
				max_tokens: 1000,
				stream: false  // Explicitly disable streaming
			})
		});
		
		if (!response.ok) {
			throw new Error(`OpenAI API error: ${response.statusText}`);
		}
		
		const data = await response.json();
		const aiResponse = data.choices[0].message.content;
		
		return json({
			response: aiResponse
		});
		
	} catch (error) {
		console.error('Chat API error:', error);
		return json({
			response: 'I apologize, but I encountered an error processing your request. Please try again.',
			error: error.message
		}, { status: 500 });
	}
};

function generateFallbackResponse(message: string, mode: string): string {
	const lowerMessage = message.toLowerCase();
	
	switch (mode) {
		case 'workspace':
			if (lowerMessage.includes('collaborative') || lowerMessage.includes('collaboration')) {
				return `Based on your collaborative culture, I recommend:

🏢 **Open Layout Design**
- Activity-based working zones with varied seating options
- Huddle rooms with writable walls for spontaneous collaboration
- Central collaboration hub with comfortable seating and tech integration
- Phone booths for private calls without disrupting the open environment

**Materials & Aesthetics:**
- Glass partitions to maintain visual connectivity
- Natural wood and plant elements for biophilic design
- Modular furniture that can be reconfigured for different team sizes

Would you like me to elaborate on any specific aspect of this design?`;
			}
			
			if (lowerMessage.includes('wellness') || lowerMessage.includes('wellbeing')) {
				return `For a wellness-focused workspace, consider:

🌿 **Wellbeing-Centered Design**
- Dedicated wellness zones with meditation/quiet areas
- Standing desks and ergonomic seating throughout
- Natural lighting maximization with circadian rhythm support
- Air purification systems and abundant greenery

**Special Features:**
- On-site fitness area or yoga space
- Healthy snack stations and hydration points
- Outdoor terraces or rooftop gardens
- Acoustic design for reduced noise stress

These elements support both physical and mental wellbeing. What aspect interests you most?`;
			}
			
			return `Based on your workspace preferences, here are some design recommendations:

**Key Design Elements:**
- Flexible zones that balance collaboration and focus work
- Technology-enabled meeting spaces with seamless connectivity
- Biophilic design elements for improved wellbeing
- Adaptable furniture systems for changing needs

**ZYETA Philosophy:**
Following our "Spaces that Work, Work that Inspires" approach, the design should reflect your unique organizational culture while promoting productivity and employee satisfaction.

What specific area would you like to explore further?`;
			
		case 'brainstorm':
			const concepts = [
				'The Innovation Greenhouse - A tech-enabled botanical workspace',
				'Digital Nomad\'s Oasis - Flexible hot-desking with resort vibes',
				'The Collaboration Canvas - An artistic, creative workspace',
				'Zen Tech Hub - Minimalist design meets cutting-edge technology',
				'The Living Lab - Experimental workspace with modular everything'
			];
			
			return `Let's brainstorm some creative workspace concepts:

💡 **Concept Ideas:**
${concepts.map((c, i) => `${i + 1}. **${c}**`).join('\n')}

**Concept: ${concepts[0]}**
Imagine a workspace where nature and technology seamlessly blend. Glass pods resembling greenhouses serve as meeting rooms, surrounded by living walls. Smart climate control maintains perfect conditions while AR displays overlay digital information onto natural elements.

**Tagline:** "Where Ideas Grow Naturally"

Which concept resonates with your vision? I can develop any of these further!`;
			
		case 'render':
			return `I'll help you visualize this workspace concept:

🎨 **3D Visualization Description:**

**Scene:** A modern open office bathed in natural light from floor-to-ceiling windows. The space features:

**Layout:**
- Organic flowing desk arrangements that encourage movement
- Glass-enclosed meeting pods with living walls
- Central collaboration area with stadium seating
- Private focus booths along the perimeter

**Materials & Colors:**
- Warm wood tones contrasting with white surfaces
- Pops of brand colors in furniture and art
- Polished concrete floors with area rugs for comfort
- Abundant greenery integrated throughout

**Lighting:**
- Natural daylight supplemented by warm LED strips
- Task lighting at individual workstations
- Dramatic pendant lights over collaboration zones

This creates a photorealistic rendering showcasing a harmonious blend of nature, technology, and human-centered design.

[Note: Enable OpenAI API for actual image generation]`;
			
		default:
			return 'I can help you with workspace design, brainstorming concepts, or visualizing ideas. Please select a mode and share your requirements!';
	}
}