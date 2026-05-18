-- ─── Food sources ─────────────────────────────────────────────────────────────

insert into public.food_sources (code, name, source_type, license_name, priority) values
  ('ennys2', 'ENNyS2',               'official',  'CC BY 4.0',        10),
  ('sifega', 'SIFeGA/ANMAT',         'official',  'Validar licencia',  20),
  ('off',    'Open Food Facts',      'community', 'ODbL',              30),
  ('usda',   'USDA FoodData Central','official',  'CC0 1.0',           40),
  ('manual', 'Manual',               'manual',    NULL,               100)
on conflict (code) do nothing;

-- ─── Food categories ──────────────────────────────────────────────────────────

insert into public.food_categories (slug, name, sort_order) values
  ('proteinas',          'Proteínas',           1),
  ('carbohidratos',      'Carbohidratos',        2),
  ('grasas',             'Grasas saludables',    3),
  ('lacteos',            'Lácteos',              4),
  ('frutas',             'Frutas',               5),
  ('verduras',           'Verduras',             6),
  ('legumbres',          'Legumbres',            7),
  ('suplementos',        'Suplementos',          8),
  ('comidas-argentinas', 'Comidas argentinas',   9)
on conflict (slug) do nothing;

-- ─── Alimentos genéricos argentinos ──────────────────────────────────────────

insert into public.foods
  (category_id, source_id, source_food_id, canonical_name,
   is_generic, is_verified, verification_status,
   kcal_100g, protein_g_100g, carbs_g_100g, fat_g_100g,
   fiber_g_100g, sodium_mg_100g,
   default_portion_name, default_portion_g)
values
  -- Proteínas
  ((select id from public.food_categories where slug='proteinas'),
   (select id from public.food_sources where code='usda'), 'usda-chicken-breast',
   'Pechuga de pollo cocida', true, false, 'draft',
   165, 31.0, 0.0, 3.6, 0.0, 74, '1 porción', 150),

  ((select id from public.food_categories where slug='proteinas'),
   (select id from public.food_sources where code='usda'), 'usda-egg-whole',
   'Huevo entero', true, false, 'draft',
   143, 12.6, 0.7, 9.5, 0.0, 142, '1 unidad', 50),

  ((select id from public.food_categories where slug='proteinas'),
   (select id from public.food_sources where code='usda'), 'usda-tuna-canned',
   'Atún al natural (lata)', true, false, 'draft',
   116, 25.5, 0.0, 1.0, 0.0, 333, '1 lata', 110),

  -- Carbohidratos
  ((select id from public.food_categories where slug='carbohidratos'),
   (select id from public.food_sources where code='usda'), 'usda-oats',
   'Avena arrollada', true, false, 'draft',
   389, 16.9, 66.3, 6.9, 10.6, 2, '1 taza', 80),

  ((select id from public.food_categories where slug='carbohidratos'),
   (select id from public.food_sources where code='usda'), 'usda-white-rice-cooked',
   'Arroz blanco cocido', true, false, 'draft',
   130, 2.7, 28.2, 0.3, 0.4, 1, '1 taza', 180),

  ((select id from public.food_categories where slug='carbohidratos'),
   (select id from public.food_sources where code='usda'), 'usda-sweet-potato',
   'Batata cocida', true, false, 'draft',
   86, 1.6, 20.1, 0.1, 3.0, 27, '1 unidad', 150),

  -- Lácteos
  ((select id from public.food_categories where slug='lacteos'),
   (select id from public.food_sources where code='usda'), 'usda-whole-milk',
   'Leche entera', true, false, 'draft',
   61, 3.2, 4.8, 3.3, 0.0, 43, '1 vaso', 250),

  ((select id from public.food_categories where slug='lacteos'),
   (select id from public.food_sources where code='usda'), 'usda-greek-yogurt',
   'Yogur griego natural', true, false, 'draft',
   59, 10.2, 3.6, 0.4, 0.0, 36, '1 pote', 170),

  ((select id from public.food_categories where slug='lacteos'),
   (select id from public.food_sources where code='usda'), 'usda-cottage-cheese',
   'Queso cottage', true, false, 'draft',
   98, 11.1, 3.4, 4.3, 0.0, 364, '1 taza', 200),

  -- Frutas
  ((select id from public.food_categories where slug='frutas'),
   (select id from public.food_sources where code='usda'), 'usda-banana',
   'Banana', true, false, 'draft',
   89, 1.1, 22.8, 0.3, 2.6, 1, '1 unidad', 120),

  ((select id from public.food_categories where slug='frutas'),
   (select id from public.food_sources where code='usda'), 'usda-apple',
   'Manzana', true, false, 'draft',
   52, 0.3, 13.8, 0.2, 2.4, 1, '1 unidad', 182),

  -- Grasas
  ((select id from public.food_categories where slug='grasas'),
   (select id from public.food_sources where code='usda'), 'usda-avocado',
   'Palta', true, false, 'draft',
   160, 2.0, 8.5, 14.7, 6.7, 7, '½ unidad', 75),

  ((select id from public.food_categories where slug='grasas'),
   (select id from public.food_sources where code='usda'), 'usda-almonds',
   'Almendras', true, false, 'draft',
   579, 21.2, 21.6, 49.9, 12.5, 1, 'Puñado', 28),

  ((select id from public.food_categories where slug='grasas'),
   (select id from public.food_sources where code='usda'), 'usda-peanut-butter',
   'Manteca de maní', true, false, 'draft',
   598, 22.2, 22.3, 51.1, 6.0, 469, '2 cdas', 32),

  -- Suplementos
  ((select id from public.food_categories where slug='suplementos'),
   (select id from public.food_sources where code='manual'), 'manual-creatine',
   'Creatina monohidrato', true, false, 'draft',
   0, 0.0, 0.0, 0.0, 0.0, 0, '1 medida', 5),

  ((select id from public.food_categories where slug='suplementos'),
   (select id from public.food_sources where code='manual'), 'manual-whey',
   'Proteína whey (polvo)', true, false, 'draft',
   380, 74.0, 10.0, 5.0, 0.0, 100, '1 medida', 30),

  -- Comidas argentinas
  ((select id from public.food_categories where slug='comidas-argentinas'),
   (select id from public.food_sources where code='ennys2'), 'ennys2-empanada-carne',
   'Empanada de carne', true, false, 'draft',
   265, 10.0, 24.0, 14.0, 2.0, 430, '1 unidad', 85),

  ((select id from public.food_categories where slug='comidas-argentinas'),
   (select id from public.food_sources where code='ennys2'), 'ennys2-milanesa-ternera',
   'Milanesa de ternera (frita)', true, false, 'draft',
   280, 22.0, 14.0, 14.0, 0.5, 380, '1 porción', 120),

  ((select id from public.food_categories where slug='comidas-argentinas'),
   (select id from public.food_sources where code='ennys2'), 'ennys2-mate-amargo',
   'Mate amargo (infusión)', true, false, 'draft',
   3, 0.2, 0.3, 0.0, 0.0, 2, '1 cebadura', 50)
on conflict (source_id, source_food_id) do nothing;
