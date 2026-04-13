create table meal_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  logged_at timestamptz not null default now(),
  meal_date date not null default current_date,
  description text not null,
  ai_breakdown jsonb not null,
  calories numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  fiber_g numeric not null
);

-- Enable RLS
alter table meal_logs enable row level security;

-- Users can read their own logs
create policy "Users can read own meal logs"
  on meal_logs for select
  using (auth.uid() = user_id);

-- Users can insert their own logs
create policy "Users can insert own meal logs"
  on meal_logs for insert
  with check (auth.uid() = user_id);

-- Users can update their own logs
create policy "Users can update own meal logs"
  on meal_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own logs
create policy "Users can delete own meal logs"
  on meal_logs for delete
  using (auth.uid() = user_id);
