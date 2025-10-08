-- Optional: RPC to return products with ingredient names (used by frontend if created)
create or replace function public.get_products_with_ingredients()
returns table(producto_id bigint, nombre text, precio_publico numeric, tipo text, vaso text, volumen_onzas integer) as $$
  select id, nombre, precio_publico, tipo, vaso, volumen_onzas from public.productos;
$$ language sql stable;
