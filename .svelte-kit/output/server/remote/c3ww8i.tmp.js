import "../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import { q as query, a as command } from "../chunks/query.js";
import { error } from "@sveltejs/kit";
import * as v from "valibot";
import { d as db, s as sessions, a as attendees } from "../chunks/index2.js";
import { eq } from "drizzle-orm";
import { _broadcastEvents } from "../entries/endpoints/api/sessions/_id_/stream/_server.ts.js";
const SessionIdSchema = v.object({
  sessionId: v.string()
});
const EndSessionSchema = v.object({
  sessionId: v.string()
});
const getSessionAnalytics = query(SessionIdSchema, async ({ sessionId }) => {
  const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  if (!session) {
    error(404, "Session not found");
  }
  const sessionAttendees = await db.select().from(attendees).where(eq(attendees.sessionId, sessionId));
  const participants = sessionAttendees;
  const completed = participants.filter((p) => p.completed);
  const genDist = {
    "Baby Boomer": 0,
    "Gen X": 0,
    "Millennial": 0,
    "Gen Z": 0
  };
  participants.forEach((p) => {
    if (p.generation) {
      genDist[p.generation] = (genDist[p.generation] || 0) + 1;
    }
  });
  const scores = { collaboration: 0, formality: 0, technology: 0, wellness: 0 };
  completed.forEach((p) => {
    if (p.preferenceScores) {
      scores.collaboration += p.preferenceScores.collaboration || 0;
      scores.formality += p.preferenceScores.formality || 0;
      scores.technology += p.preferenceScores.tech || p.preferenceScores.technology || 0;
      scores.wellness += p.preferenceScores.wellness || 0;
    }
  });
  const avgMultiplier = completed.length > 0 ? 1 / completed.length : 0;
  Object.keys(scores).forEach((key) => {
    scores[key] = Math.round(scores[key] * avgMultiplier);
  });
  const genPreferences = {};
  ["Baby Boomer", "Gen X", "Millennial", "Gen Z"].forEach((gen) => {
    const genParticipants = completed.filter((p) => p.generation === gen);
    if (genParticipants.length > 0) {
      const genScores = { collaboration: 0, formality: 0, technology: 0, wellness: 0 };
      genParticipants.forEach((p) => {
        if (p.preferenceScores) {
          genScores.collaboration += p.preferenceScores.collaboration || 0;
          genScores.formality += p.preferenceScores.formality || 0;
          genScores.technology += p.preferenceScores.tech || p.preferenceScores.technology || 0;
          genScores.wellness += p.preferenceScores.wellness || 0;
        }
      });
      const genAvg = 1 / genParticipants.length;
      genPreferences[gen] = {
        collaboration: Math.round(genScores.collaboration * genAvg),
        formality: Math.round(genScores.formality * genAvg),
        technology: Math.round(genScores.technology * genAvg),
        wellness: Math.round(genScores.wellness * genAvg),
        count: genParticipants.length
      };
    }
  });
  let workplaceDNA = "";
  if (completed.length > 0) {
    const dnaComponents = [];
    if (scores.collaboration >= 7) dnaComponents.push("Collaborative");
    else if (scores.collaboration >= 4) dnaComponents.push("Balanced");
    else dnaComponents.push("Independent");
    if (scores.formality >= 7) dnaComponents.push("Structured");
    else if (scores.formality >= 4) dnaComponents.push("Flexible");
    else dnaComponents.push("Casual");
    if (scores.technology >= 7) dnaComponents.push("Digital-First");
    else if (scores.technology >= 4) dnaComponents.push("Tech-Enabled");
    else dnaComponents.push("Traditional");
    if (scores.wellness >= 7) dnaComponents.push("Wellness-Focused");
    else if (scores.wellness >= 4) dnaComponents.push("Balance-Aware");
    else dnaComponents.push("Performance-Driven");
    workplaceDNA = dnaComponents.join(" · ");
  }
  const wordCloudData = [];
  if (completed.length > 0 && workplaceDNA) {
    workplaceDNA.split(" · ").forEach((component) => {
      wordCloudData.push({ text: component, size: 60 + Math.random() * 20 });
    });
    if (scores.collaboration >= 7) {
      wordCloudData.push({ text: "Teamwork", size: 45 });
      wordCloudData.push({ text: "Open Space", size: 40 });
      wordCloudData.push({ text: "Huddle Rooms", size: 35 });
    } else if (scores.collaboration >= 4) {
      wordCloudData.push({ text: "Balanced Teams", size: 40 });
      wordCloudData.push({ text: "Flexible Work", size: 35 });
    } else {
      wordCloudData.push({ text: "Focus Zones", size: 40 });
      wordCloudData.push({ text: "Private Offices", size: 35 });
    }
    if (scores.formality >= 7) {
      wordCloudData.push({ text: "Professional", size: 45 });
      wordCloudData.push({ text: "Executive", size: 40 });
      wordCloudData.push({ text: "Boardroom", size: 35 });
    } else if (scores.formality >= 4) {
      wordCloudData.push({ text: "Smart Casual", size: 40 });
      wordCloudData.push({ text: "Adaptable", size: 35 });
    } else {
      wordCloudData.push({ text: "Relaxed", size: 40 });
      wordCloudData.push({ text: "Informal", size: 35 });
    }
    if (scores.technology >= 7) {
      wordCloudData.push({ text: "Smart Office", size: 45 });
      wordCloudData.push({ text: "IoT", size: 40 });
      wordCloudData.push({ text: "Digital Tools", size: 35 });
      wordCloudData.push({ text: "Automation", size: 30 });
    } else if (scores.technology >= 4) {
      wordCloudData.push({ text: "Hybrid Tech", size: 40 });
      wordCloudData.push({ text: "Essential Digital", size: 35 });
    } else {
      wordCloudData.push({ text: "Analog", size: 40 });
      wordCloudData.push({ text: "In-Person", size: 35 });
    }
    if (scores.wellness >= 7) {
      wordCloudData.push({ text: "Wellbeing", size: 45 });
      wordCloudData.push({ text: "Biophilic", size: 40 });
      wordCloudData.push({ text: "Ergonomic", size: 35 });
      wordCloudData.push({ text: "Natural Light", size: 30 });
    } else if (scores.wellness >= 4) {
      wordCloudData.push({ text: "Work-Life", size: 40 });
      wordCloudData.push({ text: "Comfort", size: 35 });
    } else {
      wordCloudData.push({ text: "Efficiency", size: 40 });
      wordCloudData.push({ text: "Productivity", size: 35 });
    }
    const dominantGen = Object.entries(genDist).filter(([_, count]) => count > 0).sort(([, a], [, b]) => b - a)[0];
    if (dominantGen) {
      const [gen, _] = dominantGen;
      if (gen === "Gen Z") {
        wordCloudData.push({ text: "Sustainable", size: 35 });
        wordCloudData.push({ text: "Inclusive", size: 30 });
      } else if (gen === "Millennial") {
        wordCloudData.push({ text: "Flexible Hours", size: 35 });
        wordCloudData.push({ text: "Remote-First", size: 30 });
      } else if (gen === "Gen X") {
        wordCloudData.push({ text: "Work Ethic", size: 35 });
        wordCloudData.push({ text: "Results-Driven", size: 30 });
      } else if (gen === "Baby Boomer") {
        wordCloudData.push({ text: "Experience", size: 35 });
        wordCloudData.push({ text: "Mentorship", size: 30 });
      }
    }
    wordCloudData.push({ text: "Innovation", size: 25 });
    wordCloudData.push({ text: "Culture", size: 25 });
    wordCloudData.push({ text: "Growth", size: 20 });
    wordCloudData.push({ text: "Community", size: 20 });
  }
  return {
    session,
    attendees: sessionAttendees,
    analytics: {
      activeCount: participants.length,
      completedCount: completed.length,
      responseRate: participants.length > 0 ? Math.round(completed.length / participants.length * 100) : 0,
      generationDistribution: genDist,
      preferenceScores: scores,
      generationPreferences: genPreferences,
      workplaceDNA,
      wordCloudData
    }
  };
});
const generateAIInsights = query(SessionIdSchema, async ({ sessionId }) => {
  const analyticsData = await getSessionAnalytics({ sessionId });
  const { analytics } = analyticsData;
  const { preferenceScores: scores, generationDistribution: genDist, completedCount } = analytics;
  const insights = [];
  if (completedCount >= 2) {
    if (scores.collaboration >= 7) {
      insights.push("🤝 Your team highly values collaboration. Consider open office layouts and regular team activities.");
    } else if (scores.collaboration <= 3) {
      insights.push("🎯 Your team prefers independent work. Focus on individual workspaces and async communication.");
    }
    if (scores.technology >= 7) {
      insights.push("💻 This group embraces digital tools. Invest in modern collaboration platforms and automation.");
    } else if (scores.technology <= 3) {
      insights.push("📝 Traditional methods resonate here. Maintain in-person meetings and physical documentation options.");
    }
    if (scores.wellness >= 7) {
      insights.push("🌱 Wellness is a priority. Implement flexible schedules and mental health support programs.");
    }
    const activeGens = Object.keys(genDist).filter((g) => genDist[g] > 0);
    if (activeGens.length > 2) {
      insights.push("🌈 You have a multi-generational team. Create mentorship programs and cross-generation collaboration.");
    }
    if (scores.formality >= 7) {
      insights.push("👔 High formality preference. Maintain clear hierarchies and professional communication standards.");
    } else if (scores.formality <= 3) {
      insights.push("👕 Casual environment preferred. Foster informal communication and flat organizational structures.");
    }
    const openAIKey = process.env.OPENAI_API_KEY;
    if (openAIKey && completedCount >= 5) {
      try {
        insights.push("✨ Based on your unique team composition, consider hybrid work models that balance all preferences.");
      } catch (err) {
        console.error("Failed to generate enhanced insights:", err);
      }
    }
  }
  return insights;
});
const endSession = command(EndSessionSchema, async ({ sessionId }) => {
  try {
    await db.update(sessions).set({
      isActive: false,
      endedAt: /* @__PURE__ */ new Date()
    }).where(eq(sessions.id, sessionId));
    _broadcastEvents.analytics(sessionId, {
      type: "session_ended",
      timestamp: /* @__PURE__ */ new Date()
    });
    return { success: true };
  } catch (err) {
    console.error("Failed to end session:", err);
    error(500, "Failed to end session");
  }
});
const subscribeToSession = query(SessionIdSchema, async ({ sessionId }) => {
  return {
    streamUrl: `/api/sessions/${sessionId}/stream`
  };
});
const DeleteAttendeeSchema = v.object({
  sessionId: v.string(),
  attendeeId: v.string()
});
const deleteAttendee = command(DeleteAttendeeSchema, async ({ sessionId, attendeeId }) => {
  try {
    const [attendee] = await db.select().from(attendees).where(eq(attendees.id, attendeeId));
    if (!attendee || attendee.sessionId !== sessionId) {
      error(404, "Attendee not found in this session");
    }
    await db.delete(attendees).where(eq(attendees.id, attendeeId));
    _broadcastEvents.attendeeDeleted(sessionId, attendeeId);
    return { success: true };
  } catch (err) {
    console.error("Failed to delete attendee:", err);
    error(500, "Failed to delete attendee");
  }
});
export {
  deleteAttendee,
  endSession,
  generateAIInsights,
  getSessionAnalytics,
  subscribeToSession
};
