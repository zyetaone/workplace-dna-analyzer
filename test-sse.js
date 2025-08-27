// Test SSE Connection
// Run this script to test the SSE endpoint

const EventSource = require('eventsource');

// You need to create a session first and get its slug
const SESSION_SLUG = 'test-session'; // Replace with actual session slug

const url = `http://localhost:5173/dashboard/${SESSION_SLUG}/stream`;

console.log(`Connecting to SSE endpoint: ${url}`);

const eventSource = new EventSource(url);

eventSource.onopen = () => {
  console.log('✅ SSE connection established');
};

eventSource.addEventListener('connected', (event) => {
  console.log('📡 Connected event:', JSON.parse(event.data));
});

eventSource.addEventListener('update', (event) => {
  const data = JSON.parse(event.data);
  console.log('📊 Update received:', {
    participants: data.count,
    completed: data.completed,
    timestamp: new Date().toISOString()
  });
});

eventSource.addEventListener('heartbeat', (event) => {
  console.log('💓 Heartbeat:', JSON.parse(event.data));
});

eventSource.onerror = (error) => {
  console.error('❌ SSE Error:', error);
  if (eventSource.readyState === EventSource.CLOSED) {
    console.log('Connection closed');
    process.exit(1);
  }
};

// Keep the script running
process.on('SIGINT', () => {
  console.log('\nClosing connection...');
  eventSource.close();
  process.exit(0);
});

console.log('Listening for SSE events... (Ctrl+C to exit)');