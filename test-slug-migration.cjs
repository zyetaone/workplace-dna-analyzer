#!/usr/bin/env node

/**
 * Test script to verify the slug migration is working correctly
 * Run with: node test-slug-migration.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Open the database
const db = new sqlite3.Database(path.join(__dirname, 'local.db'), (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    }
    console.log('✅ Connected to SQLite database');
});

// Test 1: Check if sessions have slugs
console.log('\n📋 Test 1: Checking session slugs...');
db.all('SELECT id, slug, code, name FROM sessions ORDER BY created_at DESC LIMIT 5', [], (err, rows) => {
    if (err) {
        console.error('❌ Error querying sessions:', err);
        return;
    }
    
    console.log('Sessions in database:');
    rows.forEach(row => {
        const hasSlug = row.slug && row.slug !== '';
        const status = hasSlug ? '✅' : '❌';
        console.log(`  ${status} ID: ${row.id.substring(0, 8)}... | Slug: ${row.slug || 'MISSING'} | Code: ${row.code} | Name: ${row.name}`);
    });
    
    const missingSlugs = rows.filter(r => !r.slug || r.slug === '');
    if (missingSlugs.length > 0) {
        console.log(`\n⚠️  ${missingSlugs.length} sessions missing slugs!`);
    } else {
        console.log('\n✅ All sessions have slugs');
    }
});

// Test 2: Check for duplicate slugs
console.log('\n📋 Test 2: Checking for duplicate slugs...');
db.all('SELECT slug, COUNT(*) as count FROM sessions GROUP BY slug HAVING COUNT(*) > 1', [], (err, rows) => {
    if (err) {
        console.error('❌ Error checking duplicates:', err);
        return;
    }
    
    if (rows.length > 0) {
        console.log('❌ Found duplicate slugs:');
        rows.forEach(row => {
            console.log(`  - "${row.slug}" appears ${row.count} times`);
        });
    } else {
        console.log('✅ No duplicate slugs found');
    }
});

// Test 3: Check attendee-session relationships
console.log('\n📋 Test 3: Checking attendee-session relationships...');
db.all(`
    SELECT 
        a.id as attendee_id,
        a.name as attendee_name,
        s.id as session_id,
        s.slug as session_slug,
        s.code as session_code
    FROM attendees a
    LEFT JOIN sessions s ON a.session_id = s.id
    WHERE s.id IS NULL
    LIMIT 10
`, [], (err, rows) => {
    if (err) {
        console.error('❌ Error checking relationships:', err);
        return;
    }
    
    if (rows.length > 0) {
        console.log(`❌ Found ${rows.length} orphaned attendees (session not found)`);
        rows.forEach(row => {
            console.log(`  - Attendee: ${row.attendee_name} (${row.attendee_id.substring(0, 8)}...)`);
        });
    } else {
        console.log('✅ All attendees have valid sessions');
    }
});

// Test 4: Test URL patterns
console.log('\n📋 Test 4: Testing URL patterns...');
db.get('SELECT id, slug, code FROM sessions WHERE is_active = 1 LIMIT 1', [], (err, session) => {
    if (err) {
        console.error('❌ Error getting active session:', err);
        return;
    }
    
    if (session) {
        console.log('Sample URLs for active session:');
        console.log(`  Session: ${session.slug} (Code: ${session.code})`);
        console.log(`  - Presenter: /session/${session.slug}/presenter`);
        console.log(`  - Join: /session/${session.slug}/join`);
        console.log(`  - SSE Stream: /session/${session.slug}/stream`);
        console.log(`  - Attendee: /session/${session.slug}/attendee/[attendeeId]`);
    } else {
        console.log('ℹ️  No active sessions found to test URLs');
    }
});

// Close database after a delay to allow all queries to complete
setTimeout(() => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('\n✅ Database connection closed');
        }
    });
}, 1000);