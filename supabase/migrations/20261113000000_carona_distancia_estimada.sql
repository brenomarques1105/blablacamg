alter table public.caronas
  add column if not exists distancia_estimada_metros integer
  check (distancia_estimada_metros between 100 and 150000);
