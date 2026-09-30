#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// ABL · seed the crew (run once, from your own machine)
//
//   DAD_EMAIL=you@example.com DAD_PASSWORD='long-passphrase' npm run seed
//
// Needs PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (in .env or env).
// Creates/links three Supabase Auth users and their profiles:
//   Dad   — your real email + password, role parent
//   Booty — internal email (never typed), role learner, grade 11, pin_set = false
//   JO    — internal email (never typed), role learner, grade 7,  pin_set = false
// Idempotent: re-running never touches an existing PIN.
// ─────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

const url = process.env.PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dadEmail = process.env.DAD_EMAIL;
const dadPassword = process.env.DAD_PASSWORD;
const bootyEmail = process.env.BOOTY_EMAIL || 'booty@abl.local';
const joEmail = process.env.JO_EMAIL || 'jo@abl.local';

if (!url || !key) {
  console.error('✗ Set PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example).');
  process.exit(1);
}
if (!dadEmail) {
  console.error('✗ Set DAD_EMAIL (and DAD_PASSWORD the first time).');
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function findUser(email) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function ensureUser(email, password) {
  const existing = await findUser(email);
  if (existing) return existing;
  if (!password) throw new Error(`No auth user for ${email} and no password given to create one.`);
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  return data.user;
}

async function ensureProfile(id, display_name, role, grade) {
  const { error } = await db
    .from('profiles')
    .upsert({ id, display_name, role, grade }, { onConflict: 'id', ignoreDuplicates: false });
  if (error) throw error;
}

try {
  // Learner passwords are random and thrown away: they sign in by PIN through the server.
  const throwaway = () => randomBytes(24).toString('base64url');

  const dad = await ensureUser(dadEmail, dadPassword);
  await ensureProfile(dad.id, 'Dad', 'parent', null);
  console.log(`✓ Dad    ${dadEmail}`);

  const booty = await ensureUser(bootyEmail, throwaway());
  await ensureProfile(booty.id, 'Booty', 'learner', 11);
  console.log(`✓ Booty  ${bootyEmail} (internal) · grade 11 · ICA courses`);

  const jo = await ensureUser(joEmail, throwaway());
  await ensureProfile(jo.id, 'JO', 'learner', 7);
  console.log(`✓ JO     ${joEmail} (internal) · grade 7 · I-35 courses`);

  const { data: counts } = await db.from('courses').select('learner_id');
  console.log(`✓ ${counts?.length ?? 0} courses on the roster`);
  console.log('\nDone. First time each girl taps her name, she sets her own 6-digit PIN.');
} catch (err) {
  console.error('✗', err.message || err);
  process.exit(1);
}
