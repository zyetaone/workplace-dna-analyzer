import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { prompt, systemPrompt, sessionId } = await request.json();
		
		// Check if OpenAI key is configured
		const openAIKey = process.env.OPENAI_API_KEY;
		
		if (!openAIKey) {
			// Return a placeholder response if no API key
			return json({
				imageUrl: generatePlaceholderImage(),
				description: `3D Workspace Visualization: ${prompt}\n\n[Note: Configure OpenAI API key for actual image generation]`
			});
		}
		
		// Enhance the prompt for better DALL-E 3 results
		const enhancedPrompt = `Professional architectural 3D render of a modern office workspace: ${prompt}. 
		Photorealistic, high quality, architectural visualization, bright natural lighting, 
		modern furniture, professional photography style, 16:9 aspect ratio`;
		
		// Call OpenAI DALL-E 3 API
		const response = await fetch('https://api.openai.com/v1/images/generations', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${openAIKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: 'dall-e-3',
				prompt: enhancedPrompt,
				n: 1,
				size: '1792x1024',
				quality: 'hd',
				style: 'natural'
			})
		});
		
		if (!response.ok) {
			const error = await response.text();
			console.error('DALL-E API error:', error);
			throw new Error(`DALL-E API error: ${response.statusText}`);
		}
		
		const data = await response.json();
		const imageUrl = data.data[0].url;
		const revisedPrompt = data.data[0].revised_prompt;
		
		return json({
			imageUrl,
			description: `Generated 3D visualization based on: "${prompt}"\n\nEnhanced details: ${revisedPrompt}`
		});
		
	} catch (error) {
		console.error('Render API error:', error);
		
		// Return a helpful error with placeholder
		return json({
			imageUrl: generatePlaceholderImage(),
			description: 'Unable to generate image at this time. Please ensure OpenAI API is configured.',
			error: error.message
		});
	}
};

function generatePlaceholderImage(): string {
	// Return a data URL for a placeholder image
	const svg = `
		<svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
			<defs>
				<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
					<stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
				</linearGradient>
			</defs>
			<rect width="800" height="450" fill="url(#bg)"/>
			<text x="400" y="200" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle">
				🏢 3D Workspace Visualization
			</text>
			<text x="400" y="240" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle" opacity="0.8">
				Configure OpenAI API for image generation
			</text>
			<rect x="100" y="280" width="600" height="120" fill="white" opacity="0.1" rx="10"/>
			<text x="400" y="320" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle">
				Your custom workspace design will appear here
			</text>
			<text x="400" y="345" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle">
				Based on your team's Workplace DNA
			</text>
			<text x="400" y="370" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle">
				Powered by ZYETA + AI
			</text>
		</svg>
	`;
	
	// Convert SVG to base64 data URL
	const base64 = Buffer.from(svg).toString('base64');
	return `data:image/svg+xml;base64,${base64}`;
}