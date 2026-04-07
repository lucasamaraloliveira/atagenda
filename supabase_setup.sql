
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: Units
create table if not exists public.units (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  phone text,
  is_active boolean default true,
  logo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: Profiles (Extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text unique not null,
  profile text default 'Administrador',
  avatar text,
  allowed_units text default 'all',
  active boolean default true,
  permissions jsonb default '["Total"]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: Patients
create table if not exists public.patients (
  id uuid primary key default uuid_generate_v4(),
  record_number text unique,
  name text not null,
  cpf text unique,
  birth_date date,
  gender text,
  phone text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: Doctors
create table if not exists public.doctors (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  crm text,
  cpf text,
  specialty text,
  type text check (type in ('executante', 'solicitante', 'ambos')),
  phone text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: Procedures
create table if not exists public.procedures (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text,
  modality text,
  price decimal(10, 2),
  preparation text,
  integra_ris boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: Insurances
create table if not exists public.insurances (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  status text default 'Ativo',
  patient_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: Schedule Configs
create table if not exists public.schedule_configs (
  id uuid primary key default uuid_generate_v4(),
  doctor_id uuid references public.doctors(id) on delete cascade,
  unit_id uuid references public.units(id) on delete cascade,
  max_overbooks_per_day integer default 0,
  slot_duration integer default 15,
  schedule jsonb not null,
  multi_procedure_strategy text default 'next_minute',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(doctor_id, unit_id)
);

-- Table: Appointments
create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references public.patients(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete cascade,
  unit_id uuid references public.units(id) on delete cascade,
  date date not null,
  time text not null,
  procedure_id uuid references public.procedures(id),
  procedure_name text, -- Keep original name if procedure is deleted or modified
  status text not null default 'agendado',
  insurance text,
  is_overbook boolean default false,
  price decimal(10, 2),
  status_history jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: Schedule Blocks
create table if not exists public.schedule_blocks (
  id uuid primary key default uuid_generate_v4(),
  doctor_id uuid references public.doctors(id) on delete cascade,
  unit_id uuid references public.units(id) on delete cascade,
  date date not null,
  start_time text not null,
  end_time text not null,
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: System Settings
create table if not exists public.system_settings (
  id uuid primary key default uuid_generate_v4(),
  key text unique not null,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.units enable row level security;
alter table public.patients enable row level security;
alter table public.doctors enable row level security;
alter table public.procedures enable row level security;
alter table public.insurances enable row level security;
alter table public.schedule_configs enable row level security;
alter table public.appointments enable row level security;
alter table public.schedule_blocks enable row level security;
alter table public.system_settings enable row level security;
alter table public.profiles enable row level security;

-- Drop and Recreate Policies for Idempotency
drop policy if exists "Enable full access for all users" on public.units;
create policy "Enable full access for all users" on public.units for all using (true);

drop policy if exists "Enable full access for all users" on public.patients;
create policy "Enable full access for all users" on public.patients for all using (true);

drop policy if exists "Enable full access for all users" on public.doctors;
create policy "Enable full access for all users" on public.doctors for all using (true);

drop policy if exists "Enable full access for all users" on public.procedures;
create policy "Enable full access for all users" on public.procedures for all using (true);

drop policy if exists "Enable full access for all users" on public.insurances;
create policy "Enable full access for all users" on public.insurances for all using (true);

drop policy if exists "Enable full access for all users" on public.schedule_configs;
create policy "Enable full access for all users" on public.schedule_configs for all using (true);

drop policy if exists "Enable full access for all users" on public.appointments;
create policy "Enable full access for all users" on public.appointments for all using (true);

drop policy if exists "Enable full access for all users" on public.profiles;
create policy "Enable full access for all users" on public.profiles for all using (true);

drop policy if exists "Enable full access for all users" on public.schedule_blocks;
create policy "Enable full access for all users" on public.schedule_blocks for all using (true);

drop policy if exists "Enable full access for all users" on public.system_settings;
create policy "Enable full access for all users" on public.system_settings for all using (true);
