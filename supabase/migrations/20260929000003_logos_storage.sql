-- Bucket público de logos. Cada tenant só grava na própria pasta ("<tenant_id>/...") e só se estiver ativo.
-- Leitura pública é pelo endpoint /object/public (bucket público), sem policy de select para anon.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', true, 1048576, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

-- select é necessário para a dona substituir/apagar o próprio arquivo (o DELETE lê a linha antes)
create policy "tenant owner reads own logos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "active tenant owner uploads own logo"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (select 1 from public.tenants t where t.id = auth.uid() and t.active)
  );

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
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (select 1 from public.tenants t where t.id = auth.uid() and t.active)
  );

create policy "tenant owner deletes own logo"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
