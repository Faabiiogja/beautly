-- Teto de agendamentos: no máximo 3 agendamentos futuros confirmados por telefone em cada tenant.
-- Imposto no banco (não só no app) e serializado por telefone, para que pedidos simultâneos não furem
-- o limite. O erro usa o SQLSTATE próprio BK001 ("booking limit"), que o app traduz para a cliente.
create function enforce_client_booking_limit() returns trigger
  language plpgsql
  as $$
begin
  if new.status <> 'confirmed' then
    return new;
  end if;

  -- um lock por (tenant, telefone) até o fim da transação: inserções concorrentes da mesma
  -- cliente passam por aqui uma de cada vez e enxergam as anteriores
  perform pg_advisory_xact_lock(hashtextextended(new.tenant_id::text || ':' || new.client_phone, 0));

  if (
    select count(*)
    from appointments a
    where a.tenant_id = new.tenant_id
      and a.client_phone = new.client_phone
      and a.status = 'confirmed'
      and a.end_time > now()
  ) >= 3 then
    raise exception 'booking limit reached for this phone' using errcode = 'BK001';
  end if;

  return new;
end;
$$;

create trigger appointments_client_booking_limit
  before insert on appointments
  for each row execute function enforce_client_booking_limit();
