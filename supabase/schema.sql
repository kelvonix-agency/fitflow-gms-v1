-- FitFlow Multi-Tenant Gym Management Schema for Supabase (PostgreSQL)
-- Run this SQL in your Supabase SQL editor to provision tables and RLS policies.

create extension if not exists "pgcrypto";

-- 1. Gyms
create table if not exists public.gyms (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'FitFlow Studio',
  logo_url text,
  phone text,
  email text,
  address text,
  website text,
  instagram text,
  opening_hours text default '5:30 AM - 10:30 PM',
  created_at timestamptz not null default now()
);

-- 2. Profiles (Linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  gym_id uuid references public.gyms(id) on delete set null,
  name text not null,
  email text not null,
  avatar_url text,
  role text not null default 'Owner',
  created_at timestamptz not null default now()
);

-- 3. Membership Plans
create table if not exists public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  name text not null,
  price numeric(10, 2) not null check (price >= 0),
  duration_days integer not null check (duration_days > 0),
  description text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Members
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  member_code text not null,
  name text not null,
  avatar_url text,
  phone text not null,
  email text,
  date_of_birth date,
  gender text check (gender in ('Male', 'Female', 'Other')),
  address text,
  emergency_contact text,
  joining_date date not null default current_date,
  status text not null default 'active' check (status in ('active', 'archived')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (gym_id, member_code)
);

-- 5. Memberships
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  plan_id uuid not null references public.membership_plans(id) on delete restrict,
  start_date date not null,
  end_date date not null,
  status text not null default 'active' check (status in ('active', 'expiring', 'expired', 'renewed')),
  amount numeric(10, 2) not null check (amount >= 0),
  created_at timestamptz not null default now()
);

-- 6. Payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  membership_id uuid references public.memberships(id) on delete set null,
  transaction_id text not null,
  amount numeric(10, 2) not null check (amount >= 0),
  payment_method text not null check (payment_method in ('Cash', 'UPI', 'Card', 'Bank Transfer')),
  payment_type text not null check (payment_type in ('New Membership', 'Renewal', 'Other')),
  status text not null check (status in ('Paid', 'Pending', 'Failed', 'Refunded')),
  payment_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- 7. Attendance
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  attendance_date date not null default current_date,
  status text not null check (status in ('present', 'absent')),
  check_in_time text,
  created_at timestamptz not null default now(),
  unique (gym_id, member_id, attendance_date)
);

-- 8. Enquiries
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  interested_plan text,
  source text not null default 'Walk-in',
  status text not null default 'New' check (status in ('New', 'Contacted', 'Interested', 'Converted', 'Lost', 'Archived')),
  follow_up_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. Birthday Messages
create table if not exists public.birthday_messages (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  message text not null,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 10. Festival Messages
create table if not exists public.festival_messages (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  festival text not null,
  message_template text not null,
  audience text not null,
  created_at timestamptz not null default now()
);

-- 11. Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- 12. Activities
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  type text not null,
  description text not null,
  related_member_id uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 13. Staff
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  name text not null,
  avatar_url text,
  phone text not null,
  email text,
  role text not null check (role in ('Trainer', 'Receptionist', 'Manager', 'Other')),
  joining_date date not null default current_date,
  status text not null default 'Active' check (status in ('Active', 'Inactive', 'Archived')),
  created_at timestamptz not null default now()
);

-- Helper function to retrieve current user's gym_id safely
create or replace function public.current_user_gym_id()
returns uuid
language sql
stable
security definer
as $$
  select gym_id from public.profiles where id = auth.uid() limit 1;
$$;

-- Enable Row Level Security on all tables
alter table public.gyms enable row level security;
alter table public.profiles enable row level security;
alter table public.membership_plans enable row level security;
alter table public.members enable row level security;
alter table public.memberships enable row level security;
alter table public.payments enable row level security;
alter table public.attendance enable row level security;
alter table public.enquiries enable row level security;
alter table public.birthday_messages enable row level security;
alter table public.festival_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.activities enable row level security;
alter table public.staff enable row level security;

-- RLS Policies: Strictly tenant-scoped by gym_id
create policy "Users can view their own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "Users can view/update their own gym" on public.gyms
  for all using (id = public.current_user_gym_id()) with check (id = public.current_user_gym_id());

create policy "Tenant isolation for membership_plans" on public.membership_plans
  for all using (gym_id = public.current_user_gym_id()) with check (gym_id = public.current_user_gym_id());

create policy "Tenant isolation for members" on public.members
  for all using (gym_id = public.current_user_gym_id()) with check (gym_id = public.current_user_gym_id());

create policy "Tenant isolation for memberships" on public.memberships
  for all using (gym_id = public.current_user_gym_id()) with check (gym_id = public.current_user_gym_id());

create policy "Tenant isolation for payments" on public.payments
  for all using (gym_id = public.current_user_gym_id()) with check (gym_id = public.current_user_gym_id());

create policy "Tenant isolation for attendance" on public.attendance
  for all using (gym_id = public.current_user_gym_id()) with check (gym_id = public.current_user_gym_id());

create policy "Tenant isolation for enquiries" on public.enquiries
  for all using (gym_id = public.current_user_gym_id()) with check (gym_id = public.current_user_gym_id());

create policy "Tenant isolation for birthday_messages" on public.birthday_messages
  for all using (gym_id = public.current_user_gym_id()) with check (gym_id = public.current_user_gym_id());

create policy "Tenant isolation for festival_messages" on public.festival_messages
  for all using (gym_id = public.current_user_gym_id()) with check (gym_id = public.current_user_gym_id());

create policy "Tenant isolation for notifications" on public.notifications
  for all using (gym_id = public.current_user_gym_id()) with check (gym_id = public.current_user_gym_id());

create policy "Tenant isolation for activities" on public.activities
  for all using (gym_id = public.current_user_gym_id()) with check (gym_id = public.current_user_gym_id());

create policy "Tenant isolation for staff" on public.staff
  for all using (gym_id = public.current_user_gym_id()) with check (gym_id = public.current_user_gym_id());
