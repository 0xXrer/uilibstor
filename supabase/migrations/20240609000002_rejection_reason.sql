alter table public.libraries
  add column if not exists rejection_reason text;
