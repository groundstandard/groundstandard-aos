drop policy if exists "Allow self auth audit inserts" on public.audit_logs;

create policy "Allow self auth audit inserts"
  on public.audit_logs
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and table_name = 'auth'
    and action in ('login', 'logout')
  );
