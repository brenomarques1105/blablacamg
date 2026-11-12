-- Regras de acesso do BlablaCAMG. Execute somente após conferir as políticas existentes.
begin;

-- Políticas permissivas se somam com OR. Exija revisão das políticas anteriores.
do $$
declare existing text;
begin
  select string_agg(tablename || '.' || policyname, ', ') into existing
  from pg_policies
  where schemaname = 'public' and tablename in ('usuarios', 'caronas')
    and policyname not in (
      'blablacamg_authenticated_read_usuarios', 'blablacamg_driver_insert_own_profile',
      'blablacamg_driver_update_own_profile', 'blablacamg_authenticated_read_caronas',
      'blablacamg_driver_insert_own_ride', 'blablacamg_driver_update_own_ride'
    );
  if existing is not null then
    raise exception 'Revise as políticas existentes antes de aplicar este SQL: %', existing;
  end if;
end $$;
-- O aplicativo não cria nem altera tabelas ou colunas.

alter table public.usuarios enable row level security;
alter table public.caronas enable row level security;

grant select, insert, update on public.usuarios to authenticated;
grant select, insert, update on public.caronas to authenticated;

drop policy if exists blablacamg_authenticated_read_usuarios on public.usuarios;
drop policy if exists blablacamg_driver_insert_own_profile on public.usuarios;
drop policy if exists blablacamg_driver_update_own_profile on public.usuarios;
drop policy if exists blablacamg_authenticated_read_caronas on public.caronas;
drop policy if exists blablacamg_driver_insert_own_ride on public.caronas;
drop policy if exists blablacamg_driver_update_own_ride on public.caronas;

create policy blablacamg_authenticated_read_usuarios
on public.usuarios for select to authenticated
using (true);

create policy blablacamg_driver_insert_own_profile
on public.usuarios for insert to authenticated
with check (
  id = (select auth.uid())
  and length(trim(nome)) > 0
  and length(trim(orgao)) > 0
  and (telefone is null or telefone ~ '^[0-9]{10,11}$')
);

create policy blablacamg_driver_update_own_profile
on public.usuarios for update to authenticated
using (id = (select auth.uid()))
with check (
  id = (select auth.uid())
  and length(trim(nome)) > 0
  and length(trim(orgao)) > 0
  and (telefone is null or telefone ~ '^[0-9]{10,11}$')
);

create policy blablacamg_authenticated_read_caronas
on public.caronas for select to authenticated
using (
  (ativa = true and data_carona >= (now() at time zone 'America/Sao_Paulo')::date)
  or motorista_id = (select auth.uid())
);

create policy blablacamg_driver_insert_own_ride
on public.caronas for insert to authenticated
with check (
  motorista_id = (select auth.uid())
  and ativa = true
  and data_carona >= (now() at time zone 'America/Sao_Paulo')::date
  and tipo_trajeto in ('Ida', 'Volta')
  and vagas between 1 and 8
  and length(trim(bairro_origem)) > 0
  and length(trim(destino)) > 0
  and length(trim(rota_principal)) > 0
  and (
    (tipo_trajeto = 'Ida' and destino = 'Cidade Administrativa (CAMG)')
    or (tipo_trajeto = 'Volta' and bairro_origem = 'CAMG')
  )
);

create policy blablacamg_driver_update_own_ride
on public.caronas for update to authenticated
using (motorista_id = (select auth.uid()))
with check (
  motorista_id = (select auth.uid())
  and tipo_trajeto in ('Ida', 'Volta')
  and vagas between 1 and 8
  and length(trim(bairro_origem)) > 0
  and length(trim(destino)) > 0
  and length(trim(rota_principal)) > 0
  and (
    (tipo_trajeto = 'Ida' and destino = 'Cidade Administrativa (CAMG)')
    or (tipo_trajeto = 'Volta' and bairro_origem = 'CAMG')
  )
);

commit;
