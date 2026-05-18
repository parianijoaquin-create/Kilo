-- ─── foods_100_seed.sql ───────────────────────────────────────────────────────
-- Seed de 100 alimentos genéricos argentinos provenientes de
-- Informacion/alimentos_100_kilo.json (fuente SARA2/seed).
-- Ejecutar DESPUÉS de schema.sql y seeds.sql.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Fuente de datos ──────────────────────────────────────────────────────────
INSERT INTO public.food_sources (code, name, source_type, license_name, priority)
VALUES ('sara2', 'SARA2/seed (Kilo base)', 'official', 'Datos propios curados', 15)
ON CONFLICT (code) DO NOTHING;

-- ─── Categorías faltantes ─────────────────────────────────────────────────────
-- Categorías del JSON no cubiertas por seeds.sql existente.
-- Mapeo: queso→lacteos, huevo→proteinas, fiambre→proteinas,
--        aceite→grasas, grasa→grasas, semilla→frutos-secos,
--        comida tipica→comidas-argentinas
INSERT INTO public.food_categories (slug, name, sort_order) VALUES
  ('cereales',     'Cereales y granos',  10),
  ('panificados',  'Panificados',        11),
  ('pescados',     'Pescados',           12),
  ('frutos-secos', 'Frutos secos',       13),
  ('dulces',       'Dulces',             14),
  ('snacks',       'Snacks',             15),
  ('bebidas',      'Bebidas',            16)
ON CONFLICT (slug) DO NOTHING;

-- ─── 100 alimentos ────────────────────────────────────────────────────────────
INSERT INTO public.foods (
  category_id, source_id, source_food_id, canonical_name,
  is_generic, is_verified, verification_status,
  kcal_100g, protein_g_100g, carbs_g_100g, fat_g_100g,
  fiber_g_100g, sugar_g_100g, sodium_mg_100g,
  default_portion_name, default_portion_g,
  raw_payload
) VALUES

-- ── FRUTAS (10) ───────────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='frutas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'banana','Banana',true,true,'verified',
   92,1.2,20.4,0.2,2.6,12.2,1,'1 porción',100,
   '{"id":"banana","nombre_es":"Banana","categoria":"fruta","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='frutas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'manzana_con_piel','Manzana con piel',true,true,'verified',
   48,0.3,11.4,0.2,2.4,10.4,1,'1 porción',100,
   '{"id":"manzana_con_piel","nombre_es":"Manzana con piel","categoria":"fruta","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='frutas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'naranja','Naranja',true,true,'verified',
   43,0.9,9.3,0.1,2.4,9.3,0,'1 porción',100,
   '{"id":"naranja","nombre_es":"Naranja","categoria":"fruta","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='frutas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'mandarina','Mandarina',true,true,'verified',
   52,0.8,11.5,0.3,1.8,10.6,2,'1 porción',100,
   '{"id":"mandarina","nombre_es":"Mandarina","categoria":"fruta","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='frutas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'pera','Pera',true,true,'verified',
   55,0.7,12.1,0.4,3.1,9.8,2,'1 porción',100,
   '{"id":"pera","nombre_es":"Pera","categoria":"fruta","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='frutas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'frutilla','Frutilla',true,true,'verified',
   31,0.8,5.7,0.6,2.0,4.9,2,'1 porción',100,
   '{"id":"frutilla","nombre_es":"Frutilla","categoria":"fruta","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='frutas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'durazno','Durazno',true,true,'verified',
   45,0.5,10.5,0.1,1.5,8.4,3,'1 porción',100,
   '{"id":"durazno","nombre_es":"Durazno","categoria":"fruta","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='frutas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'kiwi','Kiwi',true,true,'verified',
   56,1.1,11.7,0.5,3.0,9.0,3,'1 porción',100,
   '{"id":"kiwi","nombre_es":"Kiwi","categoria":"fruta","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='frutas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'anana','Ananá',true,true,'verified',
   50,0.4,11.7,0.2,1.4,9.9,2,'1 porción',100,
   '{"id":"anana","nombre_es":"Ananá","categoria":"fruta","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='frutas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'palta','Palta',true,true,'verified',
   190,1.9,1.8,19.5,6.7,0.7,7,'1 porción',100,
   '{"id":"palta","nombre_es":"Palta","categoria":"fruta","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

-- ── VERDURAS (10) ─────────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'tomate','Tomate',true,true,'verified',
   17,1.0,2.9,0.2,1.2,2.6,5,'1 porción',100,
   '{"id":"tomate","nombre_es":"Tomate","categoria":"verdura","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'lechuga','Lechuga',true,true,'verified',
   12,1.2,1.4,0.2,1.4,1.2,13,'1 porción',100,
   '{"id":"lechuga","nombre_es":"Lechuga","categoria":"verdura","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'cebolla','Cebolla',true,true,'verified',
   36,1.1,7.6,0.1,1.7,4.2,4,'1 porción',100,
   '{"id":"cebolla","nombre_es":"Cebolla","categoria":"verdura","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'zanahoria','Zanahoria',true,true,'verified',
   43,1.1,9.2,0.2,2.8,4.7,22,'1 porción',100,
   '{"id":"zanahoria","nombre_es":"Zanahoria","categoria":"verdura","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'zapallo','Zapallo',true,true,'verified',
   28,1.0,5.7,0.1,1.1,2.8,1,'1 porción',100,
   '{"id":"zapallo","nombre_es":"Zapallo","categoria":"verdura","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'papa_hervida','Papa hervida',true,true,'verified',
   86,1.9,19.8,0.1,1.8,0.8,5,'1 porción',100,
   '{"id":"papa_hervida","nombre_es":"Papa hervida","categoria":"verdura","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'batata_hervida','Batata hervida',true,true,'verified',
   76,1.4,17.7,0.1,2.5,5.7,27,'1 porción',100,
   '{"id":"batata_hervida","nombre_es":"Batata hervida","categoria":"verdura","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'brocoli_hervido','Brócoli hervido',true,true,'verified',
   35,2.4,4.4,0.4,3.3,1.4,41,'1 porción',100,
   '{"id":"brocoli_hervido","nombre_es":"Brócoli hervido","categoria":"verdura","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'espinaca','Espinaca',true,true,'verified',
   23,2.9,1.6,0.4,2.2,0.4,79,'1 porción',100,
   '{"id":"espinaca","nombre_es":"Espinaca","categoria":"verdura","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='verduras'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'morrón_rojo','Morrón rojo',true,true,'verified',
   31,1.0,6.0,0.3,2.1,4.2,4,'1 porción',100,
   '{"id":"morrón_rojo","nombre_es":"Morrón rojo","categoria":"verdura","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

-- ── CEREALES (6) ──────────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='cereales'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'avena_arrollada_cruda','Avena arrollada cruda',true,true,'verified',
   357,15.6,56.9,7.5,10.4,0.7,0,'1 porción',100,
   '{"id":"avena_arrollada_cruda","nombre_es":"Avena arrollada cruda","categoria":"cereal","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='cereales'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'arroz_blanco_hervido','Arroz blanco hervido',true,true,'verified',
   126,2.4,28.6,0.2,0.4,0.1,1,'1 porción',100,
   '{"id":"arroz_blanco_hervido","nombre_es":"Arroz blanco hervido","categoria":"cereal","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='cereales'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'arroz_integral_hervido','Arroz integral hervido',true,true,'verified',
   112,2.3,23.5,0.8,1.8,0.4,5,'1 porción',100,
   '{"id":"arroz_integral_hervido","nombre_es":"Arroz integral hervido","categoria":"cereal","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='cereales'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'fideos_hervidos','Fideos hervidos',true,true,'verified',
   151,5.2,30.9,0.9,1.8,0.6,1,'1 porción',100,
   '{"id":"fideos_hervidos","nombre_es":"Fideos hervidos","categoria":"cereal","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='cereales'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'granola','Granola',false,false,'draft',
   430,10.0,64.0,14.0,7.0,20.0,120,'1 porción',100,
   '{"id":"granola","nombre_es":"Granola","categoria":"cereal","tipo":"producto_base","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='cereales'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'harina_de_trigo','Harina de trigo',true,true,'verified',
   364,10.3,76.3,1.0,2.7,0.3,2,'1 porción',100,
   '{"id":"harina_de_trigo","nombre_es":"Harina de trigo","categoria":"cereal","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

-- ── PANIFICADOS (5) ───────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='panificados'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'pan_frances','Pan francés',true,true,'verified',
   270,8.4,56.4,1.6,2.7,2.0,550,'1 porción',100,
   '{"id":"pan_frances","nombre_es":"Pan francés","categoria":"panificado","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='panificados'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'pan_integral','Pan integral',true,true,'verified',
   250,9.0,45.0,3.5,7.0,4.0,520,'1 porción',100,
   '{"id":"pan_integral","nombre_es":"Pan integral","categoria":"panificado","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='panificados'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'galletitas_de_agua','Galletitas de agua',false,false,'draft',
   420,10.0,72.0,10.0,3.0,5.0,700,'1 porción',100,
   '{"id":"galletitas_de_agua","nombre_es":"Galletitas de agua","categoria":"panificado","tipo":"producto_base","source":"SARA2/seed","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='panificados'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'galletitas_dulces','Galletitas dulces simples',false,false,'draft',
   450,6.0,70.0,16.0,2.5,25.0,350,'1 porción',100,
   '{"id":"galletitas_dulces","nombre_es":"Galletitas dulces simples","categoria":"panificado","tipo":"producto_base","source":"SARA2/seed","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='panificados'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'medialuna','Medialuna',false,false,'draft',
   395,8.2,43.2,21.0,2.6,11.3,384,'1 porción',100,
   '{"id":"medialuna","nombre_es":"Medialuna","categoria":"panificado dulce","tipo":"comida_argentina","source":"SARA2/proxy","verified":false}'::jsonb),

-- ── LEGUMBRES (5) ─────────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='legumbres'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'lentejas_hervidas','Lentejas hervidas',true,true,'verified',
   116,9.0,20.1,0.4,7.9,1.8,2,'1 porción',100,
   '{"id":"lentejas_hervidas","nombre_es":"Lentejas hervidas","categoria":"legumbre","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='legumbres'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'garbanzos_hervidos','Garbanzos hervidos',true,true,'verified',
   164,8.9,27.4,2.6,7.6,4.8,7,'1 porción',100,
   '{"id":"garbanzos_hervidos","nombre_es":"Garbanzos hervidos","categoria":"legumbre","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='legumbres'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'porotos_hervidos','Porotos hervidos',true,true,'verified',
   127,8.7,22.8,0.5,6.4,0.3,1,'1 porción',100,
   '{"id":"porotos_hervidos","nombre_es":"Porotos hervidos","categoria":"legumbre","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='legumbres'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'arvejas_hervidas','Arvejas hervidas',true,true,'verified',
   84,5.4,15.6,0.4,5.5,5.9,3,'1 porción',100,
   '{"id":"arvejas_hervidas","nombre_es":"Arvejas hervidas","categoria":"legumbre","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='legumbres'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'soja_hervida','Soja hervida',true,false,'draft',
   173,16.6,9.9,9.0,6.0,3.0,1,'1 porción',100,
   '{"id":"soja_hervida","nombre_es":"Soja hervida","categoria":"legumbre","tipo":"generico","source":"SARA2/seed","verified":false}'::jsonb),

-- ── LÁCTEOS (6) ───────────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='lacteos'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'leche_entera_fluida_fortificada','Leche entera fluida fortificada',true,true,'verified',
   57,3.2,4.6,2.9,0.0,4.6,57,'1 porción',100,
   '{"id":"leche_entera_fluida_fortificada","nombre_es":"Leche entera fluida fortificada","categoria":"lacteo","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='lacteos'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'leche_descremada','Leche descremada',true,true,'verified',
   35,3.4,5.0,0.1,0.0,5.0,52,'1 porción',100,
   '{"id":"leche_descremada","nombre_es":"Leche descremada","categoria":"lacteo","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='lacteos'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'yogur_natural_entero','Yogur natural entero',true,true,'verified',
   61,3.5,4.7,3.3,0.0,4.7,46,'1 porción',100,
   '{"id":"yogur_natural_entero","nombre_es":"Yogur natural entero","categoria":"lacteo","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='lacteos'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'yogur_descremado','Yogur descremado',true,true,'verified',
   45,4.0,6.0,0.2,0.0,6.0,55,'1 porción',100,
   '{"id":"yogur_descremado","nombre_es":"Yogur descremado","categoria":"lacteo","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='lacteos'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'yogur_proteico','Yogur proteico',false,false,'draft',
   75,10.0,6.0,1.0,0.0,4.0,60,'1 porción',100,
   '{"id":"yogur_proteico","nombre_es":"Yogur proteico","categoria":"lacteo","tipo":"producto_base","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='lacteos'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'ricota','Ricota',true,false,'draft',
   174,11.3,3.0,13.0,0.0,0.3,84,'1 porción',100,
   '{"id":"ricota","nombre_es":"Ricota","categoria":"lacteo","tipo":"generico","source":"SARA2/seed","verified":false}'::jsonb),

-- ── QUESOS → lacteos (4) ──────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='lacteos'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'queso_cremoso','Queso cremoso',true,false,'draft',
   290,18.0,2.0,23.0,0.0,1.0,650,'1 porción',100,
   '{"id":"queso_cremoso","nombre_es":"Queso cremoso","categoria":"queso","tipo":"generico","source":"SARA2/seed","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='lacteos'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'queso_port_salut','Queso port salut',true,false,'draft',
   280,20.0,2.0,21.0,0.0,1.0,620,'1 porción',100,
   '{"id":"queso_port_salut","nombre_es":"Queso port salut","categoria":"queso","tipo":"generico","source":"SARA2/seed","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='lacteos'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'queso_muzzarella','Queso muzzarella',true,true,'verified',
   300,23.6,2.2,22.0,0.0,1.0,630,'1 porción',100,
   '{"id":"queso_muzzarella","nombre_es":"Queso muzzarella","categoria":"queso","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='lacteos'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'queso_rallado','Queso rallado tipo parmesano',true,false,'draft',
   430,38.0,4.0,29.0,0.0,0.9,1500,'1 porción',100,
   '{"id":"queso_rallado","nombre_es":"Queso rallado tipo parmesano","categoria":"queso","tipo":"generico","source":"SARA2/seed","verified":false}'::jsonb),

-- ── HUEVOS → proteinas (3) ────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'huevo_entero','Huevo entero',true,true,'verified',
   156,12.0,0.4,11.8,0.0,0.4,135,'1 unidad',60,
   '{"id":"huevo_entero","nombre_es":"Huevo entero","categoria":"huevo","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'clara_de_huevo','Clara de huevo',true,true,'verified',
   52,10.9,0.7,0.2,0.0,0.7,166,'1 porción',100,
   '{"id":"clara_de_huevo","nombre_es":"Clara de huevo","categoria":"huevo","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'yema_de_huevo','Yema de huevo',true,false,'draft',
   322,15.9,3.6,26.5,0.0,0.6,48,'1 porción',100,
   '{"id":"yema_de_huevo","nombre_es":"Yema de huevo","categoria":"huevo","tipo":"generico","source":"SARA2/seed","verified":false}'::jsonb),

-- ── PROTEÍNAS ANIMALES (5) ────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'pechuga_de_pollo','Pechuga de pollo',true,true,'verified',
   114,22.5,0.0,2.6,0.0,0.0,45,'1 porción',100,
   '{"id":"pechuga_de_pollo","nombre_es":"Pechuga de pollo","categoria":"proteina animal","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'pollo_sin_piel_parrilla','Pollo sin piel a la parrilla',true,true,'verified',
   165,25.0,0.0,7.0,0.0,0.0,70,'1 porción',100,
   '{"id":"pollo_sin_piel_parrilla","nombre_es":"Pollo sin piel a la parrilla","categoria":"proteina animal","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'carne_vacuna_magra_parrilla','Carne vacuna magra a la parrilla',true,true,'verified',
   198,29.5,0.0,8.9,0.0,0.0,63,'1 porción',100,
   '{"id":"carne_vacuna_magra_parrilla","nombre_es":"Carne vacuna magra a la parrilla","categoria":"proteina animal","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'carne_vacuna_semigrasa_parrilla','Carne vacuna semigrasa a la parrilla',true,true,'verified',
   225,28.2,0.0,12.5,0.0,0.0,62,'1 porción',100,
   '{"id":"carne_vacuna_semigrasa_parrilla","nombre_es":"Carne vacuna semigrasa a la parrilla","categoria":"proteina animal","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'carne_picada_comun','Carne picada común',true,false,'draft',
   254,17.2,0.0,20.0,0.0,0.0,72,'1 porción',100,
   '{"id":"carne_picada_comun","nombre_es":"Carne picada común","categoria":"proteina animal","tipo":"generico","source":"SARA2/seed","verified":false}'::jsonb),

-- ── FIAMBRES → proteinas (2) ──────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'jamon_cocido','Jamón cocido',false,false,'draft',
   145,20.0,1.5,6.5,0.0,1.0,1100,'1 porción',100,
   '{"id":"jamon_cocido","nombre_es":"Jamón cocido","categoria":"fiambre","tipo":"producto_base","source":"SARA2/seed","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='proteinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'chorizo_parrilla','Chorizo a la parrilla',true,false,'draft',
   455,18.0,1.0,42.0,0.0,0.2,950,'1 porción',100,
   '{"id":"chorizo_parrilla","nombre_es":"Chorizo a la parrilla","categoria":"fiambre","tipo":"generico","source":"SARA2/seed","verified":false}'::jsonb),

-- ── PESCADOS (5) ──────────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='pescados'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'atun_en_agua','Atún al natural',false,false,'draft',
   116,25.5,0.0,1.0,0.0,0.0,300,'1 lata (escurrida)',100,
   '{"id":"atun_en_agua","nombre_es":"Atún al natural","categoria":"pescado","tipo":"producto_base","source":"SARA2/seed","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='pescados'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'atun_en_aceite','Atún en aceite',false,true,'verified',
   198,29.1,0.0,8.2,0.0,0.0,360,'1 lata (escurrida)',100,
   '{"id":"atun_en_aceite","nombre_es":"Atún en aceite","categoria":"pescado","tipo":"producto_base","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='pescados'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'merluza_filet','Filet de merluza',true,false,'draft',
   85,18.0,0.0,1.5,0.0,0.0,90,'1 porción',100,
   '{"id":"merluza_filet","nombre_es":"Filet de merluza","categoria":"pescado","tipo":"generico","source":"SARA2/seed","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='pescados'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'salmon','Salmón',true,false,'draft',
   208,20.4,0.0,13.4,0.0,0.0,59,'1 porción',100,
   '{"id":"salmon","nombre_es":"Salmón","categoria":"pescado","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='pescados'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'sardinas_en_aceite','Sardinas en aceite',false,false,'draft',
   208,24.6,0.0,11.5,0.0,0.0,505,'1 lata (escurrida)',100,
   '{"id":"sardinas_en_aceite","nombre_es":"Sardinas en aceite","categoria":"pescado","tipo":"producto_base","source":"SARA2/seed","verified":false}'::jsonb),

-- ── GRASAS Y ACEITES (3) ──────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='grasas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'aceite_de_oliva','Aceite de oliva',true,true,'verified',
   900,0.0,0.0,100.0,0.0,0.0,0,'1 cda',14,
   '{"id":"aceite_de_oliva","nombre_es":"Aceite de oliva","categoria":"aceite","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='grasas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'aceite_de_girasol','Aceite de girasol',true,true,'verified',
   900,0.0,0.0,100.0,0.0,0.0,0,'1 cda',14,
   '{"id":"aceite_de_girasol","nombre_es":"Aceite de girasol","categoria":"aceite","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='grasas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'manteca','Manteca',true,false,'draft',
   717,0.9,0.1,81.1,0.0,0.1,11,'1 cda',14,
   '{"id":"manteca","nombre_es":"Manteca","categoria":"grasa","tipo":"generico","source":"SARA2/seed","verified":false}'::jsonb),

-- ── FRUTOS SECOS Y SEMILLAS (7) ───────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='frutos-secos'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'mani_tostado_sin_sal','Maní tostado sin sal',true,true,'verified',
   596,24.4,21.5,49.7,8.4,4.2,18,'Puñado',28,
   '{"id":"mani_tostado_sin_sal","nombre_es":"Maní tostado sin sal","categoria":"fruto seco","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='frutos-secos'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'mantequilla_de_mani','Mantequilla de maní',false,true,'verified',
   607,21.9,22.3,51.0,6.0,9.0,450,'2 cdas',32,
   '{"id":"mantequilla_de_mani","nombre_es":"Mantequilla de maní","categoria":"fruto seco","tipo":"producto_base","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='frutos-secos'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'almendra','Almendra',true,true,'verified',
   570,21.0,21.6,49.9,12.5,4.4,1,'Puñado',28,
   '{"id":"almendra","nombre_es":"Almendra","categoria":"fruto seco","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='frutos-secos'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'nuez','Nuez',true,true,'verified',
   690,14.0,13.7,68.0,6.7,2.6,2,'Puñado',28,
   '{"id":"nuez","nombre_es":"Nuez","categoria":"fruto seco","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='frutos-secos'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'castanas_de_caju','Castañas de cajú',true,false,'draft',
   553,18.2,30.2,43.9,3.3,5.9,12,'Puñado',28,
   '{"id":"castanas_de_caju","nombre_es":"Castañas de cajú","categoria":"fruto seco","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='frutos-secos'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'semilla_de_chia','Semilla de chía',true,false,'draft',
   486,16.5,42.1,30.7,34.4,0.0,16,'1 cda',15,
   '{"id":"semilla_de_chia","nombre_es":"Semilla de chía","categoria":"semilla","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='frutos-secos'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'semilla_de_zapallo','Semilla de zapallo',true,true,'verified',
   581,30.2,10.7,49.0,6.0,1.4,7,'1 cda',15,
   '{"id":"semilla_de_zapallo","nombre_es":"Semilla de zapallo","categoria":"semilla","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

-- ── COMIDAS TÍPICAS (12) ──────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'milanesa_de_carne_vacuna','Milanesa de carne vacuna',true,true,'verified',
   160,18.9,14.5,3.0,1.0,1.4,212,'1 porción',100,
   '{"id":"milanesa_de_carne_vacuna","nombre_es":"Milanesa de carne vacuna","categoria":"comida tipica","tipo":"comida_argentina","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'milanesa_de_pollo','Milanesa de pollo',true,true,'verified',
   172,19.8,14.5,3.9,1.0,1.4,199,'1 porción',100,
   '{"id":"milanesa_de_pollo","nombre_es":"Milanesa de pollo","categoria":"comida tipica","tipo":"comida_argentina","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'asado','Asado',true,false,'draft',
   240,26.1,0.0,15.1,0.0,0.0,51,'1 porción',100,
   '{"id":"asado","nombre_es":"Asado","categoria":"comida tipica","tipo":"comida_argentina","source":"SARA2/proxy","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'choripan','Choripán',false,false,'draft',
   350,14.6,25.9,20.9,1.1,0.1,651,'1 porción',100,
   '{"id":"choripan","nombre_es":"Choripán","categoria":"comida tipica","tipo":"comida_argentina","source":"recipe_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'empanada_de_carne','Empanada de carne',false,false,'draft',
   253,15.0,22.2,11.6,0.9,0.5,284,'1 unidad',100,
   '{"id":"empanada_de_carne","nombre_es":"Empanada de carne","categoria":"comida tipica","tipo":"comida_argentina","source":"recipe_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'empanada_de_pollo','Empanada de pollo',false,false,'draft',
   220,13.2,22.4,8.7,1.0,0.7,283,'1 unidad',100,
   '{"id":"empanada_de_pollo","nombre_es":"Empanada de pollo","categoria":"comida tipica","tipo":"comida_argentina","source":"recipe_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'locro','Locro',false,false,'draft',
   163,10.9,10.8,8.5,2.3,1.4,175,'1 plato',300,
   '{"id":"locro","nombre_es":"Locro","categoria":"comida tipica","tipo":"comida_argentina","source":"recipe_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'pastel_de_papa','Pastel de papa',false,false,'draft',
   161,9.5,10.8,8.8,1.2,0.9,22,'1 porción',100,
   '{"id":"pastel_de_papa","nombre_es":"Pastel de papa","categoria":"comida tipica","tipo":"comida_argentina","source":"recipe_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'tarta_jamon_y_queso','Tarta de jamón y queso',false,false,'draft',
   285,12.0,22.0,17.0,1.0,1.5,520,'1 porción',100,
   '{"id":"tarta_jamon_y_queso","nombre_es":"Tarta de jamón y queso","categoria":"comida tipica","tipo":"comida_argentina","source":"recipe_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'tarta_de_verdura','Tarta de verdura',false,false,'draft',
   210,8.0,18.0,11.0,2.0,2.0,380,'1 porción',100,
   '{"id":"tarta_de_verdura","nombre_es":"Tarta de verdura","categoria":"comida tipica","tipo":"comida_argentina","source":"recipe_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'guiso_de_lentejas','Guiso de lentejas',false,false,'draft',
   142,8.5,17.0,4.0,5.0,2.0,220,'1 plato',300,
   '{"id":"guiso_de_lentejas","nombre_es":"Guiso de lentejas","categoria":"comida tipica","tipo":"comida_argentina","source":"recipe_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='comidas-argentinas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'tortilla_de_papa','Tortilla de papa',false,false,'draft',
   185,6.5,17.0,10.0,1.4,1.0,210,'1 porción',100,
   '{"id":"tortilla_de_papa","nombre_es":"Tortilla de papa","categoria":"comida tipica","tipo":"comida_argentina","source":"recipe_estimate","verified":false}'::jsonb),

-- ── DULCES (5) ────────────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='dulces'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'alfajor_de_dulce_de_leche','Alfajor de dulce de leche',false,true,'verified',
   420,6.0,65.0,15.0,2.0,45.0,180,'1 unidad',100,
   '{"id":"alfajor_de_dulce_de_leche","nombre_es":"Alfajor de dulce de leche","categoria":"dulce","tipo":"producto_base","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='dulces'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'dulce_de_leche','Dulce de leche',false,false,'draft',
   315,7.0,55.0,7.0,0.0,50.0,130,'1 cda',20,
   '{"id":"dulce_de_leche","nombre_es":"Dulce de leche","categoria":"dulce","tipo":"producto_base","source":"SARA2/seed","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='dulces'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'miel','Miel',true,false,'draft',
   304,0.3,82.4,0.0,0.2,82.1,4,'1 cda',21,
   '{"id":"miel","nombre_es":"Miel","categoria":"dulce","tipo":"generico","source":"SARA2/seed","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='dulces'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'azucar','Azúcar',true,true,'verified',
   387,0.0,100.0,0.0,0.0,100.0,1,'1 cdita',5,
   '{"id":"azucar","nombre_es":"Azúcar","categoria":"dulce","tipo":"generico","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='dulces'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'chocolate_con_leche','Chocolate con leche',false,false,'draft',
   535,7.7,59.4,29.7,3.4,51.0,79,'1 porción',30,
   '{"id":"chocolate_con_leche","nombre_es":"Chocolate con leche","categoria":"dulce","tipo":"producto_base","source":"seed_estimate","verified":false}'::jsonb),

-- ── SNACKS (2) ────────────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='snacks'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'papas_fritas_copetin','Papas fritas de copetín',false,true,'verified',
   534,6.5,53.0,34.0,4.0,0.5,520,'1 porción',30,
   '{"id":"papas_fritas_copetin","nombre_es":"Papas fritas de copetín","categoria":"snack","tipo":"producto_base","source":"SARA2/seed","verified":true}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='snacks'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'bizcochitos_de_grasa','Bizcochitos de grasa envasados',false,true,'verified',
   499,8.0,60.0,25.0,2.0,4.0,950,'1 porción',30,
   '{"id":"bizcochitos_de_grasa","nombre_es":"Bizcochitos de grasa envasados","categoria":"snack","tipo":"producto_base","source":"SARA2/seed","verified":true}'::jsonb),

-- ── BEBIDAS (7) ───────────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='bebidas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'gaseosa_comun','Gaseosa común',false,false,'draft',
   42,0.0,10.6,0.0,0.0,10.6,5,'1 vaso',250,
   '{"id":"gaseosa_comun","nombre_es":"Gaseosa común","categoria":"bebida","tipo":"producto_base","source":"SARA2/seed","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='bebidas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'gaseosa_light','Gaseosa light/sin azúcar',false,false,'draft',
   1,0.0,0.1,0.0,0.0,0.0,15,'1 vaso',250,
   '{"id":"gaseosa_light","nombre_es":"Gaseosa light/sin azúcar","categoria":"bebida","tipo":"producto_base","source":"SARA2/seed","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='bebidas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'jugo_de_naranja','Jugo de naranja',true,false,'draft',
   45,0.7,10.4,0.2,0.2,8.4,1,'1 vaso',250,
   '{"id":"jugo_de_naranja","nombre_es":"Jugo de naranja","categoria":"bebida","tipo":"generico","source":"SARA2/seed","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='bebidas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'cerveza','Cerveza',false,false,'draft',
   43,0.5,3.6,0.0,0.0,0.0,4,'1 lata',355,
   '{"id":"cerveza","nombre_es":"Cerveza","categoria":"bebida","tipo":"producto_base","source":"SARA2/seed","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='bebidas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'vino_tinto','Vino tinto',false,false,'draft',
   85,0.1,2.6,0.0,0.0,0.6,4,'1 copa',150,
   '{"id":"vino_tinto","nombre_es":"Vino tinto","categoria":"bebida","tipo":"producto_base","source":"SARA2/seed","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='bebidas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'mate_cocido_sin_azucar','Mate cocido sin azúcar',true,false,'draft',
   1,0.0,0.1,0.0,0.0,0.0,1,'1 taza',200,
   '{"id":"mate_cocido_sin_azucar","nombre_es":"Mate cocido sin azúcar","categoria":"bebida","tipo":"generico","source":"seed_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='bebidas'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'bebida_isotonica','Bebida isotónica',false,false,'draft',
   24,0.0,6.0,0.0,0.0,6.0,45,'1 botella',500,
   '{"id":"bebida_isotonica","nombre_es":"Bebida isotónica","categoria":"bebida","tipo":"producto_base","source":"label_average_estimate","verified":false}'::jsonb),

-- ── SUPLEMENTOS (3) ───────────────────────────────────────────────────────────
  ((SELECT id FROM public.food_categories WHERE slug='suplementos'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'proteina_whey_polvo','Proteína whey en polvo',false,false,'draft',
   390,78.0,8.0,6.0,0.0,5.0,350,'1 medida',30,
   '{"id":"proteina_whey_polvo","nombre_es":"Proteína whey en polvo","categoria":"suplemento","tipo":"suplemento","source":"label_average_estimate","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='suplementos'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'creatina_monohidratada','Creatina monohidratada',false,false,'draft',
   0,0.0,0.0,0.0,0.0,0.0,0,'1 medida',5,
   '{"id":"creatina_monohidratada","nombre_es":"Creatina monohidratada","categoria":"suplemento","tipo":"suplemento","source":"supplement_standard","verified":false}'::jsonb),

  ((SELECT id FROM public.food_categories WHERE slug='suplementos'),
   (SELECT id FROM public.food_sources WHERE code='sara2'),
   'barra_proteica_promedio','Barra proteica promedio',false,false,'draft',
   360,30.0,35.0,12.0,8.0,10.0,280,'1 barra',60,
   '{"id":"barra_proteica_promedio","nombre_es":"Barra proteica promedio","categoria":"suplemento","tipo":"producto_base","source":"label_average_estimate","verified":false}'::jsonb)

ON CONFLICT (source_id, source_food_id) DO NOTHING;
