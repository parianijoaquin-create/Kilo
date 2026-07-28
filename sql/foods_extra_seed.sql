-- ─── foods_extra_seed.sql ─────────────────────────────────────────────────────
-- Alimentos adicionales que faltaban en foods_100_seed.sql.
--   · 7 pescados de río argentinos (pacú y afines)
--   · 40 alimentos de consumo diario en una casa argentina
-- Idempotente: se puede re-ejecutar sin duplicar (ON CONFLICT DO NOTHING).
-- Ejecutar DESPUÉS de foods_100_seed.sql.
-- Valores por 100 g. Fuente: estimaciones de seed → is_verified=false, 'draft'.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.foods (
  category_id, source_id, source_food_id, canonical_name,
  is_generic, is_verified, verification_status,
  kcal_100g, protein_g_100g, carbs_g_100g, fat_g_100g,
  fiber_g_100g, sugar_g_100g, sodium_mg_100g,
  default_portion_name, default_portion_g,
  raw_payload
) VALUES

-- ── PESCADOS DE RÍO (7) ───────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='pescados'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'pacu','Pacú',true,false,'draft',
   160,19.0,0.0,9.0,0.0,0.0,55,'1 porción',150,
   '{"id":"pacu","nombre_es":"Pacú","categoria":"pescado","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='pescados'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'surubi','Surubí',true,false,'draft',
   90,18.0,0.0,1.5,0.0,0.0,50,'1 porción',150,
   '{"id":"surubi","nombre_es":"Surubí","categoria":"pescado","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='pescados'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'dorado_rio','Dorado (de río)',true,false,'draft',
   105,19.0,0.0,3.0,0.0,0.0,55,'1 porción',150,
   '{"id":"dorado_rio","nombre_es":"Dorado (de río)","categoria":"pescado","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='pescados'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'boga','Boga',true,false,'draft',
   120,18.0,0.0,5.0,0.0,0.0,55,'1 porción',150,
   '{"id":"boga","nombre_es":"Boga","categoria":"pescado","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='pescados'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'sabalo','Sábalo',true,false,'draft',
   170,17.0,0.0,11.0,0.0,0.0,60,'1 porción',150,
   '{"id":"sabalo","nombre_es":"Sábalo","categoria":"pescado","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='pescados'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'pejerrey','Pejerrey',true,false,'draft',
   85,18.5,0.0,1.0,0.0,0.0,60,'1 porción',150,
   '{"id":"pejerrey","nombre_es":"Pejerrey","categoria":"pescado","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='pescados'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'trucha','Trucha',true,false,'draft',
   140,20.0,0.0,6.0,0.0,0.0,60,'1 porción',150,
   '{"id":"trucha","nombre_es":"Trucha","categoria":"pescado","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

-- ── FRUTAS (5) ────────────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='frutas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'uva','Uva',true,false,'draft',
   69,0.7,18.1,0.2,0.9,15.5,2,'Un racimo chico',100,
   '{"id":"uva","nombre_es":"Uva","categoria":"fruta","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='frutas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'ciruela','Ciruela',true,false,'draft',
   46,0.7,11.4,0.3,1.4,9.9,0,'1 unidad',66,
   '{"id":"ciruela","nombre_es":"Ciruela","categoria":"fruta","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='frutas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'sandia','Sandía',true,false,'draft',
   30,0.6,7.6,0.2,0.4,6.2,1,'1 rodaja',200,
   '{"id":"sandia","nombre_es":"Sandía","categoria":"fruta","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='frutas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'melon','Melón',true,false,'draft',
   34,0.8,8.2,0.2,0.9,7.9,16,'1 rodaja',150,
   '{"id":"melon","nombre_es":"Melón","categoria":"fruta","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='frutas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'limon','Limón',true,false,'draft',
   29,1.1,9.3,0.3,2.8,2.5,2,'1 unidad',60,
   '{"id":"limon","nombre_es":"Limón","categoria":"fruta","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

-- ── VERDURAS (7) ──────────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'choclo','Choclo (maíz dulce)',true,false,'draft',
   96,3.4,21.0,1.5,2.4,4.5,15,'1 unidad',100,
   '{"id":"choclo","nombre_es":"Choclo (maíz dulce)","categoria":"verdura","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'zapallito_verde','Zapallito verde',true,false,'draft',
   17,1.2,3.1,0.3,1.0,2.5,8,'1 unidad',150,
   '{"id":"zapallito_verde","nombre_es":"Zapallito verde","categoria":"verdura","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'morron_rojo','Morrón rojo',true,false,'draft',
   31,1.0,6.0,0.3,2.1,4.2,4,'1 unidad',120,
   '{"id":"morron_rojo","nombre_es":"Morrón rojo","categoria":"verdura","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'berenjena','Berenjena',true,false,'draft',
   25,1.0,5.9,0.2,3.0,3.5,2,'1/2 unidad',100,
   '{"id":"berenjena","nombre_es":"Berenjena","categoria":"verdura","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'remolacha','Remolacha',true,false,'draft',
   44,1.7,10.0,0.2,2.0,7.9,77,'1 unidad',80,
   '{"id":"remolacha","nombre_es":"Remolacha","categoria":"verdura","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'acelga','Acelga',true,false,'draft',
   20,1.9,3.7,0.1,2.1,1.1,180,'1 plato',100,
   '{"id":"acelga","nombre_es":"Acelga","categoria":"verdura","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'pepino','Pepino',true,false,'draft',
   15,0.7,3.6,0.1,0.5,1.7,2,'1/2 unidad',100,
   '{"id":"pepino","nombre_es":"Pepino","categoria":"verdura","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'pure_tomate','Puré de tomate',true,false,'draft',
   35,1.5,7.0,0.3,1.5,5.0,400,'1/2 taza',100,
   '{"id":"pure_tomate","nombre_es":"Puré de tomate","categoria":"verdura","tipo":"producto_base","source":"seed_estimate","verified":false}'::jsonb),

-- ── CEREALES Y PASTAS (4) ─────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='cereales'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'noquis_papa','Ñoquis de papa',true,false,'draft',
   130,3.5,27.0,0.8,1.5,1.0,300,'1 plato',200,
   '{"id":"noquis_papa","nombre_es":"Ñoquis de papa","categoria":"pasta","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='cereales'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'ravioles','Ravioles (pasta rellena)',true,false,'draft',
   180,8.0,26.0,5.0,1.8,1.5,350,'1 plato',200,
   '{"id":"ravioles","nombre_es":"Ravioles (pasta rellena)","categoria":"pasta","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='cereales'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'polenta_cocida','Polenta cocida',true,false,'draft',
   85,2.0,18.0,0.4,1.2,0.2,5,'1 plato',200,
   '{"id":"polenta_cocida","nombre_es":"Polenta cocida","categoria":"cereal","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='cereales'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'pan_rallado','Pan rallado',true,false,'draft',
   380,13.0,72.0,5.0,4.0,3.0,700,'1 cda',15,
   '{"id":"pan_rallado","nombre_es":"Pan rallado","categoria":"cereal","tipo":"producto_base","source":"seed_estimate","verified":false}'::jsonb),

-- ── PANIFICADOS (3) ───────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='panificados'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'pan_lactal','Pan lactal (de molde)',true,false,'draft',
   265,8.0,49.0,4.0,2.5,5.0,490,'1 rebanada',25,
   '{"id":"pan_lactal","nombre_es":"Pan lactal (de molde)","categoria":"panificado","tipo":"producto_base","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='panificados'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'pan_pancho_hamburguesa','Pan de pancho/hamburguesa',true,false,'draft',
   280,9.0,50.0,5.0,2.0,6.0,450,'1 pan',55,
   '{"id":"pan_pancho_hamburguesa","nombre_es":"Pan de pancho/hamburguesa","categoria":"panificado","tipo":"producto_base","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='panificados'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'factura_promedio','Factura (promedio)',true,false,'draft',
   400,7.0,45.0,21.0,1.5,15.0,300,'1 unidad',45,
   '{"id":"factura_promedio","nombre_es":"Factura (promedio)","categoria":"panificado","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

-- ── LÁCTEOS (2) ───────────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='lacteos'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'queso_crema_untable','Queso crema untable',true,false,'draft',
   250,6.0,4.0,24.0,0.0,3.0,320,'1 cda',20,
   '{"id":"queso_crema_untable","nombre_es":"Queso crema untable","categoria":"lacteo","tipo":"producto_base","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='lacteos'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'crema_de_leche','Crema de leche',true,false,'draft',
   340,2.3,3.0,36.0,0.0,3.0,30,'1 cda',15,
   '{"id":"crema_de_leche","nombre_es":"Crema de leche","categoria":"lacteo","tipo":"producto_base","source":"seed_estimate","verified":false}'::jsonb),

-- ── FIAMBRES Y EMBUTIDOS (4) → categoría proteínas ────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'salame','Salame',true,false,'draft',
   380,22.0,1.5,32.0,0.0,0.5,1800,'5 fetas',30,
   '{"id":"salame","nombre_es":"Salame","categoria":"fiambre","tipo":"producto_base","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'mortadela','Mortadela',true,false,'draft',
   310,15.0,3.0,27.0,0.0,0.5,1200,'2 fetas',30,
   '{"id":"mortadela","nombre_es":"Mortadela","categoria":"fiambre","tipo":"producto_base","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'panceta','Panceta',true,false,'draft',
   540,12.0,1.4,53.0,0.0,0.0,1500,'2 fetas',30,
   '{"id":"panceta","nombre_es":"Panceta","categoria":"fiambre","tipo":"producto_base","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'salchicha_viena','Salchicha tipo viena (pancho)',true,false,'draft',
   260,11.0,3.0,23.0,0.0,1.0,900,'1 unidad',50,
   '{"id":"salchicha_viena","nombre_es":"Salchicha tipo viena (pancho)","categoria":"fiambre","tipo":"producto_base","source":"seed_estimate","verified":false}'::jsonb),

-- ── CARNES (3) → categoría proteínas ──────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'bife_de_chorizo','Bife de chorizo (parrilla)',true,false,'draft',
   250,26.0,0.0,16.0,0.0,0.0,60,'1 bife',200,
   '{"id":"bife_de_chorizo","nombre_es":"Bife de chorizo (parrilla)","categoria":"carne","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'bondiola_cerdo','Bondiola de cerdo',true,false,'draft',
   240,20.0,0.0,18.0,0.0,0.0,60,'1 porción',150,
   '{"id":"bondiola_cerdo","nombre_es":"Bondiola de cerdo","categoria":"carne","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'medallon_hamburguesa','Medallón de hamburguesa',true,false,'draft',
   260,20.0,2.0,19.0,0.0,0.0,400,'1 medallón',80,
   '{"id":"medallon_hamburguesa","nombre_es":"Medallón de hamburguesa","categoria":"carne","tipo":"producto_base","source":"seed_estimate","verified":false}'::jsonb),

-- ── COMIDAS ARGENTINAS (3) ────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'pizza_muzzarella','Pizza a la muzzarella (porción)',true,false,'draft',
   270,12.0,30.0,11.0,2.0,3.0,600,'1 porción',120,
   '{"id":"pizza_muzzarella","nombre_es":"Pizza a la muzzarella (porción)","categoria":"comida tipica","tipo":"plato","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'pure_de_papa','Puré de papa',true,false,'draft',
   90,2.0,15.0,2.5,1.5,1.5,300,'1 plato',200,
   '{"id":"pure_de_papa","nombre_es":"Puré de papa","categoria":"comida tipica","tipo":"plato","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'ensalada_rusa','Ensalada rusa',true,false,'draft',
   150,2.0,12.0,10.0,2.0,3.0,350,'1 porción',150,
   '{"id":"ensalada_rusa","nombre_es":"Ensalada rusa","categoria":"comida tipica","tipo":"plato","source":"seed_estimate","verified":false}'::jsonb),

-- ── DULCES (4) ────────────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='dulces'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'flan','Flan',true,false,'draft',
   145,4.0,22.0,4.5,0.0,20.0,65,'1 porción',120,
   '{"id":"flan","nombre_es":"Flan","categoria":"dulce","tipo":"plato","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='dulces'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'mermelada','Mermelada',true,false,'draft',
   250,0.4,62.0,0.1,1.0,50.0,30,'1 cda',20,
   '{"id":"mermelada","nombre_es":"Mermelada","categoria":"dulce","tipo":"producto_base","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='dulces'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'dulce_membrillo','Dulce de membrillo',true,false,'draft',
   270,0.3,68.0,0.1,1.5,55.0,20,'1 porción',40,
   '{"id":"dulce_membrillo","nombre_es":"Dulce de membrillo","categoria":"dulce","tipo":"producto_base","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='dulces'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'helado_crema','Helado de crema',true,false,'draft',
   210,3.5,24.0,11.0,0.5,21.0,80,'1 bocha',60,
   '{"id":"helado_crema","nombre_es":"Helado de crema","categoria":"dulce","tipo":"producto_base","source":"seed_estimate","verified":false}'::jsonb),

-- ── GRASAS (2) ────────────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='grasas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'mayonesa','Mayonesa',true,false,'draft',
   680,1.0,2.0,75.0,0.0,1.5,600,'1 cda',15,
   '{"id":"mayonesa","nombre_es":"Mayonesa","categoria":"grasa","tipo":"producto_base","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='grasas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'aceitunas_verdes','Aceitunas verdes',true,false,'draft',
   145,1.0,4.0,15.0,3.3,0.5,1550,'5 unidades',25,
   '{"id":"aceitunas_verdes","nombre_es":"Aceitunas verdes","categoria":"grasa","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

-- ── BEBIDAS (2) ───────────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='bebidas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'cafe_con_leche','Café con leche',true,false,'draft',
   30,1.7,2.5,1.3,0.0,2.5,25,'1 taza',200,
   '{"id":"cafe_con_leche","nombre_es":"Café con leche","categoria":"bebida","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='bebidas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'mate_cebado','Mate cebado',true,false,'draft',
   3,0.2,0.5,0.0,0.0,0.0,3,'1 mate',50,
   '{"id":"mate_cebado","nombre_es":"Mate cebado","categoria":"bebida","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb)

ON CONFLICT (source_id, source_food_id) DO NOTHING;
