import { Y as derived, G as push, O as push_element, Q as pop_element, K as pop, F as FILENAME, T as escape_html, Z as ensure_array_like, W as attr_style, X as stringify } from "../../../../../chunks/index.js";
import { p as page } from "../../../../../chunks/index2.js";
import "../../../../../chunks/client.js";
import { getSession, refreshSessionData } from "../../../../../remote/xu03kg.js";
import { g as generateWorkplaceDNA } from "../../../../../chunks/workplace-dna.js";
import "clsx";
import "chart.js/auto";
import "../../../../../remote/c3ww8i.js";
import { marked } from "marked";
import "d3";
import "d3-cloud";
const SvelteSet = globalThis.Set;
const SvelteMap = globalThis.Map;
class SessionStore {
  // Reactive collections using SvelteMap
  sessionsData = new SvelteMap();
  // Current active session
  currentSessionId = null;
  // Loading states
  loading = /* @__PURE__ */ new Set();
  errors = /* @__PURE__ */ new Map();
  #currentSession = derived(
    // Derived current session
    () => {
      if (!this.currentSessionId) return null;
      const data = this.sessionsData.get(this.currentSessionId);
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
    if (!this.currentSessionId) return [];
    const data = this.sessionsData.get(this.currentSessionId);
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
    this.loading.add(sessionId);
    try {
      const data = await getSession(sessionId);
      this.sessionsData.set(sessionId, {
        session: data,
        attendees: data.attendees || [],
        lastUpdated: /* @__PURE__ */ new Date()
      });
      this.errors.delete(sessionId);
    } catch (error) {
      console.error("Failed to load session:", error);
      this.errors.set(sessionId, error);
    } finally {
      this.loading.delete(sessionId);
    }
  }
  /**
   * Refresh session data
   */
  async refreshSession(sessionId) {
    try {
      const data = await refreshSessionData(sessionId);
      if (data) {
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
  #attendees = derived(() => sessionStore.currentAttendees);
  get attendees() {
    return this.#attendees();
  }
  set attendees($$value) {
    return this.#attendees($$value);
  }
  #completed = derived(() => sessionStore.completedAttendees);
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
    if (this.completed.length === 0) {
      return { collaboration: 0, formality: 0, technology: 0, wellness: 0 };
    }
    const totals = this.completed.reduce(
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
    const multiplier = 1 / this.completed.length;
    return {
      collaboration: Math.round(totals.collaboration * multiplier),
      formality: Math.round(totals.formality * multiplier),
      technology: Math.round(totals.technology * multiplier),
      wellness: Math.round(totals.wellness * multiplier)
    };
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
class RealtimeStore {
  // Connection state
  connectionStatus = "connecting";
  reconnectAttempts = 0;
  lastEventTime = /* @__PURE__ */ new Date();
  // Pending updates for reconciliation
  pendingUpdates = new SvelteSet();
  updateQueue = [];
  // Throttling for batch updates
  updateTimer = null;
  UPDATE_DELAY = 500;
  // ms
  // Statistics
  eventsReceived = 0;
  optimisticUpdates = 0;
  reconciliations = 0;
  /**
   * Handle SSE connection established
   */
  handleConnected() {
    console.log("🔗 Realtime: SSE connected");
    this.connectionStatus = "connected";
    this.reconnectAttempts = 0;
    this.reconcilePending();
  }
  /**
   * Handle SSE disconnection
   */
  handleDisconnected() {
    console.log("❌ Realtime: SSE disconnected");
    this.connectionStatus = "disconnected";
    this.reconnectAttempts++;
  }
  /**
   * Handle attendee joined event
   */
  handleAttendeeJoined(event) {
    const { sessionId, ...attendeeData } = event.detail;
    this.eventsReceived++;
    this.lastEventTime = /* @__PURE__ */ new Date();
    analyticsStore.recordActivity();
    const updateKey = `${sessionId}-${attendeeData.id}`;
    if (this.pendingUpdates.has(updateKey)) {
      this.pendingUpdates.delete(updateKey);
      return;
    }
    sessionStore.addAttendee(sessionId, attendeeData);
  }
  /**
   * Handle response received event
   */
  handleResponseReceived(event) {
    const { sessionId, attendeeId, questionIndex, response } = event.detail;
    this.eventsReceived++;
    this.lastEventTime = /* @__PURE__ */ new Date();
    analyticsStore.recordActivity();
    const updateKey = `${sessionId}-${attendeeId}-${questionIndex}`;
    if (this.pendingUpdates.has(updateKey)) {
      this.pendingUpdates.delete(updateKey);
      return;
    }
    sessionStore.updateAttendeeResponse(sessionId, attendeeId, questionIndex, response);
  }
  /**
   * Handle attendee completed event
   */
  handleAttendeeCompleted(event) {
    const { sessionId, attendeeId, scores } = event.detail;
    this.eventsReceived++;
    this.lastEventTime = /* @__PURE__ */ new Date();
    analyticsStore.recordActivity();
    const updateKey = `${sessionId}-${attendeeId}-complete`;
    if (this.pendingUpdates.has(updateKey)) {
      this.pendingUpdates.delete(updateKey);
      return;
    }
    sessionStore.completeAttendee(sessionId, attendeeId, scores);
  }
  /**
   * Handle analytics update event
   */
  handleAnalyticsUpdate(event) {
    const { sessionId } = event.detail;
    this.eventsReceived++;
    this.lastEventTime = /* @__PURE__ */ new Date();
    analyticsStore.recordActivity();
    this.scheduleRefresh(sessionId);
  }
  /**
   * Queue an optimistic update
   */
  queueOptimisticUpdate(update) {
    this.optimisticUpdates++;
    const key = `${update.sessionId}-${update.attendeeId}${update.type === "response" ? `-${update.data.questionIndex}` : update.type === "complete" ? "-complete" : ""}`;
    this.pendingUpdates.add(key);
    this.updateQueue = [...this.updateQueue, update];
    switch (update.type) {
      case "response":
        sessionStore.updateAttendeeResponse(update.sessionId, update.attendeeId, update.data.questionIndex, update.data.response);
        break;
      case "complete":
        sessionStore.completeAttendee(update.sessionId, update.attendeeId, update.data.scores);
        break;
      case "join":
        sessionStore.addAttendee(update.sessionId, update.data);
        break;
    }
  }
  /**
   * Reconcile pending updates with server
   */
  async reconcilePending() {
    if (this.pendingUpdates.size === 0) return;
    this.reconciliations++;
    const sessionIds = /* @__PURE__ */ new Set();
    this.updateQueue.forEach((update) => sessionIds.add(update.sessionId));
    for (const sessionId of sessionIds) {
      try {
        await sessionStore.refreshSession(sessionId);
      } catch (error) {
        console.error("Failed to reconcile session:", sessionId, error);
      }
    }
    const cutoff = Date.now() - 5e3;
    this.updateQueue = this.updateQueue.filter((u) => u.timestamp > cutoff);
    const remainingKeys = /* @__PURE__ */ new Set();
    this.updateQueue.forEach((update) => {
      const key = `${update.sessionId}-${update.attendeeId}${update.type === "response" ? `-${update.data.questionIndex}` : update.type === "complete" ? "-complete" : ""}`;
      remainingKeys.add(key);
    });
    this.pendingUpdates = new SvelteSet(remainingKeys);
  }
  /**
   * Schedule a throttled refresh
   */
  scheduleRefresh(sessionId) {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }
    this.updateTimer = setTimeout(
      () => {
        sessionStore.refreshSession(sessionId);
        this.updateTimer = null;
      },
      this.UPDATE_DELAY
    );
  }
  /**
   * Create event handler attachment for components
   */
  createEventHandler() {
    return (node) => {
      const handlers = {
        "realtime:connected": () => this.handleConnected(),
        "realtime:disconnected": () => this.handleDisconnected(),
        "realtime:attendee_joined": (e) => this.handleAttendeeJoined(e),
        "realtime:response_received": (e) => this.handleResponseReceived(e),
        "realtime:attendee_completed": (e) => this.handleAttendeeCompleted(e),
        "realtime:analytics": (e) => this.handleAnalyticsUpdate(e)
      };
      Object.entries(handlers).forEach(([event, handler]) => {
        node.addEventListener(event, handler);
      });
      return () => {
        Object.entries(handlers).forEach(([event, handler]) => {
          node.removeEventListener(event, handler);
        });
      };
    };
  }
  /**
   * Get connection health status
   */
  get connectionHealth() {
    const now = Date.now();
    const lastEvent = this.lastEventTime.getTime();
    const timeSinceEvent = now - lastEvent;
    if (this.connectionStatus !== "connected") return "disconnected";
    if (timeSinceEvent < 5e3) return "excellent";
    if (timeSinceEvent < 3e4) return "good";
    if (timeSinceEvent < 6e4) return "fair";
    return "poor";
  }
  /**
   * Get statistics
   */
  get stats() {
    return {
      eventsReceived: this.eventsReceived,
      optimisticUpdates: this.optimisticUpdates,
      reconciliations: this.reconciliations,
      pendingCount: this.pendingUpdates.size,
      queueLength: this.updateQueue.length,
      connectionHealth: this.connectionHealth
    };
  }
  /**
   * Reset store
   */
  reset() {
    this.connectionStatus = "connecting";
    this.reconnectAttempts = 0;
    this.eventsReceived = 0;
    this.optimisticUpdates = 0;
    this.reconciliations = 0;
    this.pendingUpdates.clear();
    this.updateQueue = [];
    this.lastEventTime = /* @__PURE__ */ new Date();
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
  }
}
const realtimeStore = new RealtimeStore();
UnifiedChatbot[FILENAME] = "src/lib/components/UnifiedChatbot.svelte";
function UnifiedChatbot($$payload, $$props) {
  push(UnifiedChatbot);
  let { analytics, sessionId } = $$props;
  marked.setOptions({ breaks: true, gfm: true });
  $$payload.out.push(`<button class="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40 hover:scale-110 svelte-16somke" title="Open AI Assistant">`);
  push_element($$payload, "button", 244, 0);
  $$payload.out.push(`<span class="text-2xl svelte-16somke">`);
  push_element($$payload, "span", 249, 1);
  $$payload.out.push(`🤖</span>`);
  pop_element();
  $$payload.out.push(`</button>`);
  pop_element();
  $$payload.out.push(` `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  pop();
}
UnifiedChatbot.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
_page[FILENAME] = "src/routes/session/[sessionId]/presenter/+page.svelte";
function _page($$payload, $$props) {
  push(_page);
  let sessionId = page.params.sessionId;
  let session = sessionStore.currentSession;
  let sessionCode = session?.code || "";
  let attendees = sessionStore.currentAttendees;
  let isLoading = sessionStore.loading.has(sessionId);
  let connectionStatus = realtimeStore.connectionStatus;
  let aiInsights = [];
  let analytics = {
    activeCount: analyticsStore.activeCount,
    completedCount: analyticsStore.completedCount,
    responseRate: analyticsStore.responseRate,
    generationDistribution: analyticsStore.generationDistribution,
    preferenceScores: analyticsStore.preferenceScores,
    generationPreferences: analyticsStore.generationPreferences,
    workplaceDNA: analyticsStore.workplaceDNA,
    wordCloudData: analyticsStore.wordCloudData,
    aiInsights
  };
  realtimeStore.createEventHandler();
  $$payload.out.push(`<div class="min-h-screen animated-gradient">`);
  push_element($$payload, "div", 550, 0);
  $$payload.out.push(`<div class="container mx-auto px-6 py-12">`);
  push_element($$payload, "div", 559, 1);
  $$payload.out.push(`<div class="bg-white rounded-lg shadow-lg p-8 mb-8">`);
  push_element($$payload, "div", 561, 2);
  $$payload.out.push(`<div class="flex justify-between items-start">`);
  push_element($$payload, "div", 562, 3);
  $$payload.out.push(`<div>`);
  push_element($$payload, "div", 563, 4);
  $$payload.out.push(`<h1 class="text-4xl font-bold text-gray-800 mb-2">`);
  push_element($$payload, "h1", 564, 5);
  $$payload.out.push(`Presenter Dashboard</h1>`);
  pop_element();
  $$payload.out.push(` <p class="text-gray-600">`);
  push_element($$payload, "p", 565, 5);
  $$payload.out.push(`Session Code: <span class="font-mono text-2xl text-gray-700">`);
  push_element($$payload, "span", 565, 44);
  $$payload.out.push(`${escape_html(sessionCode)}</span>`);
  pop_element();
  $$payload.out.push(`</p>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(` <div class="flex items-center gap-2">`);
  push_element($$payload, "div", 567, 4);
  $$payload.out.push(`<span class="relative flex h-3 w-3">`);
  push_element($$payload, "span", 568, 5);
  if (connectionStatus === "connected") {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75">`);
    push_element($$payload, "span", 570, 7);
    $$payload.out.push(`</span>`);
    pop_element();
    $$payload.out.push(` <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500">`);
    push_element($$payload, "span", 571, 7);
    $$payload.out.push(`</span>`);
    pop_element();
  } else {
    $$payload.out.push("<!--[!-->");
    if (connectionStatus === "connecting") {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<span class="animate-pulse relative inline-flex rounded-full h-3 w-3 bg-yellow-500">`);
      push_element($$payload, "span", 573, 7);
      $$payload.out.push(`</span>`);
      pop_element();
    } else {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`<span class="relative inline-flex rounded-full h-3 w-3 bg-red-500">`);
      push_element($$payload, "span", 575, 7);
      $$payload.out.push(`</span>`);
      pop_element();
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></span>`);
  pop_element();
  $$payload.out.push(` <span class="text-sm font-medium text-gray-700 capitalize">`);
  push_element($$payload, "span", 578, 5);
  $$payload.out.push(`${escape_html(connectionStatus)}</span>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(` `);
  if (isLoading) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="bg-white rounded-lg shadow-lg p-8">`);
    push_element($$payload, "div", 586, 3);
    $$payload.out.push(`<p class="text-gray-600">`);
    push_element($$payload, "p", 587, 4);
    $$payload.out.push(`Loading session data...</p>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<div class="grid md:grid-cols-2 gap-8 mb-8">`);
    push_element($$payload, "div", 591, 3);
    $$payload.out.push(`<div class="bg-white rounded-lg shadow-lg p-8">`);
    push_element($$payload, "div", 593, 4);
    $$payload.out.push(`<h2 class="text-2xl font-semibold text-gray-800 mb-4">`);
    push_element($$payload, "h2", 594, 5);
    $$payload.out.push(`Join Session</h2>`);
    pop_element();
    $$payload.out.push(` `);
    {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`<div class="animate-pulse bg-gray-200 h-64 rounded">`);
      push_element($$payload, "div", 604, 6);
      $$payload.out.push(`</div>`);
      pop_element();
    }
    $$payload.out.push(`<!--]--></div>`);
    pop_element();
    $$payload.out.push(` <div class="bg-white rounded-lg shadow-lg p-8">`);
    push_element($$payload, "div", 609, 4);
    $$payload.out.push(`<h2 class="text-2xl font-semibold text-gray-800 mb-6">`);
    push_element($$payload, "h2", 610, 5);
    $$payload.out.push(`Live Statistics</h2>`);
    pop_element();
    $$payload.out.push(` <div class="space-y-4">`);
    push_element($$payload, "div", 611, 5);
    $$payload.out.push(`<div class="flex justify-between items-center p-4 bg-gray-50 rounded">`);
    push_element($$payload, "div", 612, 6);
    $$payload.out.push(`<span class="text-gray-700">`);
    push_element($$payload, "span", 613, 7);
    $$payload.out.push(`Active Participants</span>`);
    pop_element();
    $$payload.out.push(` <span class="text-3xl font-bold text-gray-600">`);
    push_element($$payload, "span", 614, 7);
    $$payload.out.push(`${escape_html(analytics.activeCount)}</span>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(` <div class="flex justify-between items-center p-4 bg-gray-50 rounded">`);
    push_element($$payload, "div", 616, 6);
    $$payload.out.push(`<span class="text-gray-700">`);
    push_element($$payload, "span", 617, 7);
    $$payload.out.push(`Completed</span>`);
    pop_element();
    $$payload.out.push(` <span class="text-3xl font-bold text-green-600">`);
    push_element($$payload, "span", 618, 7);
    $$payload.out.push(`${escape_html(analytics.completedCount)}</span>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(` <div class="flex justify-between items-center p-4 bg-gray-50 rounded">`);
    push_element($$payload, "div", 620, 6);
    $$payload.out.push(`<span class="text-gray-700">`);
    push_element($$payload, "span", 621, 7);
    $$payload.out.push(`Response Rate</span>`);
    pop_element();
    $$payload.out.push(` <span class="text-3xl font-bold text-gray-600">`);
    push_element($$payload, "span", 622, 7);
    $$payload.out.push(`${escape_html(analytics.responseRate)}%</span>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(` <div class="grid md:grid-cols-2 gap-8 mb-8">`);
    push_element($$payload, "div", 629, 3);
    $$payload.out.push(`<div class="bg-white rounded-lg shadow-lg p-8">`);
    push_element($$payload, "div", 631, 4);
    $$payload.out.push(`<h2 class="text-2xl font-semibold text-gray-800 mb-4">`);
    push_element($$payload, "h2", 632, 5);
    $$payload.out.push(`Generation Distribution</h2>`);
    pop_element();
    $$payload.out.push(` <div class="relative" style="height: 300px;">`);
    push_element($$payload, "div", 633, 5);
    $$payload.out.push(`<canvas id="generationChart">`);
    push_element($$payload, "canvas", 634, 6);
    $$payload.out.push(`</canvas>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(` <div class="bg-white rounded-lg shadow-lg p-8">`);
    push_element($$payload, "div", 639, 4);
    $$payload.out.push(`<h2 class="text-2xl font-semibold text-gray-800 mb-4">`);
    push_element($$payload, "h2", 640, 5);
    $$payload.out.push(`Average Preferences</h2>`);
    pop_element();
    $$payload.out.push(` <div class="relative" style="height: 300px;">`);
    push_element($$payload, "div", 641, 5);
    $$payload.out.push(`<canvas id="preferenceChart">`);
    push_element($$payload, "canvas", 642, 6);
    $$payload.out.push(`</canvas>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(` <div class="grid md:grid-cols-2 gap-8 mb-8">`);
    push_element($$payload, "div", 648, 3);
    $$payload.out.push(`<div class="bg-white rounded-lg shadow-lg p-8">`);
    push_element($$payload, "div", 650, 4);
    $$payload.out.push(`<h2 class="text-2xl font-semibold text-gray-800 mb-4">`);
    push_element($$payload, "h2", 651, 5);
    $$payload.out.push(`Generation Comparison</h2>`);
    pop_element();
    $$payload.out.push(` <div class="relative" style="height: 300px;">`);
    push_element($$payload, "div", 652, 5);
    $$payload.out.push(`<canvas id="comparisonChart">`);
    push_element($$payload, "canvas", 653, 6);
    $$payload.out.push(`</canvas>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(` <div class="bg-white rounded-lg shadow-lg p-8">`);
    push_element($$payload, "div", 658, 4);
    $$payload.out.push(`<h2 class="text-2xl font-semibold text-gray-800 mb-4">`);
    push_element($$payload, "h2", 659, 5);
    $$payload.out.push(`Preference Trends by Generation</h2>`);
    pop_element();
    $$payload.out.push(` <div class="relative" style="height: 300px;">`);
    push_element($$payload, "div", 660, 5);
    $$payload.out.push(`<canvas id="detailChart">`);
    push_element($$payload, "canvas", 661, 6);
    $$payload.out.push(`</canvas>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(` <div class="grid md:grid-cols-2 gap-8 mb-8">`);
    push_element($$payload, "div", 667, 3);
    $$payload.out.push(`<div class="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-lg p-8">`);
    push_element($$payload, "div", 669, 4);
    $$payload.out.push(`<h2 class="text-2xl font-semibold text-gray-800 mb-4">`);
    push_element($$payload, "h2", 670, 5);
    $$payload.out.push(`Workplace DNA Profile</h2>`);
    pop_element();
    $$payload.out.push(` `);
    if (analytics.workplaceDNA) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="text-center py-8">`);
      push_element($$payload, "div", 672, 6);
      $$payload.out.push(`<div class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">`);
      push_element($$payload, "div", 673, 7);
      $$payload.out.push(`${escape_html(analytics.workplaceDNA)}</div>`);
      pop_element();
      $$payload.out.push(` <div class="grid grid-cols-2 gap-4 mt-6">`);
      push_element($$payload, "div", 676, 7);
      $$payload.out.push(`<div class="bg-white rounded-lg p-4 shadow">`);
      push_element($$payload, "div", 677, 8);
      $$payload.out.push(`<div class="text-3xl font-bold text-blue-600">`);
      push_element($$payload, "div", 678, 9);
      $$payload.out.push(`${escape_html(analytics.preferenceScores.collaboration)}</div>`);
      pop_element();
      $$payload.out.push(` <div class="text-sm text-gray-600">`);
      push_element($$payload, "div", 679, 9);
      $$payload.out.push(`Collaboration</div>`);
      pop_element();
      $$payload.out.push(`</div>`);
      pop_element();
      $$payload.out.push(` <div class="bg-white rounded-lg p-4 shadow">`);
      push_element($$payload, "div", 681, 8);
      $$payload.out.push(`<div class="text-3xl font-bold text-amber-600">`);
      push_element($$payload, "div", 682, 9);
      $$payload.out.push(`${escape_html(analytics.preferenceScores.formality)}</div>`);
      pop_element();
      $$payload.out.push(` <div class="text-sm text-gray-600">`);
      push_element($$payload, "div", 683, 9);
      $$payload.out.push(`Formality</div>`);
      pop_element();
      $$payload.out.push(`</div>`);
      pop_element();
      $$payload.out.push(` <div class="bg-white rounded-lg p-4 shadow">`);
      push_element($$payload, "div", 685, 8);
      $$payload.out.push(`<div class="text-3xl font-bold text-green-600">`);
      push_element($$payload, "div", 686, 9);
      $$payload.out.push(`${escape_html(analytics.preferenceScores.technology)}</div>`);
      pop_element();
      $$payload.out.push(` <div class="text-sm text-gray-600">`);
      push_element($$payload, "div", 687, 9);
      $$payload.out.push(`Technology</div>`);
      pop_element();
      $$payload.out.push(`</div>`);
      pop_element();
      $$payload.out.push(` <div class="bg-white rounded-lg p-4 shadow">`);
      push_element($$payload, "div", 689, 8);
      $$payload.out.push(`<div class="text-3xl font-bold text-red-600">`);
      push_element($$payload, "div", 690, 9);
      $$payload.out.push(`${escape_html(analytics.preferenceScores.wellness)}</div>`);
      pop_element();
      $$payload.out.push(` <div class="text-sm text-gray-600">`);
      push_element($$payload, "div", 691, 9);
      $$payload.out.push(`Wellness</div>`);
      pop_element();
      $$payload.out.push(`</div>`);
      pop_element();
      $$payload.out.push(`</div>`);
      pop_element();
      $$payload.out.push(`</div>`);
      pop_element();
    } else {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`<div class="text-center py-12 text-gray-500">`);
      push_element($$payload, "div", 696, 6);
      $$payload.out.push(`Waiting for participants to complete the quiz...</div>`);
      pop_element();
    }
    $$payload.out.push(`<!--]--></div>`);
    pop_element();
    $$payload.out.push(` <div class="bg-gradient-to-br from-white to-blue-50 rounded-lg shadow-lg p-8">`);
    push_element($$payload, "div", 703, 4);
    $$payload.out.push(`<h2 class="text-2xl font-semibold text-gray-800 mb-4">`);
    push_element($$payload, "h2", 704, 5);
    $$payload.out.push(`Conceptual Trends Cloud</h2>`);
    pop_element();
    $$payload.out.push(` <div id="wordCloudContainer" style="height: 400px; width: 100%;">`);
    push_element($$payload, "div", 705, 5);
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(` `);
    if (analytics.aiInsights && analytics.aiInsights.length > 0) {
      $$payload.out.push("<!--[-->");
      const each_array = ensure_array_like(analytics.aiInsights);
      $$payload.out.push(`<div class="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg shadow-lg p-8 mb-8">`);
      push_element($$payload, "div", 711, 4);
      $$payload.out.push(`<h2 class="text-2xl font-semibold text-gray-800 mb-6">`);
      push_element($$payload, "h2", 712, 5);
      $$payload.out.push(`🤖 AI Workplace Insights</h2>`);
      pop_element();
      $$payload.out.push(` <div class="grid md:grid-cols-2 gap-4">`);
      push_element($$payload, "div", 715, 5);
      $$payload.out.push(`<!--[-->`);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let insight = each_array[$$index];
        $$payload.out.push(`<div class="bg-white rounded-lg p-4 shadow">`);
        push_element($$payload, "div", 717, 7);
        $$payload.out.push(`<p class="text-gray-700">`);
        push_element($$payload, "p", 718, 8);
        $$payload.out.push(`${escape_html(insight)}</p>`);
        pop_element();
        $$payload.out.push(`</div>`);
        pop_element();
      }
      $$payload.out.push(`<!--]--></div>`);
      pop_element();
      $$payload.out.push(`</div>`);
      pop_element();
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> <div class="bg-white rounded-lg shadow-lg p-8">`);
    push_element($$payload, "div", 727, 3);
    $$payload.out.push(`<h2 class="text-2xl font-semibold text-gray-800 mb-4">`);
    push_element($$payload, "h2", 728, 4);
    $$payload.out.push(`Participants</h2>`);
    pop_element();
    $$payload.out.push(` `);
    if (attendees && attendees.length > 0) {
      $$payload.out.push("<!--[-->");
      const each_array_1 = ensure_array_like(attendees);
      $$payload.out.push(`<div class="overflow-x-auto">`);
      push_element($$payload, "div", 730, 5);
      $$payload.out.push(`<table class="w-full text-left">`);
      push_element($$payload, "table", 731, 6);
      $$payload.out.push(`<thead>`);
      push_element($$payload, "thead", 732, 7);
      $$payload.out.push(`<tr class="border-b">`);
      push_element($$payload, "tr", 733, 8);
      $$payload.out.push(`<th class="p-2 text-gray-700">`);
      push_element($$payload, "th", 734, 9);
      $$payload.out.push(`Name</th>`);
      pop_element();
      $$payload.out.push(`<th class="p-2 text-gray-700">`);
      push_element($$payload, "th", 735, 9);
      $$payload.out.push(`ID</th>`);
      pop_element();
      $$payload.out.push(`<th class="p-2 text-gray-700">`);
      push_element($$payload, "th", 736, 9);
      $$payload.out.push(`Generation</th>`);
      pop_element();
      $$payload.out.push(`<th class="p-2 text-gray-700">`);
      push_element($$payload, "th", 737, 9);
      $$payload.out.push(`Progress</th>`);
      pop_element();
      $$payload.out.push(`<th class="p-2 text-gray-700">`);
      push_element($$payload, "th", 738, 9);
      $$payload.out.push(`Status</th>`);
      pop_element();
      $$payload.out.push(`<th class="p-2 text-gray-700">`);
      push_element($$payload, "th", 739, 9);
      $$payload.out.push(`Link</th>`);
      pop_element();
      $$payload.out.push(`<th class="p-2 text-gray-700">`);
      push_element($$payload, "th", 740, 9);
      $$payload.out.push(`Actions</th>`);
      pop_element();
      $$payload.out.push(`</tr>`);
      pop_element();
      $$payload.out.push(`</thead>`);
      pop_element();
      $$payload.out.push(`<tbody>`);
      push_element($$payload, "tbody", 743, 7);
      $$payload.out.push(`<!--[-->`);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let participant = each_array_1[$$index_1];
        $$payload.out.push(`<tr class="border-b hover:bg-gray-50">`);
        push_element($$payload, "tr", 745, 9);
        $$payload.out.push(`<td class="p-2 font-medium">`);
        push_element($$payload, "td", 746, 10);
        $$payload.out.push(`${escape_html(participant.name)}</td>`);
        pop_element();
        $$payload.out.push(`<td class="p-2 text-xs text-gray-500 font-mono">`);
        push_element($$payload, "td", 747, 10);
        $$payload.out.push(`${escape_html(participant.id.substring(0, 8))}...</td>`);
        pop_element();
        $$payload.out.push(`<td class="p-2">`);
        push_element($$payload, "td", 750, 10);
        $$payload.out.push(`${escape_html(participant.generation || "-")}</td>`);
        pop_element();
        $$payload.out.push(`<td class="p-2">`);
        push_element($$payload, "td", 751, 10);
        $$payload.out.push(`<div class="flex items-center gap-2">`);
        push_element($$payload, "div", 752, 11);
        $$payload.out.push(`<span>`);
        push_element($$payload, "span", 753, 12);
        $$payload.out.push(`${escape_html(Object.keys(participant.responses || {}).length)} / 7</span>`);
        pop_element();
        $$payload.out.push(` <div class="w-20 bg-gray-200 rounded-full h-2">`);
        push_element($$payload, "div", 754, 12);
        $$payload.out.push(`<div class="bg-gray-600 h-2 rounded-full"${attr_style(`width: ${stringify(Object.keys(participant.responses || {}).length / 7 * 100)}%`)}>`);
        push_element($$payload, "div", 755, 13);
        $$payload.out.push(`</div>`);
        pop_element();
        $$payload.out.push(`</div>`);
        pop_element();
        $$payload.out.push(`</div>`);
        pop_element();
        $$payload.out.push(`</td>`);
        pop_element();
        $$payload.out.push(`<td class="p-2">`);
        push_element($$payload, "td", 762, 10);
        if (participant.completed) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<span class="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">`);
          push_element($$payload, "span", 764, 12);
          $$payload.out.push(`Completed</span>`);
          pop_element();
        } else {
          $$payload.out.push("<!--[!-->");
          $$payload.out.push(`<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">`);
          push_element($$payload, "span", 766, 12);
          $$payload.out.push(`In Progress</span>`);
          pop_element();
        }
        $$payload.out.push(`<!--]--></td>`);
        pop_element();
        $$payload.out.push(`<td class="p-2">`);
        push_element($$payload, "td", 769, 10);
        $$payload.out.push(`<button class="text-gray-500 hover:text-gray-700" title="Copy participant link">`);
        push_element($$payload, "button", 770, 11);
        $$payload.out.push(`📋</button>`);
        pop_element();
        $$payload.out.push(`</td>`);
        pop_element();
        $$payload.out.push(`<td class="p-2">`);
        push_element($$payload, "td", 778, 10);
        $$payload.out.push(`<button class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm" title="Delete participant">`);
        push_element($$payload, "button", 779, 11);
        $$payload.out.push(`Delete</button>`);
        pop_element();
        $$payload.out.push(`</td>`);
        pop_element();
        $$payload.out.push(`</tr>`);
        pop_element();
      }
      $$payload.out.push(`<!--]--></tbody>`);
      pop_element();
      $$payload.out.push(`</table>`);
      pop_element();
      $$payload.out.push(`</div>`);
      pop_element();
    } else {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`<p class="text-gray-500">`);
      push_element($$payload, "p", 793, 5);
      $$payload.out.push(`No participants yet. Share the QR code to get started!</p>`);
      pop_element();
    }
    $$payload.out.push(`<!--]--></div>`);
    pop_element();
    $$payload.out.push(` <div class="mt-8 flex justify-center gap-4">`);
    push_element($$payload, "div", 798, 3);
    $$payload.out.push(`<button class="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">`);
    push_element($$payload, "button", 799, 4);
    $$payload.out.push(`Refresh Data</button>`);
    pop_element();
    $$payload.out.push(` <button class="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">`);
    push_element($$payload, "button", 805, 4);
    $$payload.out.push(`End Session</button>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
  }
  $$payload.out.push(`<!--]--></div>`);
  pop_element();
  $$payload.out.push(` `);
  UnifiedChatbot($$payload, { analytics, sessionId });
  $$payload.out.push(`<!----></div>`);
  pop_element();
  pop();
}
_page.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
export {
  _page as default
};
