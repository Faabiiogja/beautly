-- Endurece o upload de logos: só nomes no padrão "<tenant_id>/logo-<timestamp>.<png|jpg|webp>".
-- Sem subpastas nem nomes livres. select/delete ficam sem checar `active` de propósito: um tenant
-- desativado ainda pode limpar os próprios arquivos, mas não enviar nem substituir.
drop policy "active tenant owner uploads own logo" on storage.objects;
create policy "active tenant owner uploads own logo"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'logos'
    and name ~ ('^' || auth.uid()::text || '/logo-[0-9]+\.(png|jpg|webp)$')
    and exists (select 1 from public.tenants t where t.id = auth.uid() and t.active)
  );

drop policy "active tenant owner replaces own logo" on storage.objects;
create policy "active tenant owner replaces own logo"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (select 1 from public.tenants t where t.id = auth.uid() and t.active)
  )
  with check (
    bucket_id = 'logos'
    and name ~ ('^' || auth.uid()::text || '/logo-[0-9]+\.(png|jpg|webp)$')
    and exists (select 1 from public.tenants t where t.id = auth.uid() and t.active)
  );
