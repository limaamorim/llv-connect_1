-- LLV Connect: rode este arquivo inteiro no SQL Editor do Supabase

create table admins (user_id uuid primary key references auth.users on delete cascade);

-- Verifica se quem está logado é administrador
create or replace function is_admin() returns boolean language sql security definer stable set search_path = public as
$$ select exists (select 1 from admins where user_id = auth.uid()) $$;

create table categorias (id uuid primary key default gen_random_uuid(), nome text not null unique,
  universal boolean not null default false); -- universal = não depende do modelo (cabos, carregadores...)
create table marcas (id uuid primary key default gen_random_uuid(), nome text not null unique);
create table modelos (id uuid primary key default gen_random_uuid(), marca_id uuid not null references marcas on delete cascade,
  nome text not null, unique (marca_id, nome));
create table produtos (id uuid primary key default gen_random_uuid(), nome text not null, descricao text,
  categoria_id uuid not null references categorias on delete restrict,
  preco_venda numeric(10,2) not null check (preco_venda >= 0), preco_custo numeric(10,2) not null default 0 check (preco_custo >= 0),
  imagem_url text, estoque int not null default 0 check (estoque >= 0), ativo boolean not null default true, criado_em timestamptz default now());
create table produtos_modelos (produto_id uuid references produtos on delete cascade, modelo_id uuid references modelos on delete cascade,
  primary key (produto_id, modelo_id));
create table vendas (id uuid primary key default gen_random_uuid(), data date not null default current_date,
  forma_pagamento text not null, desconto numeric(10,2) not null default 0 check (desconto >= 0),
  status text not null default 'concluida' check (status in ('concluida','cancelada')), criado_em timestamptz default now());
-- Preços ficam gravados no item para preservar o histórico
create table itens_venda (id uuid primary key default gen_random_uuid(), venda_id uuid not null references vendas on delete cascade,
  produto_id uuid not null references produtos on delete restrict, quantidade int not null check (quantidade > 0),
  preco_venda numeric(10,2) not null, preco_custo numeric(10,2) not null);

-- RLS: admin faz tudo; público só LÊ categorias, marcas, modelos e compatibilidades
do $$ declare t text; begin
  foreach t in array array['admins','categorias','marcas','modelos','produtos','produtos_modelos','vendas','itens_venda'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy admin_total on %I for all to authenticated using (is_admin()) with check (is_admin())', t);
  end loop;
  foreach t in array array['categorias','marcas','modelos','produtos_modelos'] loop
    execute format('create policy leitura_publica on %I for select using (true)', t);
  end loop;
end $$;

-- View pública: só produtos ativos e SEM preço de custo (a tabela produtos continua restrita ao admin)
create view produtos_publicos as
  select p.id, p.nome, p.descricao, p.categoria_id, p.preco_venda, p.imagem_url, p.estoque, c.universal,
    coalesce((select array_agg(pm.modelo_id) from produtos_modelos pm where pm.produto_id = p.id), '{}') as modelos_ids
  from produtos p join categorias c on c.id = p.categoria_id where p.ativo;
grant select on produtos_publicos to anon, authenticated;

-- Registra a venda e desconta o estoque (tudo ou nada). Usa o preço atual do produto.
create or replace function registrar_venda(p_data date, p_pagamento text, p_desconto numeric, p_itens jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; i jsonb; p produtos%rowtype; q int;
begin
  if not is_admin() then raise exception 'Sem permissão'; end if;
  if p_itens is null or jsonb_array_length(p_itens) = 0 then raise exception 'A venda precisa de itens'; end if;
  insert into vendas (data, forma_pagamento, desconto) values (p_data, p_pagamento, coalesce(p_desconto, 0)) returning id into v_id;
  for i in select * from jsonb_array_elements(p_itens) loop
    q := (i->>'quantidade')::int;
    select * into p from produtos where id = (i->>'produto_id')::uuid for update;
    if p.id is null or q <= 0 then raise exception 'Item inválido'; end if;
    if p.estoque < q then raise exception 'Estoque insuficiente para %', p.nome; end if;
    update produtos set estoque = estoque - q where id = p.id;
    insert into itens_venda (venda_id, produto_id, quantidade, preco_venda, preco_custo) values (v_id, p.id, q, p.preco_venda, p.preco_custo);
  end loop;
  return v_id;
end $$;

-- Cancela a venda e devolve o estoque UMA única vez (trava a linha e confere o status)
create or replace function cancelar_venda(p_id uuid) returns void language plpgsql security definer set search_path = public as $$
declare v vendas%rowtype;
begin
  if not is_admin() then raise exception 'Sem permissão'; end if;
  select * into v from vendas where id = p_id for update;
  if v.id is null then raise exception 'Venda não encontrada'; end if;
  if v.status <> 'concluida' then raise exception 'Esta venda já foi cancelada'; end if;
  update produtos pr set estoque = pr.estoque + s.q
    from (select produto_id, sum(quantidade) q from itens_venda where venda_id = p_id group by produto_id) s where pr.id = s.produto_id;
  update vendas set status = 'cancelada' where id = p_id;
end $$;
revoke all on function registrar_venda, cancelar_venda from public, anon;
grant execute on function registrar_venda, cancelar_venda to authenticated;

-- Imagens dos produtos (bucket público para leitura, upload só admin)
insert into storage.buckets (id, name, public) values ('produtos', 'produtos', true) on conflict do nothing;
create policy imagens_leitura on storage.objects for select using (bucket_id = 'produtos');
create policy imagens_admin on storage.objects for all to authenticated
  using (bucket_id = 'produtos' and is_admin()) with check (bucket_id = 'produtos' and is_admin());

-- Dados iniciais (edite à vontade pelo painel)
insert into categorias (nome, universal) values ('Capinhas', false), ('Películas', false), ('Carregadores', true), ('Cabos', true), ('Fones', true);
insert into marcas (nome) values ('Apple'), ('Samsung'), ('Xiaomi'), ('Motorola');
insert into modelos (marca_id, nome) select id, unnest(array['iPhone 12 Pro Max','iPhone 13','iPhone 15']) from marcas where nome = 'Apple';
insert into modelos (marca_id, nome) select id, unnest(array['Galaxy S23','Galaxy S24']) from marcas where nome = 'Samsung';
insert into modelos (marca_id, nome) select id, unnest(array['Redmi Note 12','Redmi Note 13']) from marcas where nome = 'Xiaomi';
insert into modelos (marca_id, nome) select id, unnest(array['Moto G54','Moto G84']) from marcas where nome = 'Motorola';
