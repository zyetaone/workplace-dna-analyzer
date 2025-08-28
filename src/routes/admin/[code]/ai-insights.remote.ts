/**
 * AI Insights remote functions
 */

import * as v from 'valibot';
import { query } from '$app/server';
import { sessionCodeSchema } from '$lib/validation';
import { getSessionWithAnalytics } from '$lib/server/db-operations';

interface InsightChunk {
  type: 'insight' | 'recommendation' | 'summary' | 'complete';
  content: string;
  category?: 'culture' | 'layout' | 'wellness' | 'tech';
}

/**
 * Generate AI insights
 */
export const generateInsights = query(
  v.object({ code: sessionCodeSchema }),
  async ({ code }) => {
    try {
      const result = await getSessionWithAnalytics(code);
      if (!result) throw new Error('Session not found');
      const { session, participants } = result;
      if (!session) throw new Error('Session not found');

      const completed = participants.filter(p => p.completed && p.preferenceScores);
      
      if (completed.length === 0) {
        return {
          success: false,
          insights: ['Complete more responses to generate detailed insights.']
        };
      }

      // Calculate average scores
      const avgScores = { collaboration: 0, formality: 0, tech: 0, wellness: 0 };
      completed.forEach(p => {
        if (p.preferenceScores) {
          avgScores.collaboration += p.preferenceScores.collaboration || 0;
          avgScores.formality += p.preferenceScores.formality || 0;
          avgScores.tech += p.preferenceScores.tech || 0;
          avgScores.wellness += p.preferenceScores.wellness || 0;
        }
      });

      Object.keys(avgScores).forEach(key => {
        avgScores[key as keyof typeof avgScores] = Math.round(
          avgScores[key as keyof typeof avgScores] / completed.length
        );
      });

      // Generate insights based on data
      const insights = generateInsightChunks(avgScores, participants, session);

      return {
        success: true,
        insights,
        participantCount: participants.length,
        completedCount: completed.length,
        averageScores: avgScores
      };
    } catch (error) {
      console.error('AI Insights error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate insights'
      };
    }
  }
);

function generateInsightChunks(
  scores: Record<string, number>,
  participants: any[],
  session: any
): InsightChunk[] {
  const chunks: InsightChunk[] = [];
  
  // Determine dominant preference
  const dominantTrait = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b);
  const [traitName, traitScore] = dominantTrait;

  // Culture insights
  chunks.push({
    type: 'insight',
    category: 'culture',
    content: `Your team shows a strong ${traitName.toLowerCase()} preference (${traitScore}%), suggesting a ${getTraitDescription(traitName)} workplace culture.`
  });

  // Generation insights
  const generations = participants
    .map(p => p.generation)
    .filter(Boolean)
    .reduce((acc, gen) => ({ ...acc, [gen]: (acc[gen] || 0) + 1 }), {} as Record<string, number>);

  const dominantGen = Object.entries(generations).reduce((a, b) => a[1] > b[1] ? a : b);
  if (dominantGen) {
    chunks.push({
      type: 'insight',
      category: 'culture',
      content: `With ${dominantGen[0]} as the dominant generation (${dominantGen[1]} participants), consider ${getGenerationRecommendation(dominantGen[0])}.`
    });
  }

  // Specific recommendations based on scores
  if (scores.tech > 75) {
    chunks.push({
      type: 'recommendation',
      category: 'tech',
      content: 'High tech preference detected. Invest in smart office technologies, digital collaboration tools, and automated systems.'
    });
  }

  if (scores.wellness > 75) {
    chunks.push({
      type: 'recommendation',
      category: 'wellness',
      content: 'Strong wellness focus. Consider biophilic design, standing desks, meditation rooms, and natural lighting solutions.'
    });
  }

  if (scores.collaboration > 75) {
    chunks.push({
      type: 'recommendation',
      category: 'layout',
      content: 'Team collaboration is key. Design open layouts with flexible furniture, multiple breakout areas, and collaborative zones.'
    });
  }

  if (scores.formality < 40) {
    chunks.push({
      type: 'recommendation',
      category: 'culture',
      content: 'Low formality preference suggests a casual environment. Consider flexible dress codes, informal meeting spaces, and relaxed policies.'
    });
  }

  // Summary
  chunks.push({
    type: 'summary',
    content: `Based on ${participants.length} participants, your ideal workspace should emphasize ${traitName.toLowerCase()}, cater to ${dominantGen ? dominantGen[0] : 'diverse'} preferences, and balance ${getBalanceRecommendation(scores)}.`
  });

  chunks.push({
    type: 'complete',
    content: 'Analysis complete. These insights update in real-time as more participants join.'
  });

  return chunks;
}

function getTraitDescription(trait: string): string {
  const descriptions = {
    collaboration: 'team-oriented and interconnected',
    formality: 'structured and professional',
    tech: 'innovation-driven and digitally-forward',
    wellness: 'health-conscious and balanced'
  };
  return descriptions[trait as keyof typeof descriptions] || 'adaptive';
}

function getGenerationRecommendation(generation: string): string {
  const recommendations = {
    'Gen Z': 'flexible spaces, digital integration, and social areas for networking',
    'Millennials': 'work-life balance features, collaborative tools, and purpose-driven design',
    'Gen X': 'efficient layouts, quiet work areas, and pragmatic solutions',
    'Baby Boomers': 'comfortable seating, good lighting, and traditional meeting spaces'
  };
  return recommendations[generation as keyof typeof recommendations] || 'diverse accommodation strategies';
}

function getBalanceRecommendation(scores: Record<string, number>): string {
  const high = Object.entries(scores).filter(([_, score]) => score > 70).map(([trait]) => trait);
  const low = Object.entries(scores).filter(([_, score]) => score < 40).map(([trait]) => trait);
  
  if (high.length > 2) return 'multiple strong preferences';
  if (low.length > 2) return 'flexible and adaptive approaches';
  
  return `${high.join(' and ')} with moderate ${low.join(' and ')}`;
}