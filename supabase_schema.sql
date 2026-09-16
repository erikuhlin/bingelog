-- =========================================================
-- Bingelog (MediaTracker) - Supabase Database Schema
-- Klistra in detta i Supabases SQL Editor och kör "RUN"
-- =========================================================

-- 1. Skapa profiltabell kopplad till auth.users
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  display_name text,
  avatar_url text,
  language_preference text default 'sv-SE',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS för profiles
alter table public.profiles enable row level security;

create policy "Alla kan se publika profiler"
  on public.profiles for select
  using (true);

create policy "Användare kan uppdatera sin egen profil"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger för att skapa profil automatiskt vid ny användarregistrering
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Tabell för sparade titlar i listor (Watchlist, Watching, Completed, Dropped)
create table if not exists public.user_media (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  poster_path text,
  backdrop_path text,
  status text not null check (status in ('watchlist', 'watching', 'completed', 'dropped')),
  user_rating integer check (user_rating between 1 and 10),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, tmdb_id, media_type)
);

-- RLS för user_media
alter table public.user_media enable row level security;

create policy "Användare kan se sina egna sparade titlar"
  on public.user_media for select
  using (auth.uid() = user_id);

create policy "Användare kan lägga till nya titlar"
  on public.user_media for insert
  with check (auth.uid() = user_id);

create policy "Användare kan uppdatera sina titlar"
  on public.user_media for update
  using (auth.uid() = user_id);

create policy "Användare kan ta bort titlar"
  on public.user_media for delete
  using (auth.uid() = user_id);

-- 3. Tabell för sedda avsnitt i TV-serier (Episode Tracker)
create table if not exists public.watched_episodes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  tmdb_id integer not null,
  season_number integer not null,
  episode_number integer not null,
  watched_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, tmdb_id, season_number, episode_number)
);

-- RLS för watched_episodes
alter table public.watched_episodes enable row level security;

create policy "Användare kan se sina sedda avsnitt"
  on public.watched_episodes for select
  using (auth.uid() = user_id);

create policy "Användare kan markera avsnitt som sedda"
  on public.watched_episodes for insert
  with check (auth.uid() = user_id);

create policy "Användare kan avmarkera sedda avsnitt"
  on public.watched_episodes for delete
  using (auth.uid() = user_id);

-- Index för snabb sökning och statistik
create index if not exists idx_user_media_user on public.user_media(user_id, status);
create index if not exists idx_watched_episodes_user_show on public.watched_episodes(user_id, tmdb_id);
