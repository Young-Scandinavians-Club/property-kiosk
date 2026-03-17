#!/usr/bin/env node
/**
 * Verify calendar API returns avatar_url in booking members.
 * Usage: node scripts/check-avatar-api.mjs [baseUrl]
 * Example: node scripts/check-avatar-api.mjs http://localhost:4000
 *          node scripts/check-avatar-api.mjs https://ysc-sandbox.fly.dev
 */
const baseUrl = process.argv[2] || 'http://localhost:4000';
const apiKey = process.env.KIOSK_API_KEY || 'dev-kiosk-key';

const url = `${baseUrl}/api/v1/mobile/bookings/calendar?property=tahoe&start_date=2025-03-01&end_date=2025-03-31`;

async function main() {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
  });
  const data = await res.json();

  if (!res.ok) {
    console.error('API error:', res.status, data);
    process.exit(1);
  }

  const bookings = Object.values(data.data || {}).flat();
  console.log('Bookings count:', bookings.length);

  if (bookings.length === 0) {
    console.log('No bookings - add test data or try a different date range.');
    return;
  }

  const withAvatar = bookings.filter((b) => b.member?.avatar_url);
  console.log('With avatar_url:', withAvatar.length, 'of', bookings.length);

  if (withAvatar.length > 0) {
    console.log('\nSample member with avatar_url:');
    console.log(JSON.stringify(withAvatar[0].member, null, 2));
  } else {
    console.log('\nNo avatar_url in any booking. Sample member:');
    console.log(JSON.stringify(bookings[0].member, null, 2));
  }
}

main().catch(console.error);
