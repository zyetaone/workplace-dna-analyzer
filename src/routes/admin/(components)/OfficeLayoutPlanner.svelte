<script lang="ts">
	import { fade, fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  interface Zone {
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
  }

  let zones = $state<Zone[]>([
    { id: '1', type: 'Collaboration', x: 0, y: 0, width: 2, height: 2, color: 'bg-blue-200' },
    { id: '2', type: 'Focus', x: 2, y: 0, width: 2, height: 1, color: 'bg-green-200' },
    { id: '3', type: 'Meeting', x: 0, y: 2, width: 2, height: 1, color: 'bg-purple-200' },
    { id: '4', type: 'Break', x: 2, y: 1, width: 2, height: 1, color: 'bg-orange-200' },
    { id: '5', type: 'Tech', x: 0, y: 3, width: 4, height: 1, color: 'bg-red-200' }
  ]);

  let selectedZone = $state<string | null>(null);
  let isDragging = $state(false);
  let dragOffset = $state({ x: 0, y: 0 });

  const zoneTypes = [
    'Collaboration',
    'Focus',
    'Meeting',
    'Break',
    'Tech',
    'Wellness',
    'Storage',
    'Entrance'
  ];

  const colors = {
    'Collaboration': 'bg-blue-200 hover:bg-blue-300',
    'Focus': 'bg-green-200 hover:bg-green-300',
    'Meeting': 'bg-purple-200 hover:bg-purple-300',
    'Break': 'bg-orange-200 hover:bg-orange-300',
    'Tech': 'bg-red-200 hover:bg-red-300',
    'Wellness': 'bg-teal-200 hover:bg-teal-300',
    'Storage': 'bg-gray-200 hover:bg-gray-300',
    'Entrance': 'bg-yellow-200 hover:bg-yellow-300'
  };

  function handleZoneClick(zoneId: string, event: MouseEvent | KeyboardEvent) {
    event.preventDefault();
    selectedZone = selectedZone === zoneId ? null : zoneId;
  }

  function updateZoneType(zoneId: string, newType: string) {
    zones = zones.map(zone =>
      zone.id === zoneId
        ? { ...zone, type: newType, color: colors[newType] || zone.color }
        : zone
    );
  }

  function getZoneStyle(zone: Zone) {
    return `
      grid-column: ${zone.x + 1} / span ${zone.width};
      grid-row: ${zone.y + 1} / span ${zone.height};
    `;
  }
</script>

<div class="office-layout-planner" in:fade={{ duration: 600 }}>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Layout Grid -->
    <div class="lg:col-span-2">
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span class="text-2xl">📐</span>
          Interactive Layout Grid
        </h3>

        <!-- Grid Container -->
        <div
          class="layout-grid grid grid-cols-4 grid-rows-4 gap-2 aspect-square max-w-md mx-auto border-2 border-gray-200 rounded-lg p-4 bg-gray-50"
          in:scale={{ duration: 500, easing: quintOut }}
        >
          {#each zones as zone (zone.id)}
            <button
              class="zone {zone.color} border border-gray-300 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center text-xs font-medium text-gray-700 shadow-sm hover:shadow-md {selectedZone === zone.id ? 'ring-2 ring-blue-400 ring-offset-2' : ''}"
              style={getZoneStyle(zone)}
              onclick={(e) => handleZoneClick(zone.id, e)}
              onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleZoneClick(zone.id, e); } }}
              aria-label="Zone {zone.id}: {zone.type}"
              aria-pressed={selectedZone === zone.id}
              in:scale={{ duration: 300, delay: parseInt(zone.id) * 50 }}
            >
              <span class="text-center">
                <div class="font-semibold">{zone.type}</div>
                <div class="text-xs opacity-75">{zone.width}×{zone.height}</div>
              </span>
            </button>
          {/each}
        </div>

        <!-- Grid Legend -->
        <div class="mt-4 flex flex-wrap gap-2 justify-center">
          {#each Array(4).fill(0).map((_, i) => i) as col}
            <span class="text-xs text-gray-500 w-12 text-center">{col + 1}</span>
          {/each}
        </div>
      </div>
    </div>

    <!-- Controls Panel -->
    <div class="space-y-6">
      <!-- Zone Editor -->
      {#if selectedZone}
        {@const zone = zones.find(z => z.id === selectedZone)}
        {#if zone}
          <div
            class="bg-white rounded-xl border border-gray-200 p-6"
            in:fly={{ x: 20, duration: 300 }}
          >
            <h4 class="font-semibold text-gray-800 mb-4">Edit Zone {zone.id}</h4>

            <div class="space-y-4">
              <div>
                <label for="zone-type-{zone.id}" class="block text-sm font-medium text-gray-700 mb-2">Zone Type</label>
                <select
                  id="zone-type-{zone.id}"
                  value={zone.type}
                  onchange={(e) => updateZoneType(zone.id, (e.target as HTMLInputElement).value)}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Select type for zone {zone.id}"
                >
                  {#each zoneTypes as type}
                    <option value={type}>{type}</option>
                  {/each}
                </select>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="zone-width-{zone.id}" class="block text-sm font-medium text-gray-700 mb-2">Width</label>
                  <input
                    id="zone-width-{zone.id}"
                    type="number"
                    min="1"
                    max="4"
                    value={zone.width}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Width for zone {zone.id}"
                  />
                </div>
                <div>
                  <label for="zone-height-{zone.id}" class="block text-sm font-medium text-gray-700 mb-2">Height</label>
                  <input
                    id="zone-height-{zone.id}"
                    type="number"
                    min="1"
                    max="4"
                    value={zone.height}
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-label="Height for zone {zone.id}"
                  />
                </div>
              </div>
            </div>
          </div>
        {/if}
      {/if}

      <!-- Layout Suggestions -->
      <div class="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
        <h4 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span class="text-2xl">💡</span>
          AI Suggestions
        </h4>

        <div class="space-y-3">
          <div class="p-3 bg-white/70 rounded-lg">
            <p class="text-sm text-gray-700">
              <strong>Collaboration Zone:</strong> Place near natural light for better team interaction
            </p>
          </div>
          <div class="p-3 bg-white/70 rounded-lg">
            <p class="text-sm text-gray-700">
              <strong>Focus Areas:</strong> Position away from high-traffic zones for concentration
            </p>
          </div>
          <div class="p-3 bg-white/70 rounded-lg">
            <p class="text-sm text-gray-700">
              <strong>Break Spaces:</strong> Include comfortable seating and relaxation elements
            </p>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-xl border border-gray-200 p-6">
        <h4 class="font-semibold text-gray-800 mb-4">Quick Actions</h4>

        <div class="space-y-2">
          <button class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            Save Layout
          </button>
          <button class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
            Reset to Default
          </button>
          <button class="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
            Generate 3D Preview
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .layout-grid {
    position: relative;
  }

  .zone {
    min-height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
  }

  .zone:hover {
    transform: translateY(-1px);
  }

  .zone.selected {
    box-shadow: 0 0 0 2px #3b82f6, 0 4px 12px rgba(0, 0, 0, 0.15);
  }
</style>