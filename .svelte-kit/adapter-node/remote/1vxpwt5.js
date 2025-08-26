import "../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import { q, a as a$1 } from "../chunks/query.js";
import { error } from "@sveltejs/kit";
import * as v from "valibot";
import { d, s, a } from "../chunks/index3.js";
import { eq, and } from "drizzle-orm";
import { _broadcastEvents } from "../entries/endpoints/api/sessions/_id_/stream/_server.ts.js";
import "../chunks/true.js";
import "../chunks/shared.js";
import "../chunks/paths.js";
const questions = [
  {
    id: 1,
    title: "Which generation do you belong to?",
    type: "single",
    options: [
      {
        id: "baby_boomer",
        label: "Baby Boomers",
        years: "1946-1964",
        emoji: "👔",
        color: "from-amber-400 to-orange-400"
      },
      {
        id: "gen_x",
        label: "Generation X",
        years: "1965-1980",
        emoji: "💼",
        color: "from-red-400 to-pink-400"
      },
      {
        id: "millennial",
        label: "Millennials",
        years: "1981-1996",
        emoji: "💻",
        color: "from-green-400 to-emerald-400"
      },
      {
        id: "gen_z",
        label: "Gen Z",
        years: "1997-2012",
        emoji: "📱",
        color: "from-blue-400 to-indigo-400"
      }
    ]
  },
  {
    id: 2,
    title: "Welcome & Visitor Interaction",
    subtitle: "Client Contact Point",
    type: "single",
    options: [
      {
        id: "vibrant_lounge",
        label: "Vibrant Co-working Lounge",
        description: "Barista bar, informal seating, social buzz",
        emoji: "☕",
        color: "from-yellow-400 to-orange-400",
        values: { collaboration: 9, formality: 2, tech: 7, wellness: 6 }
      },
      {
        id: "classic_reception",
        label: "Classic Reception",
        description: "Formal seating and discreet waiting lounge",
        emoji: "🏛️",
        color: "from-gray-400 to-slate-600",
        values: { collaboration: 3, formality: 9, tech: 4, wellness: 5 }
      }
    ]
  },
  {
    id: 3,
    title: "Workspace Selection",
    subtitle: "Choose Where to Work",
    type: "single",
    options: [
      {
        id: "open_collaborative",
        label: "Open Collaborative Layout",
        description: "Hot desks and casual breakout areas",
        emoji: "🏢",
        color: "from-green-400 to-teal-400",
        values: { collaboration: 10, formality: 3, tech: 8, wellness: 7 }
      },
      {
        id: "mixed_private",
        label: "Mixed Private Offices",
        description: "Formal segregation between spaces",
        emoji: "🚪",
        color: "from-blue-400 to-indigo-400",
        values: { collaboration: 4, formality: 8, tech: 5, wellness: 6 }
      }
    ]
  },
  {
    id: 4,
    title: "Collaboration & Digital Interaction",
    subtitle: "Work Collaboration Setting",
    type: "single",
    options: [
      {
        id: "tech_space",
        label: "Semi-open Tech Space",
        description: "Mobile surfaces and casual seating",
        emoji: "💡",
        color: "from-purple-400 to-pink-400",
        values: { collaboration: 8, formality: 4, tech: 10, wellness: 6 }
      },
      {
        id: "meeting_room",
        label: "Enclosed Meeting Room",
        description: "Privacy frosting, fixed arrangement",
        emoji: "🔒",
        color: "from-red-400 to-rose-400",
        values: { collaboration: 6, formality: 8, tech: 7, wellness: 5 }
      }
    ]
  },
  {
    id: 5,
    title: "Social Interaction",
    subtitle: "Connection Point",
    type: "single",
    options: [
      {
        id: "kitchen_hub",
        label: "Shared Kitchen Hub",
        description: "Communal tables, social nooks",
        emoji: "🍽️",
        color: "from-amber-400 to-yellow-400",
        values: { collaboration: 10, formality: 2, tech: 4, wellness: 8 }
      },
      {
        id: "library_corner",
        label: "Quiet Library Corner",
        description: "One-on-one or small-group chats",
        emoji: "📚",
        color: "from-slate-400 to-gray-400",
        values: { collaboration: 5, formality: 7, tech: 3, wellness: 7 }
      }
    ]
  },
  {
    id: 6,
    title: "Midday Break",
    subtitle: "Rest & Recharge",
    type: "single",
    options: [
      {
        id: "wellness_zone",
        label: "Wellness Zone",
        description: "Mindfulness/meditation capsule",
        emoji: "🧘",
        color: "from-cyan-400 to-blue-400",
        values: { collaboration: 2, formality: 5, tech: 3, wellness: 10 }
      },
      {
        id: "games_lounge",
        label: "Games Lounge",
        description: "Digital gaming and recreation",
        emoji: "🎮",
        color: "from-pink-400 to-purple-400",
        values: { collaboration: 8, formality: 2, tech: 9, wellness: 7 }
      }
    ]
  },
  {
    id: 7,
    title: "After Work Wellness",
    subtitle: "Health & Well-being",
    type: "single",
    options: [
      {
        id: "fitness_studio",
        label: "Fitness Studio",
        description: "On-site gym with group classes",
        emoji: "💪",
        color: "from-orange-400 to-red-400",
        values: { collaboration: 7, formality: 3, tech: 5, wellness: 10 }
      },
      {
        id: "green_terrace",
        label: "Green Terrace",
        description: "Outdoor seating, jogging track",
        emoji: "🌿",
        color: "from-emerald-400 to-green-400",
        values: { collaboration: 5, formality: 2, tech: 2, wellness: 10 }
      }
    ]
  }
];
const AttendeeDataSchema = v.object({
  sessionId: v.string(),
  attendeeId: v.string()
});
const SaveResponseSchema = v.object({
  sessionId: v.string(),
  attendeeId: v.string(),
  questionIndex: v.number(),
  response: v.string(),
  generation: v.optional(v.string())
});
const CompleteQuizSchema = v.object({
  sessionId: v.string(),
  attendeeId: v.string(),
  scores: v.object({
    collaboration: v.number(),
    formality: v.number(),
    tech: v.number(),
    wellness: v.number()
  })
});
const loadAttendeeData = q(AttendeeDataSchema, async ({ sessionId, attendeeId }) => {
  const [session] = await d.select().from(s).where(eq(s.id, sessionId));
  if (!session) {
    error(404, "Session not found");
  }
  const [attendee] = await d.select().from(a).where(
    and(
      eq(a.id, attendeeId),
      eq(a.sessionId, sessionId)
    )
  );
  if (!attendee) {
    error(404, "Attendee not found");
  }
  return {
    session,
    attendee,
    sessionCode: session.code,
    questions
  };
});
const saveResponse = a$1(SaveResponseSchema, async ({ sessionId, attendeeId, questionIndex, response, generation }) => {
  try {
    const [currentAttendee] = await d.select().from(a).where(
      and(
        eq(a.id, attendeeId),
        eq(a.sessionId, sessionId)
      )
    );
    if (!currentAttendee) {
      error(404, "Attendee not found");
    }
    const currentResponses = currentAttendee.responses || {};
    currentResponses[questionIndex] = response;
    const updateData = {
      responses: currentResponses
    };
    if (generation && questionIndex === 0) {
      const generationMap = {
        "baby_boomer": "Baby Boomer",
        "gen_x": "Gen X",
        "millennial": "Millennial",
        "gen_z": "Gen Z"
      };
      updateData.generation = generationMap[generation] || generation;
    }
    await d.update(a).set(updateData).where(
      and(
        eq(a.id, attendeeId),
        eq(a.sessionId, sessionId)
      )
    );
    _broadcastEvents.responseReceived(sessionId, {
      attendeeId,
      questionIndex,
      response,
      timestamp: /* @__PURE__ */ new Date()
    });
    return { success: true };
  } catch (err) {
    console.error("Failed to save response:", err);
    error(500, "Failed to save response");
  }
});
const completeQuiz = a$1(CompleteQuizSchema, async ({ sessionId, attendeeId, scores }) => {
  try {
    console.log("=== COMPLETING QUIZ ===");
    console.log("Session ID:", sessionId);
    console.log("Attendee ID:", attendeeId);
    console.log("Received scores:", JSON.stringify(scores));
    const updateResult = await d.update(a).set({
      completed: true,
      preferenceScores: scores,
      completedAt: (/* @__PURE__ */ new Date()).toISOString()
    }).where(
      and(
        eq(a.id, attendeeId),
        eq(a.sessionId, sessionId)
      )
    );
    console.log("Update result:", updateResult);
    const [updated] = await d.select().from(a).where(eq(a.id, attendeeId));
    console.log("Updated attendee record:", {
      id: updated?.id,
      name: updated?.name,
      completed: updated?.completed,
      preferenceScores: updated?.preferenceScores,
      completedAt: updated?.completedAt
    });
    _broadcastEvents.attendeeCompleted(sessionId, attendeeId, scores);
    return {
      success: true,
      redirect: `/session/${sessionId}/attendee/${attendeeId}/complete`
    };
  } catch (err) {
    console.error("Failed to complete quiz:", err);
    error(500, "Failed to complete quiz");
  }
});
const getProgress = q(AttendeeDataSchema, async ({ sessionId, attendeeId }) => {
  const [attendee] = await d.select().from(a).where(
    and(
      eq(a.id, attendeeId),
      eq(a.sessionId, sessionId)
    )
  );
  if (!attendee) {
    return {
      completed: false,
      responses: {},
      progress: 0
    };
  }
  const responses = attendee.responses || {};
  const answeredCount = Object.keys(responses).length;
  const progress = answeredCount / questions.length * 100;
  return {
    completed: attendee.completed,
    responses,
    progress,
    scores: attendee.preferenceScores
  };
});
for (const [name, fn] of Object.entries({ completeQuiz, getProgress, loadAttendeeData, saveResponse })) {
  fn.__.id = "1vxpwt5/" + name;
  fn.__.name = name;
}
export {
  completeQuiz,
  getProgress,
  loadAttendeeData,
  saveResponse
};
