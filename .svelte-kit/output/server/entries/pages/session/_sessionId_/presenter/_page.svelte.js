import { G as push, O as push_element, Q as pop_element, K as pop, F as FILENAME, T as escape_html, Y as ensure_array_like, W as attr_style, X as stringify } from "../../../../../chunks/index.js";
import { p as page } from "../../../../../chunks/index3.js";
import "../../../../../chunks/client.js";
import { S as SvelteSet, a as analyticsStore, s as sessionStore } from "../../../../../chunks/analytics-state.svelte.js";
import "clsx";
import "../../../../../remote/xu03kg.js";
import "d3";
import "d3-cloud";
import "chart.js/auto";
import "canvas-confetti";
import "../../../../../remote/c3ww8i.js";
import { marked } from "marked";
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
  let sessionId = (() => {
    const id = page.params.sessionId;
    console.log("[Presenter Page] Derived sessionId from params:", id);
    return id;
  })();
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
  push_element($$payload, "div", 579, 0);
  $$payload.out.push(`<div class="container mx-auto px-6 py-12">`);
  push_element($$payload, "div", 588, 1);
  $$payload.out.push(`<div class="bg-white rounded-lg shadow-lg p-8 mb-8">`);
  push_element($$payload, "div", 590, 2);
  $$payload.out.push(`<div class="flex justify-between items-start">`);
  push_element($$payload, "div", 591, 3);
  $$payload.out.push(`<div>`);
  push_element($$payload, "div", 592, 4);
  $$payload.out.push(`<h1 class="text-4xl font-bold text-gray-800 mb-2">`);
  push_element($$payload, "h1", 593, 5);
  $$payload.out.push(`Presenter Dashboard</h1>`);
  pop_element();
  $$payload.out.push(` <p class="text-gray-600">`);
  push_element($$payload, "p", 594, 5);
  $$payload.out.push(`Session Code: <span class="font-mono text-2xl text-gray-700">`);
  push_element($$payload, "span", 594, 44);
  $$payload.out.push(`${escape_html(sessionCode)}</span>`);
  pop_element();
  $$payload.out.push(`</p>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  $$payload.out.push(` <div class="flex items-center gap-2">`);
  push_element($$payload, "div", 596, 4);
  $$payload.out.push(`<span class="relative flex h-3 w-3">`);
  push_element($$payload, "span", 597, 5);
  if (connectionStatus === "connected") {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75">`);
    push_element($$payload, "span", 599, 7);
    $$payload.out.push(`</span>`);
    pop_element();
    $$payload.out.push(` <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500">`);
    push_element($$payload, "span", 600, 7);
    $$payload.out.push(`</span>`);
    pop_element();
  } else {
    $$payload.out.push("<!--[!-->");
    if (connectionStatus === "connecting") {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<span class="animate-pulse relative inline-flex rounded-full h-3 w-3 bg-yellow-500">`);
      push_element($$payload, "span", 602, 7);
      $$payload.out.push(`</span>`);
      pop_element();
    } else {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`<span class="relative inline-flex rounded-full h-3 w-3 bg-red-500">`);
      push_element($$payload, "span", 604, 7);
      $$payload.out.push(`</span>`);
      pop_element();
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></span>`);
  pop_element();
  $$payload.out.push(` <span class="text-sm font-medium text-gray-700 capitalize">`);
  push_element($$payload, "span", 607, 5);
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
    push_element($$payload, "div", 615, 3);
    $$payload.out.push(`<p class="text-gray-600">`);
    push_element($$payload, "p", 616, 4);
    $$payload.out.push(`Loading session data...</p>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<div class="grid md:grid-cols-2 gap-8 mb-8">`);
    push_element($$payload, "div", 620, 3);
    $$payload.out.push(`<div class="bg-white rounded-lg shadow-lg p-8">`);
    push_element($$payload, "div", 622, 4);
    $$payload.out.push(`<h2 class="text-2xl font-semibold text-gray-800 mb-4">`);
    push_element($$payload, "h2", 623, 5);
    $$payload.out.push(`Join Session</h2>`);
    pop_element();
    $$payload.out.push(` `);
    {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`<div class="animate-pulse bg-gray-200 h-64 rounded">`);
      push_element($$payload, "div", 633, 6);
      $$payload.out.push(`</div>`);
      pop_element();
    }
    $$payload.out.push(`<!--]--></div>`);
    pop_element();
    $$payload.out.push(` <div class="bg-white rounded-lg shadow-lg p-8">`);
    push_element($$payload, "div", 638, 4);
    $$payload.out.push(`<h2 class="text-2xl font-semibold text-gray-800 mb-6">`);
    push_element($$payload, "h2", 639, 5);
    $$payload.out.push(`Live Statistics</h2>`);
    pop_element();
    $$payload.out.push(` <div class="space-y-4">`);
    push_element($$payload, "div", 640, 5);
    $$payload.out.push(`<div class="flex justify-between items-center p-4 bg-gray-50 rounded">`);
    push_element($$payload, "div", 641, 6);
    $$payload.out.push(`<span class="text-gray-700">`);
    push_element($$payload, "span", 642, 7);
    $$payload.out.push(`Active Participants</span>`);
    pop_element();
    $$payload.out.push(` <span class="text-3xl font-bold text-gray-600">`);
    push_element($$payload, "span", 643, 7);
    $$payload.out.push(`${escape_html(analytics.activeCount)}</span>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(` <div class="flex justify-between items-center p-4 bg-gray-50 rounded">`);
    push_element($$payload, "div", 645, 6);
    $$payload.out.push(`<span class="text-gray-700">`);
    push_element($$payload, "span", 646, 7);
    $$payload.out.push(`Completed</span>`);
    pop_element();
    $$payload.out.push(` <span class="text-3xl font-bold text-green-600">`);
    push_element($$payload, "span", 647, 7);
    $$payload.out.push(`${escape_html(analytics.completedCount)}</span>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(` <div class="flex justify-between items-center p-4 bg-gray-50 rounded">`);
    push_element($$payload, "div", 649, 6);
    $$payload.out.push(`<span class="text-gray-700">`);
    push_element($$payload, "span", 650, 7);
    $$payload.out.push(`Response Rate</span>`);
    pop_element();
    $$payload.out.push(` <span class="text-3xl font-bold text-gray-600">`);
    push_element($$payload, "span", 651, 7);
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
    push_element($$payload, "div", 658, 3);
    $$payload.out.push(`<div class="bg-white rounded-lg shadow-lg p-8">`);
    push_element($$payload, "div", 660, 4);
    $$payload.out.push(`<h2 class="text-2xl font-semibold text-gray-800 mb-4">`);
    push_element($$payload, "h2", 661, 5);
    $$payload.out.push(`Generation Distribution</h2>`);
    pop_element();
    $$payload.out.push(` <div class="relative" style="height: 300px;">`);
    push_element($$payload, "div", 662, 5);
    $$payload.out.push(`<canvas id="generationChart">`);
    push_element($$payload, "canvas", 663, 6);
    $$payload.out.push(`</canvas>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(` <div class="bg-white rounded-lg shadow-lg p-8">`);
    push_element($$payload, "div", 668, 4);
    $$payload.out.push(`<h2 class="text-2xl font-semibold text-gray-800 mb-4">`);
    push_element($$payload, "h2", 669, 5);
    $$payload.out.push(`Average Preferences</h2>`);
    pop_element();
    $$payload.out.push(` <div class="relative" style="height: 300px;">`);
    push_element($$payload, "div", 670, 5);
    $$payload.out.push(`<canvas id="preferenceChart">`);
    push_element($$payload, "canvas", 671, 6);
    $$payload.out.push(`</canvas>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(` <div class="grid md:grid-cols-2 gap-8 mb-8">`);
    push_element($$payload, "div", 677, 3);
    $$payload.out.push(`<div class="bg-white rounded-lg shadow-lg p-8">`);
    push_element($$payload, "div", 679, 4);
    $$payload.out.push(`<h2 class="text-2xl font-semibold text-gray-800 mb-4">`);
    push_element($$payload, "h2", 680, 5);
    $$payload.out.push(`Generation Comparison</h2>`);
    pop_element();
    $$payload.out.push(` <div class="relative" style="height: 300px;">`);
    push_element($$payload, "div", 681, 5);
    $$payload.out.push(`<canvas id="comparisonChart">`);
    push_element($$payload, "canvas", 682, 6);
    $$payload.out.push(`</canvas>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(` <div class="bg-white rounded-lg shadow-lg p-8">`);
    push_element($$payload, "div", 687, 4);
    $$payload.out.push(`<h2 class="text-2xl font-semibold text-gray-800 mb-4">`);
    push_element($$payload, "h2", 688, 5);
    $$payload.out.push(`Preference Trends by Generation</h2>`);
    pop_element();
    $$payload.out.push(` <div class="relative" style="height: 300px;">`);
    push_element($$payload, "div", 689, 5);
    $$payload.out.push(`<canvas id="detailChart">`);
    push_element($$payload, "canvas", 690, 6);
    $$payload.out.push(`</canvas>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(` <div class="grid md:grid-cols-2 gap-8 mb-8">`);
    push_element($$payload, "div", 696, 3);
    $$payload.out.push(`<div class="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-lg p-8">`);
    push_element($$payload, "div", 698, 4);
    $$payload.out.push(`<h2 class="text-2xl font-semibold text-gray-800 mb-4">`);
    push_element($$payload, "h2", 699, 5);
    $$payload.out.push(`Workplace DNA Profile</h2>`);
    pop_element();
    $$payload.out.push(` `);
    if (analytics.workplaceDNA) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="text-center py-8">`);
      push_element($$payload, "div", 701, 6);
      $$payload.out.push(`<div class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">`);
      push_element($$payload, "div", 702, 7);
      $$payload.out.push(`${escape_html(analytics.workplaceDNA)}</div>`);
      pop_element();
      $$payload.out.push(` <div class="grid grid-cols-2 gap-4 mt-6">`);
      push_element($$payload, "div", 705, 7);
      $$payload.out.push(`<div class="bg-white rounded-lg p-4 shadow">`);
      push_element($$payload, "div", 706, 8);
      $$payload.out.push(`<div class="text-3xl font-bold text-blue-600">`);
      push_element($$payload, "div", 707, 9);
      $$payload.out.push(`${escape_html(analytics.preferenceScores.collaboration)}</div>`);
      pop_element();
      $$payload.out.push(` <div class="text-sm text-gray-600">`);
      push_element($$payload, "div", 708, 9);
      $$payload.out.push(`Collaboration</div>`);
      pop_element();
      $$payload.out.push(`</div>`);
      pop_element();
      $$payload.out.push(` <div class="bg-white rounded-lg p-4 shadow">`);
      push_element($$payload, "div", 710, 8);
      $$payload.out.push(`<div class="text-3xl font-bold text-amber-600">`);
      push_element($$payload, "div", 711, 9);
      $$payload.out.push(`${escape_html(analytics.preferenceScores.formality)}</div>`);
      pop_element();
      $$payload.out.push(` <div class="text-sm text-gray-600">`);
      push_element($$payload, "div", 712, 9);
      $$payload.out.push(`Formality</div>`);
      pop_element();
      $$payload.out.push(`</div>`);
      pop_element();
      $$payload.out.push(` <div class="bg-white rounded-lg p-4 shadow">`);
      push_element($$payload, "div", 714, 8);
      $$payload.out.push(`<div class="text-3xl font-bold text-green-600">`);
      push_element($$payload, "div", 715, 9);
      $$payload.out.push(`${escape_html(analytics.preferenceScores.technology)}</div>`);
      pop_element();
      $$payload.out.push(` <div class="text-sm text-gray-600">`);
      push_element($$payload, "div", 716, 9);
      $$payload.out.push(`Technology</div>`);
      pop_element();
      $$payload.out.push(`</div>`);
      pop_element();
      $$payload.out.push(` <div class="bg-white rounded-lg p-4 shadow">`);
      push_element($$payload, "div", 718, 8);
      $$payload.out.push(`<div class="text-3xl font-bold text-red-600">`);
      push_element($$payload, "div", 719, 9);
      $$payload.out.push(`${escape_html(analytics.preferenceScores.wellness)}</div>`);
      pop_element();
      $$payload.out.push(` <div class="text-sm text-gray-600">`);
      push_element($$payload, "div", 720, 9);
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
      push_element($$payload, "div", 725, 6);
      $$payload.out.push(`Waiting for participants to complete the quiz...</div>`);
      pop_element();
    }
    $$payload.out.push(`<!--]--></div>`);
    pop_element();
    $$payload.out.push(` <div class="bg-gradient-to-br from-white to-blue-50 rounded-lg shadow-lg p-8">`);
    push_element($$payload, "div", 732, 4);
    $$payload.out.push(`<h2 class="text-2xl font-semibold text-gray-800 mb-4">`);
    push_element($$payload, "h2", 733, 5);
    $$payload.out.push(`Conceptual Trends Cloud</h2>`);
    pop_element();
    $$payload.out.push(` <div id="wordCloudContainer" style="height: 400px; width: 100%;">`);
    push_element($$payload, "div", 734, 5);
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
      push_element($$payload, "div", 740, 4);
      $$payload.out.push(`<h2 class="text-2xl font-semibold text-gray-800 mb-6">`);
      push_element($$payload, "h2", 741, 5);
      $$payload.out.push(`🤖 AI Workplace Insights</h2>`);
      pop_element();
      $$payload.out.push(` <div class="grid md:grid-cols-2 gap-4">`);
      push_element($$payload, "div", 744, 5);
      $$payload.out.push(`<!--[-->`);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let insight = each_array[$$index];
        $$payload.out.push(`<div class="bg-white rounded-lg p-4 shadow">`);
        push_element($$payload, "div", 746, 7);
        $$payload.out.push(`<p class="text-gray-700">`);
        push_element($$payload, "p", 747, 8);
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
    push_element($$payload, "div", 756, 3);
    $$payload.out.push(`<h2 class="text-2xl font-semibold text-gray-800 mb-4">`);
    push_element($$payload, "h2", 757, 4);
    $$payload.out.push(`Participants</h2>`);
    pop_element();
    $$payload.out.push(` `);
    if (attendees && attendees.length > 0) {
      $$payload.out.push("<!--[-->");
      const each_array_1 = ensure_array_like(attendees);
      $$payload.out.push(`<div class="overflow-x-auto">`);
      push_element($$payload, "div", 759, 5);
      $$payload.out.push(`<table class="w-full text-left">`);
      push_element($$payload, "table", 760, 6);
      $$payload.out.push(`<thead>`);
      push_element($$payload, "thead", 761, 7);
      $$payload.out.push(`<tr class="border-b">`);
      push_element($$payload, "tr", 762, 8);
      $$payload.out.push(`<th class="p-2 text-gray-700">`);
      push_element($$payload, "th", 763, 9);
      $$payload.out.push(`Name</th>`);
      pop_element();
      $$payload.out.push(`<th class="p-2 text-gray-700">`);
      push_element($$payload, "th", 764, 9);
      $$payload.out.push(`ID</th>`);
      pop_element();
      $$payload.out.push(`<th class="p-2 text-gray-700">`);
      push_element($$payload, "th", 765, 9);
      $$payload.out.push(`Generation</th>`);
      pop_element();
      $$payload.out.push(`<th class="p-2 text-gray-700">`);
      push_element($$payload, "th", 766, 9);
      $$payload.out.push(`Progress</th>`);
      pop_element();
      $$payload.out.push(`<th class="p-2 text-gray-700">`);
      push_element($$payload, "th", 767, 9);
      $$payload.out.push(`Status</th>`);
      pop_element();
      $$payload.out.push(`<th class="p-2 text-gray-700">`);
      push_element($$payload, "th", 768, 9);
      $$payload.out.push(`Link</th>`);
      pop_element();
      $$payload.out.push(`<th class="p-2 text-gray-700">`);
      push_element($$payload, "th", 769, 9);
      $$payload.out.push(`Actions</th>`);
      pop_element();
      $$payload.out.push(`</tr>`);
      pop_element();
      $$payload.out.push(`</thead>`);
      pop_element();
      $$payload.out.push(`<tbody>`);
      push_element($$payload, "tbody", 772, 7);
      $$payload.out.push(`<!--[-->`);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let participant = each_array_1[$$index_1];
        $$payload.out.push(`<tr class="border-b hover:bg-gray-50">`);
        push_element($$payload, "tr", 774, 9);
        $$payload.out.push(`<td class="p-2 font-medium">`);
        push_element($$payload, "td", 775, 10);
        $$payload.out.push(`${escape_html(participant.name)}</td>`);
        pop_element();
        $$payload.out.push(`<td class="p-2 text-xs text-gray-500 font-mono">`);
        push_element($$payload, "td", 776, 10);
        $$payload.out.push(`${escape_html(participant.id.substring(0, 8))}...</td>`);
        pop_element();
        $$payload.out.push(`<td class="p-2">`);
        push_element($$payload, "td", 779, 10);
        $$payload.out.push(`${escape_html(participant.generation || "-")}</td>`);
        pop_element();
        $$payload.out.push(`<td class="p-2">`);
        push_element($$payload, "td", 780, 10);
        $$payload.out.push(`<div class="flex items-center gap-2">`);
        push_element($$payload, "div", 781, 11);
        $$payload.out.push(`<span>`);
        push_element($$payload, "span", 782, 12);
        $$payload.out.push(`${escape_html(Object.keys(participant.responses || {}).length)} / 7</span>`);
        pop_element();
        $$payload.out.push(` <div class="w-20 bg-gray-200 rounded-full h-2">`);
        push_element($$payload, "div", 783, 12);
        $$payload.out.push(`<div class="bg-gray-600 h-2 rounded-full"${attr_style(`width: ${stringify(Object.keys(participant.responses || {}).length / 7 * 100)}%`)}>`);
        push_element($$payload, "div", 784, 13);
        $$payload.out.push(`</div>`);
        pop_element();
        $$payload.out.push(`</div>`);
        pop_element();
        $$payload.out.push(`</div>`);
        pop_element();
        $$payload.out.push(`</td>`);
        pop_element();
        $$payload.out.push(`<td class="p-2">`);
        push_element($$payload, "td", 791, 10);
        if (participant.completed) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<span class="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">`);
          push_element($$payload, "span", 793, 12);
          $$payload.out.push(`Completed</span>`);
          pop_element();
        } else {
          $$payload.out.push("<!--[!-->");
          $$payload.out.push(`<span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">`);
          push_element($$payload, "span", 795, 12);
          $$payload.out.push(`In Progress</span>`);
          pop_element();
        }
        $$payload.out.push(`<!--]--></td>`);
        pop_element();
        $$payload.out.push(`<td class="p-2">`);
        push_element($$payload, "td", 798, 10);
        $$payload.out.push(`<button class="text-gray-500 hover:text-gray-700" title="Copy participant link">`);
        push_element($$payload, "button", 799, 11);
        $$payload.out.push(`📋</button>`);
        pop_element();
        $$payload.out.push(`</td>`);
        pop_element();
        $$payload.out.push(`<td class="p-2">`);
        push_element($$payload, "td", 807, 10);
        $$payload.out.push(`<button class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm" title="Delete participant">`);
        push_element($$payload, "button", 808, 11);
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
      push_element($$payload, "p", 822, 5);
      $$payload.out.push(`No participants yet. Share the QR code to get started!</p>`);
      pop_element();
    }
    $$payload.out.push(`<!--]--></div>`);
    pop_element();
    $$payload.out.push(` <div class="mt-8 flex justify-center gap-4">`);
    push_element($$payload, "div", 827, 3);
    $$payload.out.push(`<button class="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">`);
    push_element($$payload, "button", 828, 4);
    $$payload.out.push(`Refresh Data</button>`);
    pop_element();
    $$payload.out.push(` <button class="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">`);
    push_element($$payload, "button", 834, 4);
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
