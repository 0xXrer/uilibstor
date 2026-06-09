-- Allow authors to roll back failed pending submissions.
create policy "authors delete own pending libraries"
  on public.libraries for delete
  using (auth.uid() = author_id and status = 'pending');
