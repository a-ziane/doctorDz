drop policy if exists "Doctors can create onboarding clinics" on public.clinics;
drop policy if exists "Doctors can update linked clinics" on public.clinics;
drop policy if exists "Doctors can read appointment patient profiles" on public.profiles;

create policy "Doctors can create onboarding clinics"
  on public.clinics for insert
  to authenticated
  with check (public.is_doctor() or public.is_admin());

create policy "Doctors can update linked clinics"
  on public.clinics for update
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.doctor_profiles dp
      where dp.clinic_id = clinics.id
        and dp.id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1
      from public.doctor_profiles dp
      where dp.clinic_id = clinics.id
        and dp.id = auth.uid()
    )
  );

create policy "Doctors can read appointment patient profiles"
  on public.profiles for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.appointments a
      where a.patient_id = profiles.id
        and a.doctor_id = auth.uid()
    )
  );

create or replace view public.booked_slots
with (security_invoker = false)
as
select
  doctor_id,
  appointment_date,
  appointment_time
from public.appointments
where doctor_id is not null
  and status in ('pending', 'confirmed')
union
select
  wd.doctor_id,
  slot_times.slot_start::date as appointment_date,
  slot_times.slot_start::time as appointment_time
from public.doctor_working_days wd
join lateral generate_series(
  current_date,
  current_date + interval '180 days',
  interval '1 day'
) as calendar_days(day_date)
  on extract(dow from calendar_days.day_date)::integer = wd.day_of_week
join lateral generate_series(
  calendar_days.day_date + wd.start_time,
  calendar_days.day_date + wd.end_time - (wd.slot_minutes * interval '1 minute'),
  wd.slot_minutes * interval '1 minute'
) as slot_times(slot_start)
  on true
where wd.is_active = true
  and exists (
    select 1
    from public.doctor_time_off dto
    where dto.doctor_id = wd.doctor_id
      and slot_times.slot_start < dto.ends_at
      and slot_times.slot_start + (wd.slot_minutes * interval '1 minute') > dto.starts_at
  );

grant select on public.booked_slots to anon, authenticated;
