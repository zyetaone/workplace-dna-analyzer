import { _ as derived } from "./index.js";
import { getSession, refreshSessionData } from "../remote/xu03kg.js";
import { g as generateWorkplaceDNA } from "./workplace-dna.js";
const SvelteSet = globalThis.Set;
const SvelteMap = globalThis.Map;
class SessionStore {
  // Reactive collections using SvelteMap
  sessionsData = new SvelteMap();
  // Current active session
  currentSessionId = null;
  // Loading states - make these reactive too
  loading = /* @__PURE__ */ new Set();
  errors = /* @__PURE__ */ new Map();
  #currentSession = derived(
    // Derived current session
    () => {
      console.log("[SessionStore] Computing currentSession, sessionId:", this.currentSessionId);
      if (!this.currentSessionId) return null;
      const data = this.sessionsData.get(this.currentSessionId);
      console.log("[SessionStore] Found session data:", data ? "yes" : "no");
      return data?.session || null;
    }
  );
  get currentSession() {
    return this.#currentSession();
  }
  set currentSession($$value) {
    return this.#currentSession($$value);
  }
  #currentAttendees = derived(() => {
    console.log("[SessionStore] Computing currentAttendees, sessionId:", this.currentSessionId);
    if (!this.currentSessionId) return [];
    const data = this.sessionsData.get(this.currentSessionId);
    console.log("[SessionStore] Found attendees:", data?.attendees?.length || 0);
    return data?.attendees || [];
  });
  get currentAttendees() {
    return this.#currentAttendees();
  }
  set currentAttendees($$value) {
    return this.#currentAttendees($$value);
  }
  #activeAttendees = derived(() => this.currentAttendees.filter((a) => !a.completed));
  get activeAttendees() {
    return this.#activeAttendees();
  }
  set activeAttendees($$value) {
    return this.#activeAttendees($$value);
  }
  #completedAttendees = derived(() => this.currentAttendees.filter((a) => a.completed));
  get completedAttendees() {
    return this.#completedAttendees();
  }
  set completedAttendees($$value) {
    return this.#completedAttendees($$value);
  }
  #responseRate = derived(() => {
    const total = this.currentAttendees.length;
    const completed = this.completedAttendees.length;
    return total > 0 ? Math.round(completed / total * 100) : 0;
  });
  get responseRate() {
    return this.#responseRate();
  }
  set responseRate($$value) {
    return this.#responseRate($$value);
  }
  async loadSession(sessionId) {
    const newLoading = new Set(this.loading);
    newLoading.add(sessionId);
    this.loading = newLoading;
    try {
      const data = await getSession(sessionId);
      console.log("[SessionStore] Loaded session data:", {
        sessionId,
        attendeeCount: data.attendees?.length || 0,
        attendees: data.attendees
      });
      this.sessionsData.set(sessionId, {
        session: data,
        attendees: data.attendees || [],
        lastUpdated: /* @__PURE__ */ new Date()
      });
      const newErrors = new Map(this.errors);
      newErrors.delete(sessionId);
      this.errors = newErrors;
    } catch (error) {
      console.error("Failed to load session:", error);
      const newErrors = new Map(this.errors);
      newErrors.set(sessionId, error);
      this.errors = newErrors;
    } finally {
      const newLoading2 = new Set(this.loading);
      newLoading2.delete(sessionId);
      this.loading = newLoading2;
    }
  }
  /**
   * Refresh session data
   */
  async refreshSession(sessionId) {
    try {
      const data = await refreshSessionData(sessionId);
      if (data) {
        console.log("[SessionStore] Refreshed session data:", {
          sessionId,
          attendeeCount: data.attendees?.length || 0,
          completed: data.attendees?.filter((a) => a.completed).length || 0
        });
        this.sessionsData.set(sessionId, {
          session: data,
          attendees: data.attendees || [],
          lastUpdated: /* @__PURE__ */ new Date()
        });
      }
    } catch (error) {
      console.error("Failed to refresh session:", error);
    }
  }
  /**
   * Set the current active session
   */
  setCurrentSession(sessionId) {
    this.currentSessionId = sessionId;
    if (sessionId && !this.sessionsData.has(sessionId)) {
      this.loadSession(sessionId);
    }
  }
  /**
   * Initialize session with data (for SSR)
   */
  initializeSession(sessionId, session, attendees) {
    console.log("[SessionStore] Initializing session with data:", { sessionId, attendeeCount: attendees?.length || 0 });
    this.sessionsData.set(sessionId, {
      session,
      attendees: attendees || [],
      lastUpdated: /* @__PURE__ */ new Date()
    });
    if (!this.currentSessionId) {
      this.currentSessionId = sessionId;
    }
  }
  /**
   * Optimistic update for an attendee
   */
  optimisticAttendeeUpdate(sessionId, attendeeId, updates) {
    const data = this.sessionsData.get(sessionId);
    if (!data) return;
    const attendeeIndex = data.attendees.findIndex((a) => a.id === attendeeId);
    if (attendeeIndex >= 0) {
      const newAttendees = [...data.attendees];
      newAttendees[attendeeIndex] = { ...newAttendees[attendeeIndex], ...updates };
      this.sessionsData.set(sessionId, {
        ...data,
        attendees: newAttendees,
        lastUpdated: /* @__PURE__ */ new Date()
      });
    }
  }
  /**
   * Add a new attendee optimistically
   */
  addAttendee(sessionId, attendee) {
    const data = this.sessionsData.get(sessionId);
    if (!data) return;
    const newAttendees = [...data.attendees, attendee];
    this.sessionsData.set(sessionId, {
      ...data,
      attendees: newAttendees,
      lastUpdated: /* @__PURE__ */ new Date()
    });
  }
  /**
   * Update attendee response optimistically
   */
  updateAttendeeResponse(sessionId, attendeeId, questionIndex, response) {
    const data = this.sessionsData.get(sessionId);
    if (!data) return;
    const attendeeIndex = data.attendees.findIndex((a) => a.id === attendeeId);
    if (attendeeIndex >= 0) {
      const attendee = data.attendees[attendeeIndex];
      const responses = attendee.responses || {};
      responses[questionIndex] = response;
      this.optimisticAttendeeUpdate(sessionId, attendeeId, { responses });
    }
  }
  /**
   * Mark attendee as completed optimistically
   */
  completeAttendee(sessionId, attendeeId, scores) {
    this.optimisticAttendeeUpdate(sessionId, attendeeId, {
      completed: true,
      preferenceScores: scores,
      completedAt: /* @__PURE__ */ (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  /**
   * Check if a session is loaded
   */
  isSessionLoaded(sessionId) {
    return this.sessionsData.has(sessionId);
  }
  /**
   * Get session by ID
   */
  getSession(sessionId) {
    return this.sessionsData.get(sessionId);
  }
  /**
   * Clear all session data
   */
  clear() {
    this.sessionsData.clear();
    this.currentSessionId = null;
    this.loading.clear();
    this.errors.clear();
  }
}
const sessionStore = new SessionStore();
class AnalyticsStore {
  #attendees = derived(
    // Derived from session store
    () => {
      const attendees = sessionStore.currentAttendees;
      console.log("[AnalyticsStore] Derived attendees:", attendees.length);
      return attendees;
    }
  );
  get attendees() {
    return this.#attendees();
  }
  set attendees($$value) {
    return this.#attendees($$value);
  }
  #completed = derived(() => {
    const completed = sessionStore.completedAttendees;
    console.log("[AnalyticsStore] Derived completed:", completed.length);
    return completed;
  });
  get completed() {
    return this.#completed();
  }
  set completed($$value) {
    return this.#completed($$value);
  }
  #generationDistribution = derived(() => {
    const dist = { "Baby Boomer": 0, "Gen X": 0, "Millennial": 0, "Gen Z": 0 };
    this.attendees.forEach((attendee) => {
      if (attendee.generation) {
        dist[attendee.generation] = (dist[attendee.generation] || 0) + 1;
      }
    });
    return dist;
  });
  get generationDistribution() {
    return this.#generationDistribution();
  }
  set generationDistribution($$value) {
    return this.#generationDistribution($$value);
  }
  #preferenceScores = derived(() => {
    console.log("[AnalyticsStore] Computing preference scores, completed count:", this.completed.length);
    if (this.completed.length === 0) {
      return { collaboration: 0, formality: 0, technology: 0, wellness: 0 };
    }
    const totals = this.completed.reduce(
      (acc, attendee) => {
        const scores = attendee.preferenceScores;
        console.log("[AnalyticsStore] Processing attendee:", attendee.name, "scores:", scores);
        if (scores) {
          acc.collaboration += scores.collaboration || 0;
          acc.formality += scores.formality || 0;
          acc.technology += scores.tech || scores.technology || 0;
          acc.wellness += scores.wellness || 0;
        }
        return acc;
      },
      { collaboration: 0, formality: 0, technology: 0, wellness: 0 }
    );
    const multiplier = 1 / this.completed.length;
    const result = {
      collaboration: Math.round(totals.collaboration * multiplier),
      formality: Math.round(totals.formality * multiplier),
      technology: Math.round(totals.technology * multiplier),
      wellness: Math.round(totals.wellness * multiplier)
    };
    console.log("[AnalyticsStore] Computed preference scores:", result);
    return result;
  });
  get preferenceScores() {
    return this.#preferenceScores();
  }
  set preferenceScores($$value) {
    return this.#preferenceScores($$value);
  }
  #generationPreferences = derived(() => {
    const prefs = {};
    ["Baby Boomer", "Gen X", "Millennial", "Gen Z"].forEach((generation) => {
      const genParticipants = this.completed.filter((a) => a.generation === generation);
      if (genParticipants.length > 0) {
        const genTotals = genParticipants.reduce(
          (acc, attendee) => {
            const scores = attendee.preferenceScores;
            if (scores) {
              acc.collaboration += scores.collaboration || 0;
              acc.formality += scores.formality || 0;
              acc.technology += scores.tech || scores.technology || 0;
              acc.wellness += scores.wellness || 0;
            }
            return acc;
          },
          { collaboration: 0, formality: 0, technology: 0, wellness: 0 }
        );
        const genAvg = 1 / genParticipants.length;
        prefs[generation] = {
          collaboration: Math.round(genTotals.collaboration * genAvg),
          formality: Math.round(genTotals.formality * genAvg),
          technology: Math.round(genTotals.technology * genAvg),
          wellness: Math.round(genTotals.wellness * genAvg),
          count: genParticipants.length
        };
      }
    });
    return prefs;
  });
  get generationPreferences() {
    return this.#generationPreferences();
  }
  set generationPreferences($$value) {
    return this.#generationPreferences($$value);
  }
  #workplaceDNA = derived(() => {
    if (this.completed.length === 0) return "";
    return generateWorkplaceDNA(this.preferenceScores);
  });
  get workplaceDNA() {
    return this.#workplaceDNA();
  }
  set workplaceDNA($$value) {
    return this.#workplaceDNA($$value);
  }
  #wordCloudData = derived(() => {
    const items = [];
    if (this.completed.length === 0 || !this.workplaceDNA) {
      return items;
    }
    const { collaboration, formality, technology, wellness } = this.preferenceScores;
    this.workplaceDNA.split(" · ").forEach((component) => {
      items.push({ text: component, size: 60 + Math.random() * 20 });
    });
    if (collaboration >= 7) {
      items.push({ text: "Teamwork", size: 45 }, { text: "Open Space", size: 40 }, { text: "Huddle Rooms", size: 35 }, { text: "Collaboration", size: 42 }, { text: "Co-creation", size: 38 });
    } else if (collaboration >= 4) {
      items.push({ text: "Balanced Teams", size: 40 }, { text: "Flexible Work", size: 35 }, { text: "Hybrid Meetings", size: 33 });
    } else {
      items.push({ text: "Focus Zones", size: 40 }, { text: "Private Offices", size: 35 }, { text: "Deep Work", size: 38 }, { text: "Individual Space", size: 33 });
    }
    if (formality >= 7) {
      items.push({ text: "Professional", size: 45 }, { text: "Executive", size: 40 }, { text: "Boardroom", size: 35 }, { text: "Corporate", size: 38 });
    } else if (formality >= 4) {
      items.push({ text: "Smart Casual", size: 40 }, { text: "Adaptable", size: 35 }, { text: "Dynamic", size: 33 });
    } else {
      items.push({ text: "Relaxed", size: 40 }, { text: "Informal", size: 35 }, { text: "Casual Friday", size: 33 }, { text: "Laid-back", size: 30 });
    }
    if (technology >= 7) {
      items.push({ text: "Smart Office", size: 45 }, { text: "IoT", size: 40 }, { text: "Digital Tools", size: 35 }, { text: "Automation", size: 30 }, { text: "AI-Powered", size: 38 }, { text: "Cloud-First", size: 33 });
    } else if (technology >= 4) {
      items.push({ text: "Hybrid Tech", size: 40 }, { text: "Essential Digital", size: 35 }, { text: "Practical Tools", size: 30 });
    } else {
      items.push({ text: "Analog", size: 40 }, { text: "In-Person", size: 35 }, { text: "Face-to-Face", size: 33 }, { text: "Traditional", size: 30 });
    }
    if (wellness >= 7) {
      items.push({ text: "Wellbeing", size: 45 }, { text: "Biophilic", size: 40 }, { text: "Ergonomic", size: 35 }, { text: "Natural Light", size: 30 }, { text: "Mindfulness", size: 33 }, { text: "Work-Life Balance", size: 38 });
    } else if (wellness >= 4) {
      items.push({ text: "Work-Life", size: 40 }, { text: "Comfort", size: 35 }, { text: "Healthy Options", size: 30 });
    } else {
      items.push({ text: "Efficiency", size: 40 }, { text: "Productivity", size: 35 }, { text: "Performance", size: 33 }, { text: "Results-Driven", size: 30 });
    }
    const dominantGen = Object.entries(this.generationDistribution).filter(([_, count]) => count > 0).sort(([, a], [, b]) => b - a)[0];
    if (dominantGen) {
      const [generation] = dominantGen;
      switch (generation) {
        case "Gen Z":
          items.push({ text: "Sustainable", size: 35 }, { text: "Inclusive", size: 30 }, { text: "Purpose-Driven", size: 28 }, { text: "Social Impact", size: 25 });
          break;
        case "Millennial":
          items.push({ text: "Flexible Hours", size: 35 }, { text: "Remote-First", size: 30 }, { text: "Experience", size: 28 }, { text: "Meaningful Work", size: 25 });
          break;
        case "Gen X":
          items.push({ text: "Work Ethic", size: 35 }, { text: "Results-Driven", size: 30 }, { text: "Pragmatic", size: 28 }, { text: "Self-Reliant", size: 25 });
          break;
        case "Baby Boomer":
          items.push({ text: "Experience", size: 35 }, { text: "Mentorship", size: 30 }, { text: "Leadership", size: 28 }, { text: "Dedication", size: 25 });
          break;
      }
    }
    items.push({ text: "Innovation", size: 25 }, { text: "Culture", size: 25 }, { text: "Growth", size: 20 }, { text: "Community", size: 20 }, { text: "Agile", size: 18 }, { text: "Future of Work", size: 22 });
    return items;
  });
  get wordCloudData() {
    return this.#wordCloudData();
  }
  set wordCloudData($$value) {
    return this.#wordCloudData($$value);
  }
  #activeCount = derived(() => sessionStore.activeAttendees.length);
  get activeCount() {
    return this.#activeCount();
  }
  set activeCount($$value) {
    return this.#activeCount($$value);
  }
  #completedCount = derived(() => this.completed.length);
  get completedCount() {
    return this.#completedCount();
  }
  set completedCount($$value) {
    return this.#completedCount($$value);
  }
  #responseRate = derived(() => sessionStore.responseRate);
  get responseRate() {
    return this.#responseRate();
  }
  set responseRate($$value) {
    return this.#responseRate($$value);
  }
  #generationChartData = derived(() => {
    const labels = Object.keys(this.generationDistribution);
    const data = labels.map((label) => this.generationDistribution[label]);
    return {
      labels,
      datasets: [
        {
          label: "Participants",
          data,
          backgroundColor: [
            "rgba(255, 99, 132, 0.8)",
            "rgba(54, 162, 235, 0.8)",
            "rgba(255, 206, 86, 0.8)",
            "rgba(75, 192, 192, 0.8)"
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)"
          ],
          borderWidth: 2
        }
      ]
    };
  });
  get generationChartData() {
    return this.#generationChartData();
  }
  set generationChartData($$value) {
    return this.#generationChartData($$value);
  }
  #preferenceChartData = derived(() => {
    const { collaboration, formality, technology, wellness } = this.preferenceScores;
    return {
      labels: ["Collaboration", "Formality", "Technology", "Wellness"],
      datasets: [
        {
          label: "Average Score",
          data: [collaboration, formality, technology, wellness],
          backgroundColor: "rgba(75, 192, 192, 0.8)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 2,
          borderRadius: 5,
          barThickness: 40
        }
      ]
    };
  });
  get preferenceChartData() {
    return this.#preferenceChartData();
  }
  set preferenceChartData($$value) {
    return this.#preferenceChartData($$value);
  }
  lastUpdateTime = /* @__PURE__ */ new Date();
  #recentActivity = derived(() => {
    const now = Date.now();
    const lastUpdate = this.lastUpdateTime.getTime();
    const diff = now - lastUpdate;
    if (diff < 5e3) return "Very Active";
    if (diff < 3e4) return "Active";
    if (diff < 6e4) return "Recent";
    return "Idle";
  });
  get recentActivity() {
    return this.#recentActivity();
  }
  set recentActivity($$value) {
    return this.#recentActivity($$value);
  }
  recordActivity() {
    this.lastUpdateTime = /* @__PURE__ */ new Date();
  }
}
const analyticsStore = new AnalyticsStore();
export {
  SvelteSet as S,
  analyticsStore as a,
  sessionStore as s
};
