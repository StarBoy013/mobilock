

create extension if not exists pgcrypto;

alter table public.buses
    add column if not exists conductor_id uuid references public.profiles(id) on delete set null;

alter table public.verification_logs
    add column if not exists method text default 'qr';

create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete cascade,
    severity text not null default 'info',
    message text not null,
    source text default 'System',
    is_read boolean not null default false,
    created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications" on public.notifications
    for select using (auth.uid() = user_id);

drop policy if exists "Admins can manage notifications" on public.notifications;
create policy "Admins can manage notifications" on public.notifications
    for all using (public.get_auth_user_role() = 'super_admin');

create table if not exists public.renewal_requests (
    id uuid primary key default gen_random_uuid(),
    student_id uuid not null references public.profiles(id) on delete cascade,
    pass_id uuid not null references public.passes(id) on delete cascade,
    status text not null default 'pending',
    admin_remarks text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.renewal_requests enable row level security;

drop policy if exists "Students can manage own renewals" on public.renewal_requests;
create policy "Students can manage own renewals" on public.renewal_requests
    for all using (auth.uid() = student_id);

drop policy if exists "Admins can manage renewals" on public.renewal_requests;
create policy "Admins can manage renewals" on public.renewal_requests
    for all using (public.get_auth_user_role() = 'super_admin');

create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, name, email, role, enrollment_number, is_active)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'name', 'User'),
        new.email,
        coalesce(new.raw_user_meta_data->>'role', 'student'),
        nullif(new.raw_user_meta_data->>'enrollment_number', ''),
        true
    )
    on conflict (id) do update set
        name = excluded.name,
        email = excluded.email,
        role = excluded.role,
        enrollment_number = excluded.enrollment_number,
        updated_at = now();
    return new;
end;
$$ language plpgsql security definer;

delete from public.renewal_requests;
delete from public.notifications;
delete from public.verification_logs;
delete from public.passes;
delete from public.pass_applications;
delete from public.stops;
delete from public.buses;
delete from public.routes;

delete from public.profiles where email in (
    'admin@utms.edu','conductor@utms.edu','student@utms.edu',
    'student_expired@utms.edu','student_wrong_bus@utms.edu'
) or id in (
    '00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000005'
) or enrollment_number in ('U-2024-0042','U-2023-0189','U-2024-0056');

delete from auth.identities where user_id in (
    '00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000005'
);

delete from auth.users where email in (
    'admin@utms.edu','conductor@utms.edu','student@utms.edu',
    'student_expired@utms.edu','student_wrong_bus@utms.edu'
) or id in (
    '00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000005'
);

insert into auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    aud, role, created_at, updated_at, is_sso_user
) values
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'admin@utms.edu',
    crypt('Admin@123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Dr. Rajesh Kumar", "role": "super_admin"}',
    'authenticated', 'authenticated', now(), now(), false
),
(
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'conductor@utms.edu',
    crypt('Conductor@123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Vikram Singh", "role": "conductor"}',
    'authenticated', 'authenticated', now(), now(), false
),
(
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'student@utms.edu',
    crypt('Student@123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Aarav Sharma", "role": "student", "enrollment_number": "U-2024-0042"}',
    'authenticated', 'authenticated', now(), now(), false
),
(
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'student_expired@utms.edu',
    crypt('Student@123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Tanvi Deshmukh", "role": "student", "enrollment_number": "U-2023-0189"}',
    'authenticated', 'authenticated', now(), now(), false
),
(
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000000',
    'student_wrong_bus@utms.edu',
    crypt('Student@123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Arjun Patel", "role": "student", "enrollment_number": "U-2024-0056"}',
    'authenticated', 'authenticated', now(), now(), false
);

insert into auth.identities (
    id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
) values
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    'admin@utms.edu',
    'email',
    jsonb_build_object('sub', '00000000-0000-0000-0000-000000000001', 'email', 'admin@utms.edu', 'email_verified', true, 'phone_verified', false),
    now(), now(), now()
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000002',
    'conductor@utms.edu',
    'email',
    jsonb_build_object('sub', '00000000-0000-0000-0000-000000000002', 'email', 'conductor@utms.edu', 'email_verified', true, 'phone_verified', false),
    now(), now(), now()
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000003',
    'student@utms.edu',
    'email',
    jsonb_build_object('sub', '00000000-0000-0000-0000-000000000003', 'email', 'student@utms.edu', 'email_verified', true, 'phone_verified', false),
    now(), now(), now()
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000004',
    'student_expired@utms.edu',
    'email',
    jsonb_build_object('sub', '00000000-0000-0000-0000-000000000004', 'email', 'student_expired@utms.edu', 'email_verified', true, 'phone_verified', false),
    now(), now(), now()
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000005',
    'student_wrong_bus@utms.edu',
    'email',
    jsonb_build_object('sub', '00000000-0000-0000-0000-000000000005', 'email', 'student_wrong_bus@utms.edu', 'email_verified', true, 'phone_verified', false),
    now(), now(), now()
);

insert into public.routes (id, name, start_point, end_point, distance, is_active) values
('11111111-1111-1111-1111-111111111111', 'Campus Express — North Gate', 'Main Gate', 'North Gate', 4.20, true),
('11111111-1111-1111-1111-111111111112', 'Metro Link — Sector 15', 'Metro Station', 'Sector 15', 8.70, true);

insert into public.stops (route_id, name, stop_order, latitude, longitude) values
('11111111-1111-1111-1111-111111111111', 'Main Gate', 1, 28.613900, 77.209000),
('11111111-1111-1111-1111-111111111111', 'Library', 2, 28.614500, 77.209500),
('11111111-1111-1111-1111-111111111111', 'North Gate', 3, 28.615500, 77.210000),
('11111111-1111-1111-1111-111111111112', 'Metro Station', 1, 28.620000, 77.215000),
('11111111-1111-1111-1111-111111111112', 'Hostel Block A', 2, 28.621000, 77.216000),
('11111111-1111-1111-1111-111111111112', 'Sector 15', 3, 28.623000, 77.218000);

insert into public.buses (id, bus_number, capacity, route_id, driver_name, driver_contact, fuel_level, current_occupancy, is_active, conductor_id) values
('22222222-2222-2222-2222-222222222221', 'UNI-001', 56, '11111111-1111-1111-1111-111111111111', 'Ramesh Yadav', '+91-9812345001', 78, 42, true, '00000000-0000-0000-0000-000000000002'),
('22222222-2222-2222-2222-222222222222', 'UNI-002', 48, '11111111-1111-1111-1111-111111111112', 'Suresh Patel', '+91-9812345002', 45, 35, true, null),
('22222222-2222-2222-2222-222222222223', 'UNI-003', 50, '11111111-1111-1111-1111-111111111111', 'Manoj Kumar', '+91-9812345003', 92, 12, true, null);

insert into public.passes (id, student_id, route_id, bus_id, status, manual_code, expiry, qr_token) values
(
    '33333333-3333-3333-3333-333333333331',
    '00000000-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222221',
    'active', 'UTMS-4F8K92', '2026-11-24T12:00:00Z',
    'eyJwYXNzSWQiOiIzMzMzMzMzMy0zMzMzLTMzMzMtMzMzMy0zMzMzMzMzMzMzMzEiLCJzdHVkZW50SWQiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDMiLCJidXNJZCI6IjIyMjIyMjIyLTIyMjItMjIyMi0yMjIyLTIyMjIyMjIyMjIyMSIsImV4cCI6MTk5Mzc5ODQwMDAwMCwiaG1hYyI6IjZiNDEyM2M0Njk1ODYwNzEwZTUzY2VlZmYyMmRiNzQ5ZDgxNGNmYTE1MzI2NTExMDE1MGEwNGU0ODgwY2M1MjQifQ'
),
(
    '33333333-3333-3333-3333-333333333332',
    '00000000-0000-0000-0000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222221',
    'expired', 'UTMS-D9WL47', '2026-05-01T12:00:00Z',
    'eyJwYXNzSWQiOiIzMzMzMzMzMy0zMzMzLTMzMzMtMzMzMy0zMzMzMzMzMzMzMzIiLCJzdHVkZW50SWQiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDQiLCJidXNJZCI6IjIyMjIyMjIyLTIyMjItMjIyMi0yMjIyLTIyMjIyMjIyMjIyMSIsImV4cCI6MTcxNjU0ODQwMDAwMCwiaG1hYyI6ImI2YTFlYzU0ZWMxNTEwZDMzOGY0OWQ5NzAxMjJjMzRkYzdkNDU1NDRjOGQzNjc1ZmJmY2M0ODAzMWJkYjQ0YmUifQ'
),
(
    '33333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000005',
    '11111111-1111-1111-1111-111111111112',
    '22222222-2222-2222-2222-222222222222',
    'active', 'UTMS-R7XN3P', '2026-11-24T12:00:00Z',
    'eyJwYXNzSWQiOiIzMzMzMzMzMy0zMzMzLTMzMzMtMzMzMy0zMzMzMzMzMzMzMzMiLCJzdHVkZW50SWQiOiIwMDAwMDAwMC0wMDAwLTAwMDAtMDAwMC0wMDAwMDAwMDAwMDUiLCJidXNJZCI6IjIyMjIyMjIyLTIyMjItMjIyMi0yMjIyLTIyMjIyMjIyMjIyMiIsImV4cCI6MTk5Mzc5ODQwMDAwMCwiaG1hYyI6ImFiNjJjYzUyNjk0MjkzYzc5Yzc5NmZlMmY2NDFlMzMyNmJmYWI5ZGI3OTFlNjFmOTExMzcwOTkzNWMyOTg3MzQifQ'
);

insert into public.pass_applications (id, student_id, requested_route_id, status, payment_reference, admin_remarks, created_at, updated_at) values
('44444444-4444-4444-4444-444444444441', '00000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'approved', 'PAY-SEED-01', 'Approved automatically', now() - interval '30 days', now() - interval '29 days'),
('44444444-4444-4444-4444-444444444442', '00000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'approved', 'PAY-SEED-02', 'Approved in seed', now() - interval '60 days', now() - interval '59 days'),
('44444444-4444-4444-4444-444444444443', '00000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111112', 'approved', 'PAY-SEED-03', 'Approved in seed', now() - interval '10 days', now() - interval '9 days');

insert into public.notifications (user_id, severity, message, source) values
(null, 'critical', 'Bus UNI-003 fuel sensor malfunction detected', 'Fleet Engine'),
(null, 'warning', 'High route utilization on Route 1 (85%+ peak load)', 'Telemetry'),
(null, 'info', 'Database replication completed successfully', 'Infrastructure');

insert into public.verification_logs (conductor_id, pass_id, manual_code_used, result, reason, method, created_at) values
('00000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333331', 'UTMS-4F8K92', 'VALID', null, 'qr', now() - interval '2 hours'),
('00000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333331', 'UTMS-4F8K92', 'VALID', null, 'manual', now() - interval '1 day'),
('00000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333332', 'UTMS-D9WL47', 'INVALID', 'expired', 'qr', now() - interval '3 hours'),
('00000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'UTMS-R7XN3P', 'INVALID', 'wrong_bus', 'qr', now() - interval '4 hours');