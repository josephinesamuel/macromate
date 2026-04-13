create table profiles (
  id uuid references auth.users on delete cascade primary key,
  gender text not null check (gender in ('male', 'female')),
  age integer not null check (age > 0 and age < 150),
  weight_kg numeric not null check (weight_kg > 0),
  height_cm numeric not null check (height_cm > 0),
  activity_level text not null check (
    activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table profiles enable row level security;

-- Users can read their own profile
create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

-- Users can insert their own profile
create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
