

create extension if not exists "uuid-ossp";

create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    name text not null,
    email text not null,
    role text not null check (role in ('super_admin', 'student', 'conductor')) default 'student',
    enrollment_number text unique,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.routes (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    start_point text not null,
    end_point text not null,
    distance numeric(5, 2) not null check (distance > 0),
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.stops (
    id uuid primary key default gen_random_uuid(),
    route_id uuid not null references public.routes(id) on delete cascade,
    name text not null,
    stop_order integer not null check (stop_order >= 1),
    latitude numeric(9, 6),
    longitude numeric(9, 6),
    created_at timestamptz not null default now(),
    unique (route_id, stop_order)
);

create table public.buses (
    id uuid primary key default gen_random_uuid(),
    bus_number text not null unique,
    capacity integer not null check (capacity >= 1),
    route_id uuid references public.routes(id) on delete set null,
    driver_name text not null,
    driver_contact text not null,
    fuel_level integer not null check (fuel_level >= 0 and fuel_level <= 100) default 100,
    current_occupancy integer not null check (current_occupancy >= 0) default 0,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.pass_applications (
    id uuid primary key default gen_random_uuid(),
    student_id uuid not null references public.profiles(id) on delete cascade,
    requested_route_id uuid not null references public.routes(id) on delete restrict,
    status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending',
    payment_reference text,
    admin_remarks text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.passes (
    id uuid primary key default gen_random_uuid(),
    student_id uuid not null references public.profiles(id) on delete cascade unique,
    route_id uuid not null references public.routes(id) on delete restrict,
    bus_id uuid references public.buses(id) on delete set null,
    status text not null check (status in ('active', 'expired', 'suspended', 'revoked')) default 'active',
    manual_code text not null unique,
    expiry timestamptz not null,
    qr_token text not null unique,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.verification_logs (
    id uuid primary key default gen_random_uuid(),
    conductor_id uuid not null references public.profiles(id) on delete cascade,
    pass_id uuid references public.passes(id) on delete set null,
    manual_code_used text not null,
    result text not null check (result in ('VALID', 'INVALID')),
    reason text,
    created_at timestamptz not null default now()
);

create index idx_stops_route_order on public.stops(route_id, stop_order);
create index idx_buses_route on public.buses(route_id);
create index idx_applications_student on public.pass_applications(student_id);
create index idx_applications_status on public.pass_applications(status);
create index idx_passes_student on public.passes(student_id);
create index idx_passes_manual_code on public.passes(manual_code);
create index idx_passes_status_expiry on public.passes(status, expiry);
create index idx_logs_conductor_created on public.verification_logs(conductor_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, name, email, role, enrollment_number, is_active)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'name', 'User'),
        new.email,
        coalesce(new.raw_user_meta_data->>'role', 'student'),
        new.raw_user_meta_data->>'enrollment_number',
        true
    );
    return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.routes enable row level security;
alter table public.stops enable row level security;
alter table public.buses enable row level security;
alter table public.pass_applications enable row level security;
alter table public.passes enable row level security;
alter table public.verification_logs enable row level security;

create or replace function public.get_auth_user_role()
returns text as $$
    select (raw_user_meta_data->>'role')::text from auth.users where id = auth.uid();
$$ language sql security definer;

create policy "Users can read own profile" on public.profiles
    for select using (auth.uid() = id);

create policy "Conductors can read student profiles" on public.profiles
    for select using (
        public.get_auth_user_role() = 'conductor'
    );

create policy "Admins can manage profiles" on public.profiles
    for all using (
        public.get_auth_user_role() = 'super_admin'
    );

create policy "Anyone can select active routes" on public.routes
    for select using (is_active = true or public.get_auth_user_role() = 'super_admin');

create policy "Anyone can select stops for active routes" on public.stops
    for select using (
        exists (
            select 1 from public.routes r
            where r.id = route_id
            and (r.is_active = true or public.get_auth_user_role() = 'super_admin')
        )
    );

create policy "Admins can manage routes" on public.routes
    for all using (
        public.get_auth_user_role() = 'super_admin'
    );

create policy "Admins can manage stops" on public.stops
    for all using (
        public.get_auth_user_role() = 'super_admin'
    );

create policy "Anyone can select active buses" on public.buses
    for select using (is_active = true or public.get_auth_user_role() = 'super_admin');

create policy "Admins can manage buses" on public.buses
    for all using (
        public.get_auth_user_role() = 'super_admin'
    );

create policy "Students can manage own applications" on public.pass_applications
    for all using (auth.uid() = student_id);

create policy "Admins can manage applications" on public.pass_applications
    for all using (
        public.get_auth_user_role() = 'super_admin'
    );

create policy "Students can view own pass" on public.passes
    for select using (auth.uid() = student_id);

create policy "Conductors can view passes for verification" on public.passes
    for select using (
        public.get_auth_user_role() = 'conductor'
    );

create policy "Admins can manage passes" on public.passes
    for all using (
        public.get_auth_user_role() = 'super_admin'
    );

create policy "Conductors can create verification logs" on public.verification_logs
    for insert with check (auth.uid() = conductor_id);

create policy "Students can view logs for their pass" on public.verification_logs
    for select using (
        exists (
            select 1 from public.passes p
            where p.id = pass_id and p.student_id = auth.uid()
        )
    );

create policy "Admins can manage verification logs" on public.verification_logs
    for all using (
        public.get_auth_user_role() = 'super_admin'
    );