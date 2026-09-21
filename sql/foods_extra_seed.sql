-- ─── foods_extra_seed.sql ─────────────────────────────────────────────────────
-- 58 alimentos de consumo diario en una casa argentina que faltaban en el
-- catálogo de producción (proyecto Supabase udenyeccwhzwounqcbta):
-- 18 (1ra tanda) + 16 (claras + platos) + 24 (verduras, bebidas, snacks, achuras…).
--
-- Estado real (2026-07-28):
--   · Estos 58 YA fueron insertados en producción vía la API REST (source=manual).
--     Este archivo es el registro re-ejecutable de esa carga; correrlo de nuevo
--     es un no-op gracias a ON CONFLICT (source_id, source_food_id) DO NOTHING.
--   · Los 7 pescados de río (pacú, surubí, dorado, boga, sábalo, pejerrey, trucha)
--     NO están acá: ya existían en el catálogo (se cargaron por separado).
--   · Se omitieron ~22 propuestos que ya existían (mayonesa, uvas, berenjena,
--     mate amargo, flan de huevo, ravioles, etc.) para no duplicar.
--
-- Fuente 'manual' (id existente en food_sources). Valores por 100 g estimados
-- → is_verified=false, verification_status='draft'.
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO public.foods (
  category_id, source_id, source_food_id, canonical_name,
  country_code, is_generic, is_verified, verification_status,
  kcal_100g, protein_g_100g, carbs_g_100g, fat_g_100g,
  fiber_g_100g, sugar_g_100g, sodium_mg_100g,
  default_portion_name, default_portion_g,
  raw_payload
) VALUES

-- ── VERDURAS (4) ──────────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'choclo','Choclo (maíz dulce)','AR',true,false,'draft',
   96,3.4,21.0,1.5,2.4,4.5,15,'1 unidad',100,
   '{"id":"choclo","nombre_es":"Choclo (maíz dulce)","categoria":"verdura","tipo":"generico","source":"manual","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'zapallito_verde','Zapallito verde','AR',true,false,'draft',
   17,1.2,3.1,0.3,1.0,2.5,8,'1 unidad',150,
   '{"id":"zapallito_verde","nombre_es":"Zapallito verde","categoria":"verdura","tipo":"generico","source":"manual","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'morron_rojo','Morrón rojo','AR',true,false,'draft',
   31,1.0,6.0,0.3,2.1,4.2,4,'1 unidad',120,
   '{"id":"morron_rojo","nombre_es":"Morrón rojo","categoria":"verdura","tipo":"generico","source":"manual","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'pure_tomate','Puré de tomate','AR',true,false,'draft',
   35,1.5,7.0,0.3,1.5,5.0,400,'1/2 taza',100,
   '{"id":"pure_tomate","nombre_es":"Puré de tomate","categoria":"verdura","tipo":"producto_base","source":"manual","verified":false}'::jsonb),

-- ── CEREALES (2) ──────────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='cereales'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'polenta_cocida','Polenta cocida','AR',true,false,'draft',
   85,2.0,18.0,0.4,1.2,0.2,5,'1 plato',200,
   '{"id":"polenta_cocida","nombre_es":"Polenta cocida","categoria":"cereal","tipo":"generico","source":"manual","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='cereales'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'pan_rallado','Pan rallado','AR',true,false,'draft',
   380,13.0,72.0,5.0,4.0,3.0,700,'1 cda',15,
   '{"id":"pan_rallado","nombre_es":"Pan rallado","categoria":"cereal","tipo":"producto_base","source":"manual","verified":false}'::jsonb),

-- ── PANIFICADOS (3) ───────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='panificados'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'pan_lactal','Pan lactal (de molde)','AR',true,false,'draft',
   265,8.0,49.0,4.0,2.5,5.0,490,'1 rebanada',25,
   '{"id":"pan_lactal","nombre_es":"Pan lactal (de molde)","categoria":"panificado","tipo":"producto_base","source":"manual","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='panificados'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'pan_pancho_hamburguesa','Pan de pancho/hamburguesa','AR',true,false,'draft',
   280,9.0,50.0,5.0,2.0,6.0,450,'1 pan',55,
   '{"id":"pan_pancho_hamburguesa","nombre_es":"Pan de pancho/hamburguesa","categoria":"panificado","tipo":"producto_base","source":"manual","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='panificados'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'factura_promedio','Factura (promedio)','AR',true,false,'draft',
   400,7.0,45.0,21.0,1.5,15.0,300,'1 unidad',45,
   '{"id":"factura_promedio","nombre_es":"Factura (promedio)","categoria":"panificado","tipo":"generico","source":"manual","verified":false}'::jsonb),

-- ── LÁCTEOS (1) ───────────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='lacteos'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'crema_de_leche','Crema de leche','AR',true,false,'draft',
   340,2.3,3.0,36.0,0.0,3.0,30,'1 cda',15,
   '{"id":"crema_de_leche","nombre_es":"Crema de leche","categoria":"lacteo","tipo":"producto_base","source":"manual","verified":false}'::jsonb),

-- ── FIAMBRES Y CARNES (5) → categoría proteínas ───────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'salame','Salame','AR',true,false,'draft',
   380,22.0,1.5,32.0,0.0,0.5,1800,'5 fetas',30,
   '{"id":"salame","nombre_es":"Salame","categoria":"fiambre","tipo":"producto_base","source":"manual","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'panceta','Panceta','AR',true,false,'draft',
   540,12.0,1.4,53.0,0.0,0.0,1500,'2 fetas',30,
   '{"id":"panceta","nombre_es":"Panceta","categoria":"fiambre","tipo":"producto_base","source":"manual","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'bife_de_chorizo','Bife de chorizo (parrilla)','AR',true,false,'draft',
   250,26.0,0.0,16.0,0.0,0.0,60,'1 bife',200,
   '{"id":"bife_de_chorizo","nombre_es":"Bife de chorizo (parrilla)","categoria":"carne","tipo":"generico","source":"manual","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'bondiola_cerdo','Bondiola de cerdo','AR',true,false,'draft',
   240,20.0,0.0,18.0,0.0,0.0,60,'1 porción',150,
   '{"id":"bondiola_cerdo","nombre_es":"Bondiola de cerdo","categoria":"carne","tipo":"generico","source":"manual","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'medallon_hamburguesa','Medallón de hamburguesa','AR',true,false,'draft',
   260,20.0,2.0,19.0,0.0,0.0,400,'1 medallón',80,
   '{"id":"medallon_hamburguesa","nombre_es":"Medallón de hamburguesa","categoria":"carne","tipo":"producto_base","source":"manual","verified":false}'::jsonb),

-- ── COMIDAS ARGENTINAS (3) ────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'pizza_muzzarella','Pizza a la muzzarella (porción)','AR',true,false,'draft',
   270,12.0,30.0,11.0,2.0,3.0,600,'1 porción',120,
   '{"id":"pizza_muzzarella","nombre_es":"Pizza a la muzzarella (porción)","categoria":"comida tipica","tipo":"plato","source":"manual","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'pure_de_papa','Puré de papa','AR',true,false,'draft',
   90,2.0,15.0,2.5,1.5,1.5,300,'1 plato',200,
   '{"id":"pure_de_papa","nombre_es":"Puré de papa","categoria":"comida tipica","tipo":"plato","source":"manual","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'ensalada_rusa','Ensalada rusa','AR',true,false,'draft',
   150,2.0,12.0,10.0,2.0,3.0,350,'1 porción',150,
   '{"id":"ensalada_rusa","nombre_es":"Ensalada rusa","categoria":"comida tipica","tipo":"plato","source":"manual","verified":false}'::jsonb),

-- ── CLARAS DE HUEVO cocidas (4) → categoría proteínas ─────────────────────────
-- Nota: sin grasa agregada los macros son ~idénticos entre cocciones; se
-- separan por nombre para que el usuario las encuentre igual.
  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'clara_huevo_hervida','Clara de huevo hervida','AR',true,false,'draft',
   52,10.9,0.7,0.2,0.0,0.7,166,'1 clara',33,
   '{"id":"clara_huevo_hervida","nombre_es":"Clara de huevo hervida","categoria":"huevo","tipo":"generico","source":"manual","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'clara_huevo_revuelta','Clara de huevo revuelta (sin aceite)','AR',true,false,'draft',
   52,10.9,0.7,0.2,0.0,0.7,166,'2 claras',66,
   '{"id":"clara_huevo_revuelta","nombre_es":"Clara de huevo revuelta (sin aceite)","categoria":"huevo","tipo":"generico","source":"manual","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'clara_huevo_plancha','Clara de huevo a la plancha (sin aceite)','AR',true,false,'draft',
   52,10.9,0.7,0.2,0.0,0.7,166,'2 claras',66,
   '{"id":"clara_huevo_plancha","nombre_es":"Clara de huevo a la plancha (sin aceite)","categoria":"huevo","tipo":"generico","source":"manual","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'claras_liquidas_pasteurizadas','Claras líquidas pasteurizadas (envasadas)','AR',true,false,'draft',
   48,10.1,0.7,0.2,0.0,0.7,160,'1/2 taza',60,
   '{"id":"claras_liquidas_pasteurizadas","nombre_es":"Claras líquidas pasteurizadas (envasadas)","categoria":"huevo","tipo":"producto_base","source":"manual","verified":false}'::jsonb),

-- ── CARNES (2) → categoría proteínas ──────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'vacio_parrilla','Vacío a la parrilla','AR',true,false,'draft',
   230,25.0,0.0,14.0,0.0,0.0,65,'1 porción',200,
   '{"id":"vacio_parrilla","nombre_es":"Vacío a la parrilla","categoria":"carne","tipo":"generico","source":"manual","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'matambre','Matambre','AR',true,false,'draft',
   240,23.0,0.0,16.0,0.0,0.0,65,'1 porción',150,
   '{"id":"matambre","nombre_es":"Matambre","categoria":"carne","tipo":"generico","source":"manual","verified":false}'::jsonb),

-- ── LÁCTEOS (2) ───────────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='lacteos'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'provoleta','Provoleta','AR',true,false,'draft',
   380,25.0,2.0,30.0,0.0,0.5,900,'1 porción',80,
   '{"id":"provoleta","nombre_es":"Provoleta","categoria":"lacteo","tipo":"plato","source":"manual","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='lacteos'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'yogur_bebible','Yogur bebible','AR',true,false,'draft',
   70,2.8,11.0,1.5,0.0,10.0,50,'1 botellita',200,
   '{"id":"yogur_bebible","nombre_es":"Yogur bebible","categoria":"lacteo","tipo":"producto_base","source":"manual","verified":false}'::jsonb),

-- ── VERDURAS / GUARNICIONES (2) ───────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'papas_al_horno','Papas al horno','AR',true,false,'draft',
   130,2.5,20.0,4.5,2.0,1.0,250,'1 porción',200,
   '{"id":"papas_al_horno","nombre_es":"Papas al horno","categoria":"verdura","tipo":"plato","source":"manual","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'batata_frita','Batata frita','AR',true,false,'draft',
   150,1.5,25.0,5.0,3.0,7.0,80,'1 porción',150,
   '{"id":"batata_frita","nombre_es":"Batata frita","categoria":"verdura","tipo":"plato","source":"manual","verified":false}'::jsonb),

-- ── BEBIDAS (1) ───────────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='bebidas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'licuado_banana','Licuado de banana','AR',true,false,'draft',
   80,2.5,14.0,1.5,1.0,11.0,30,'1 vaso',250,
   '{"id":"licuado_banana","nombre_es":"Licuado de banana","categoria":"bebida","tipo":"generico","source":"manual","verified":false}'::jsonb),

-- ── COMIDAS ARGENTINAS (4) ────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'milanesa_napolitana','Milanesa napolitana','AR',true,false,'draft',
   250,17.0,15.0,13.0,1.0,2.0,500,'1 unidad',200,
   '{"id":"milanesa_napolitana","nombre_es":"Milanesa napolitana","categoria":"comida tipica","tipo":"plato","source":"manual","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'sandwich_milanesa','Sándwich de milanesa','AR',true,false,'draft',
   260,14.0,28.0,11.0,2.0,3.0,550,'1 sándwich',250,
   '{"id":"sandwich_milanesa","nombre_es":"Sándwich de milanesa","categoria":"comida tipica","tipo":"plato","source":"manual","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'hamburguesa_completa','Hamburguesa completa','AR',true,false,'draft',
   250,13.0,22.0,12.0,1.5,4.0,500,'1 hamburguesa',220,
   '{"id":"hamburguesa_completa","nombre_es":"Hamburguesa completa","categoria":"comida tipica","tipo":"plato","source":"manual","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'lasagna','Lasagna','AR',true,false,'draft',
   160,8.0,15.0,7.0,1.5,3.0,400,'1 porción',250,
   '{"id":"lasagna","nombre_es":"Lasagna","categoria":"comida tipica","tipo":"plato","source":"manual","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'arroz_con_pollo','Arroz con pollo','AR',true,false,'draft',
   150,9.0,18.0,4.5,1.0,1.0,350,'1 plato',250,
   '{"id":"arroz_con_pollo","nombre_es":"Arroz con pollo","categoria":"comida tipica","tipo":"plato","source":"manual","verified":false}'::jsonb),

-- ══ TERCERA TANDA (24): huecos comunes detectados en el catálogo ══════════════
-- ── COMIDAS ARGENTINAS / GUARNICIONES (4) ─────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'papas_fritas','Papas fritas','AR',true,false,'draft',
   310,3.4,41.0,15.0,3.8,0.3,210,'1 porción',150,
   '{"id": "papas_fritas", "nombre_es": "Papas fritas", "categoria": "comida tipica", "tipo": "plato", "source": "manual", "verified": false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'tallarines_con_salsa','Tallarines con salsa','AR',true,false,'draft',
   130,4.5,22.0,2.5,1.5,3.0,350,'1 plato',250,
   '{"id": "tallarines_con_salsa", "nombre_es": "Tallarines con salsa", "categoria": "comida tipica", "tipo": "plato", "source": "manual", "verified": false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'pure_de_calabaza','Puré de calabaza','AR',true,false,'draft',
   50,1.2,10.0,0.8,1.8,4.0,180,'1 porción',200,
   '{"id": "pure_de_calabaza", "nombre_es": "Puré de calabaza", "categoria": "comida tipica", "tipo": "plato", "source": "manual", "verified": false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'tuco','Tuco','AR',true,false,'draft',
   70,3.0,7.0,3.0,1.5,4.0,400,'1/2 taza',120,
   '{"id": "tuco", "nombre_es": "Tuco", "categoria": "comida tipica", "tipo": "plato", "source": "manual", "verified": false}'::jsonb),

-- ── VERDURAS (4) ──────────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'zapallo','Zapallo','AR',true,false,'draft',
   26,1.0,6.5,0.1,1.5,2.8,1,'1 porción',150,
   '{"id": "zapallo", "nombre_es": "Zapallo", "categoria": "verdura", "tipo": "generico", "source": "manual", "verified": false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'chaucha','Chaucha','AR',true,false,'draft',
   31,1.8,7.0,0.2,2.7,3.3,6,'1 porción',100,
   '{"id": "chaucha", "nombre_es": "Chaucha", "categoria": "verdura", "tipo": "generico", "source": "manual", "verified": false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'radicheta','Radicheta','AR',true,false,'draft',
   17,1.4,3.3,0.2,2.0,0.5,45,'1 plato',60,
   '{"id": "radicheta", "nombre_es": "Radicheta", "categoria": "verdura", "tipo": "generico", "source": "manual", "verified": false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'cebolla_de_verdeo','Cebolla de verdeo','AR',true,false,'draft',
   32,1.8,7.3,0.2,2.6,2.3,16,'2 cdas',30,
   '{"id": "cebolla_de_verdeo", "nombre_es": "Cebolla de verdeo", "categoria": "verdura", "tipo": "generico", "source": "manual", "verified": false}'::jsonb),

-- ── PANIFICADOS (1) ───────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='panificados'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'medialuna','Medialuna','AR',true,false,'draft',
   380,7.0,42.0,20.0,1.5,12.0,320,'1 unidad',40,
   '{"id": "medialuna", "nombre_es": "Medialuna", "categoria": "panificado", "tipo": "generico", "source": "manual", "verified": false}'::jsonb),

-- ── SALSAS / ADEREZOS (2) → categoría grasas ──────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='grasas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'chimichurri','Chimichurri','AR',true,false,'draft',
   260,1.0,4.0,26.0,1.0,0.5,900,'1 cda',15,
   '{"id": "chimichurri", "nombre_es": "Chimichurri", "categoria": "grasa", "tipo": "producto_base", "source": "manual", "verified": false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='grasas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'salsa_golf','Salsa golf','AR',true,false,'draft',
   400,1.0,6.0,40.0,0.0,4.0,500,'1 cda',15,
   '{"id": "salsa_golf", "nombre_es": "Salsa golf", "categoria": "grasa", "tipo": "producto_base", "source": "manual", "verified": false}'::jsonb),

-- ── BEBIDAS (7) ───────────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='bebidas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'cafe_cortado','Café cortado','AR',true,false,'draft',
   20,1.2,1.8,0.9,0.0,1.8,15,'1 pocillo',80,
   '{"id": "cafe_cortado", "nombre_es": "Café cortado", "categoria": "bebida", "tipo": "generico", "source": "manual", "verified": false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='bebidas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'leche_chocolatada','Leche chocolatada','AR',true,false,'draft',
   70,3.0,10.0,1.5,0.3,9.0,50,'1 vaso',200,
   '{"id": "leche_chocolatada", "nombre_es": "Leche chocolatada", "categoria": "bebida", "tipo": "generico", "source": "manual", "verified": false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='bebidas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'fernet_con_coca','Fernet con coca','AR',true,false,'draft',
   90,0.0,9.0,0.0,0.0,9.0,5,'1 vaso',250,
   '{"id": "fernet_con_coca", "nombre_es": "Fernet con coca", "categoria": "bebida", "tipo": "plato", "source": "manual", "verified": false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='bebidas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'vino_blanco','Vino blanco','AR',true,false,'draft',
   82,0.1,2.6,0.0,0.0,1.0,7,'1 copa',150,
   '{"id": "vino_blanco", "nombre_es": "Vino blanco", "categoria": "bebida", "tipo": "generico", "source": "manual", "verified": false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='bebidas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'aperol_spritz','Aperol spritz','AR',true,false,'draft',
   100,0.0,11.0,0.0,0.0,10.0,10,'1 copa',200,
   '{"id": "aperol_spritz", "nombre_es": "Aperol spritz", "categoria": "bebida", "tipo": "plato", "source": "manual", "verified": false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='bebidas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'soda','Soda','AR',true,false,'draft',
   0,0.0,0.0,0.0,0.0,0.0,20,'1 vaso',200,
   '{"id": "soda", "nombre_es": "Soda", "categoria": "bebida", "tipo": "generico", "source": "manual", "verified": false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='bebidas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'agua_saborizada','Agua saborizada','AR',true,false,'draft',
   20,0.0,5.0,0.0,0.0,5.0,10,'1 vaso',200,
   '{"id": "agua_saborizada", "nombre_es": "Agua saborizada", "categoria": "bebida", "tipo": "producto_base", "source": "manual", "verified": false}'::jsonb),

-- ── SNACKS (3) ────────────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='snacks'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'pochoclo','Pochoclo','AR',true,false,'draft',
   387,12.0,78.0,4.5,15.0,0.9,8,'1 taza',15,
   '{"id": "pochoclo", "nombre_es": "Pochoclo", "categoria": "snack", "tipo": "generico", "source": "manual", "verified": false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='snacks'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'chizitos','Chizitos','AR',true,false,'draft',
   540,6.0,55.0,33.0,1.0,3.0,900,'1 paquete',30,
   '{"id": "chizitos", "nombre_es": "Chizitos", "categoria": "snack", "tipo": "producto_base", "source": "manual", "verified": false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='snacks'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'palitos_salados','Palitos salados','AR',true,false,'draft',
   460,10.0,70.0,15.0,3.0,3.0,1400,'1 puñado',25,
   '{"id": "palitos_salados", "nombre_es": "Palitos salados", "categoria": "snack", "tipo": "producto_base", "source": "manual", "verified": false}'::jsonb),

-- ── DULCES (2) ────────────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='dulces'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'obleas','Obleas','AR',true,false,'draft',
   480,5.0,65.0,22.0,1.5,40.0,150,'1 unidad',20,
   '{"id": "obleas", "nombre_es": "Obleas", "categoria": "dulce", "tipo": "producto_base", "source": "manual", "verified": false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='dulces'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'conitos','Conitos','AR',true,false,'draft',
   420,5.0,60.0,18.0,1.5,45.0,180,'1 unidad',25,
   '{"id": "conitos", "nombre_es": "Conitos", "categoria": "dulce", "tipo": "producto_base", "source": "manual", "verified": false}'::jsonb),

-- ── ACHURAS (1) → categoría proteínas ─────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='manual'),
   'chinchulines','Chinchulines','AR',true,false,'draft',
   250,15.0,0.0,20.0,0.0,0.0,80,'1 porción',150,
   '{"id": "chinchulines", "nombre_es": "Chinchulines", "categoria": "achura", "tipo": "generico", "source": "manual", "verified": false}'::jsonb)

ON CONFLICT (source_id, source_food_id) DO NOTHING;
