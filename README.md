# Doctor DZ

Doctor DZ is the doctor-facing dashboard for the same Supabase project used by Patient DZ. It is a static Vercel-ready app that uses Supabase Auth and the existing Patient DZ tables.

## Features

- Email signup, login, forgot password, email confirmation messaging, and logout.
- Doctor onboarding that writes to `profiles`, `doctor_profiles`, and `clinics`.
- Desktop-first dashboard with today's appointments, pending requests, queue overview, and stats.
- Appointment tabs for all, today, pending, upcoming, completed, and cancelled visits.
- Doctor actions for approve, cancel with reason, queue updates, complete, and no-show.
- Weekly availability CRUD through `doctor_working_days`.
- Time off creation/deletion through `doctor_time_off`.
- Profile and linked clinic editing with verification status messaging.
- French default interface with Profile language buttons for French, Arabic, and English.
- Responsive sidebar on desktop/tablet and bottom navigation on mobile.

## Supabase Setup

1. Run the Patient DZ base schema first if it is not already installed:

   ```sql
   -- PatientDZ/supabase-schema.sql
   ```

2. Run the Doctor DZ RLS migration:

   ```sql
   -- DoctorDZ/supabase/migrations/20260720_doctordz_rls.sql
   ```

   This allows doctors to create onboarding clinics, edit their linked clinic, read patient profile details for appointments assigned to them, and extends `booked_slots` so doctor time off blocks patient booking slots.

3. In Supabase Auth, keep email confirmations enabled. Add your deployed Doctor DZ URL to allowed redirect URLs.

Required public client variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

For local static use, edit `supabase-config.js`. For Vercel, set the same variables in Project Settings.

## Local Development

Open `index.html` directly for quick UI checks, or build the Vercel artifact:

```bash
npm run build
```

The build writes `dist/` and injects `SUPABASE_URL` / `SUPABASE_ANON_KEY` into `dist/supabase-config.js`.

## Deployment

This repo includes `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

Set the Supabase variables in Vercel, deploy, then add the production domain to Supabase Auth redirect URLs.
