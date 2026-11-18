SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict sQweVaCyEUEeKXkhvwfjedavau0vpkMqfOISOvUhYI87QL9v40APhXZ5TE5Cbyj

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at", "invite_token", "referrer", "oauth_client_state_id", "linking_target_id", "email_optional") VALUES
	('1dffe261-dc7d-4b17-9989-3e56a643a7ec', 'e5286368-33cd-453c-b5b9-db6a062458d6', 'c1e76fe4-aa4f-4e4e-b2ce-8e1b102d8d7d', 's256', 'KTEqjp664-7Nfr1-tyAK2LvGsEtkzVFMZPdtPbKFYW4', 'email', '', '', '2026-08-26 13:17:03.73397+00', '2026-08-26 13:19:09.857808+00', 'email/signup', '2026-08-26 13:19:09.857742+00', NULL, NULL, NULL, NULL, false);


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'e5286368-33cd-453c-b5b9-db6a062458d6', 'authenticated', 'authenticated', 'mxnuel244@gmail.com', '$2a$10$Ais7fK8jJpJNPIQb.zrDFeFfaRv3JrerCsFz0.xrDxbGi0WZFcQnO', '2026-08-26 13:19:09.845554+00', NULL, '', '2026-08-26 13:17:03.742937+00', '', NULL, '', '', NULL, '2026-09-09 11:54:24.814357+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "e5286368-33cd-453c-b5b9-db6a062458d6", "email": "mxnuel244@gmail.com", "full_name": "manuel esteban", "email_verified": true, "phone_verified": false}', NULL, '2026-08-26 13:17:03.703041+00', '2026-09-09 11:54:24.856634+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('e5286368-33cd-453c-b5b9-db6a062458d6', 'e5286368-33cd-453c-b5b9-db6a062458d6', '{"sub": "e5286368-33cd-453c-b5b9-db6a062458d6", "email": "mxnuel244@gmail.com", "full_name": "manuel esteban", "email_verified": true, "phone_verified": false}', 'email', '2026-08-26 13:17:03.724108+00', '2026-08-26 13:17:03.72417+00', '2026-08-26 13:17:03.72417+00', 'd60ba737-2b0d-4092-a775-9f55ffbf21b0');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('afa72453-b003-4271-badb-f2771539d2ac', 'e5286368-33cd-453c-b5b9-db6a062458d6', '2026-08-26 13:20:05.553398+00', '2026-08-26 13:20:05.553398+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '186.154.100.216', NULL, NULL, NULL, NULL, NULL),
	('26e796ff-41e0-447f-8347-0acc335b4652', 'e5286368-33cd-453c-b5b9-db6a062458d6', '2026-09-09 11:54:24.815114+00', '2026-09-09 11:54:24.815114+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '190.27.157.171', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('afa72453-b003-4271-badb-f2771539d2ac', '2026-08-26 13:20:05.580777+00', '2026-08-26 13:20:05.580777+00', 'password', 'eb2049c6-e5e8-4f74-939e-5a5e133d62b3'),
	('26e796ff-41e0-447f-8347-0acc335b4652', '2026-09-09 11:54:24.865608+00', '2026-09-09 11:54:24.865608+00', 'password', '14e37604-5e30-481d-989f-8f89436cf7e9');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_recovery_code_sets; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_recovery_codes; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 1, 'dq3i323usyjw', 'e5286368-33cd-453c-b5b9-db6a062458d6', false, '2026-08-26 13:20:05.568135+00', '2026-08-26 13:20:05.568135+00', NULL, 'afa72453-b003-4271-badb-f2771539d2ac'),
	('00000000-0000-0000-0000-000000000000', 2, 'v5xe74uqqzfe', 'e5286368-33cd-453c-b5b9-db6a062458d6', false, '2026-09-09 11:54:24.841296+00', '2026-09-09 11:54:24.841296+00', NULL, '26e796ff-41e0-447f-8347-0acc335b4652');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: scim_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: scim_users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."usuarios" ("id_usuario", "nombre", "apellido", "reset_code", "reset_code_expires", "password_hash", "email", "activo", "fecha_registro", "fecha_eliminacion_programada") VALUES
	(1, 'proyecto', 'AhorrApp', NULL, NULL, '$2b$10$id6vmkXyPevsO19TWSCr5.jvzVJjFE5z7aWUCLEFODW0gRr/iMwCe', 'proyectofinanzassena@gmail.com', true, '2026-08-31 20:42:47.876992', NULL),
	(3, 'David', 'Barrera', NULL, NULL, '$2b$10$NL071tNSlTXzpHpPggkVTOE53G3eRe4wmfRdIJE82GWWoEmEYEPce', 'barreramachucadavid@gmail.com', true, '2026-09-01 21:14:28.755791', NULL),
	(6, 'Carlos', 'Mosquera', NULL, NULL, '$2b$10$pyYB.rWpwf5nMBf7IvX6I.IZIumw20AAnbHyc63PyrdLPWfDl6tTG', 'carlos@gmail.com', true, '2026-09-08 12:04:42.196958', NULL),
	(7, 'Carlos', 'Mosquera', NULL, NULL, '$2b$10$amYt1g5QO5c70wUyTamlsejz7hsPdEcO1qn7Wu0QiapZmfFIYkXUG', 'yuber@gmail.com', true, '2026-09-08 12:06:27.293765', NULL),
	(8, 'Saray', 'Herrera', NULL, NULL, '$2b$10$8pgZYuStmPJqxBfiy..czONxJMmHR8iOzHhy9bnUgXmhEQUEuGuzS', 'saray99herrera2467@gmail.com', true, '2026-09-08 12:43:10.991158', NULL),
	(9, '123', '123', NULL, NULL, '$2b$10$Y0HPkPm./1BNa80tMqwAq.4At9hQUqxIqd1y.3KPCSPn3qv4ROuxW', '123@gmail.con', true, '2026-09-08 13:49:14.140566', NULL),
	(10, 'Wagner', 'Wagner', NULL, NULL, '$2b$10$MyLal0a1eiYFJDKpC.8O9exO3djZRGjJ0hLzl3TrOvpeXmASnlTzS', 'stevanwagner1@gmail.com', true, '2026-09-08 13:51:11.736911', NULL),
	(11, 'Laura', 'Marroquín', NULL, NULL, '$2b$10$rd3ew.FduYyJQAU8LNYU7.HnGqJFDBln5rZ1/4DLFcVywtv.vRhyW', 'lauramarro2018@gnail.com', true, '2026-09-08 13:58:49.542301', NULL),
	(12, 'Lqjflwhe', 'Osofjwl', NULL, NULL, '$2b$10$ncqT8DTUidPTXXNADhJ0A.o8AxaFSfNxWS7llBP7gktcZDn24mNBO', 'kajdñqjd@gamdbsl.co', true, '2026-09-08 14:10:04.239797', NULL),
	(13, 'Carlos', 'Pinzon', NULL, NULL, '$2b$10$8dkDxl9w1LtHlPdrchXq..IY6f8sh9T2odb6n7sNBqt8ax.bHUFb6', 'manuel@gmail.com', true, '2026-09-10 12:31:15.915044', NULL),
	(14, 'Sofia', 'Parraga', NULL, NULL, '$2b$10$M8O/gcVtSuSxdtj0ybL3NOa2hjnr6drCFaTH2T1nVeDu68u5awCaC', 'sofi@gmail.com', true, '2026-09-10 12:37:55.198267', NULL),
	(16, 'TestRunner', 'User', NULL, NULL, '$2b$10$yC6n9aUoGbfmpJQca/Gizuws7gkQMecEoiEpYCRJ7.LBW5lISUvzS', 'test_postman_runner@correo.com', true, '2026-09-14 14:21:10.216838', NULL),
	(15, 'Ana', 'Gómez', '$2b$10$U.lbqK15.FwW/bylC7LEXe1PtVWlOmUdAIcddsRlD0EFAr5W2Ntru', '2026-09-14 14:36:48.523', '$2b$10$iVVnPAiyVWs7ulzgdOjIluxbger7ID0zdjCthuvFXQ.8ZiocC3xYK', 'ana@correo.com', true, '2026-09-14 14:11:06.617', NULL),
	(17, 'Usuario', 'Postman', NULL, NULL, '$2b$10$4OmW160PtsdccVKnpzG1UuK4hVo4bJEICXbQfLA6djrQXX9onfUs.', 'barreraprueba@gmail.com', true, '2026-09-16 02:56:01.640735', NULL),
	(18, 'Checho', 'Alvarez', NULL, NULL, '$2b$10$LYKaSbFrl26NsFAZGruvH.k050oqbAHYC1gMDD2P4FgividLqYsoC', 'chechito@gmail.com', true, '2026-09-17 12:26:31.021551', NULL),
	(19, 'Yuber', 'Franco', NULL, NULL, '$2b$10$0h7gTQUh7bHOHKwsZHNzNeuQvdaL6yeRD1kRFaAT15c3rX40ODhkS', 'yuberfranco4@gmail.com', true, '2026-09-18 11:38:11.441547', NULL),
	(20, 'Manuel', 'Barrios', NULL, NULL, '$2b$10$MA3B7WMZ65JorcAnWWBOPujsFHVlxLnSUxgfifuj/0ctiR8i.TpMC', 'manuelestebanguevara.b@gmail.com', true, '2026-09-18 12:02:52.236577', NULL),
	(21, 'manuel', 'guevara', NULL, NULL, '$2b$10$NwgKqVnWHkqUB1PosKM.H.YZ.fcIzFpCTyCMaygnY41vU36teihlS', 'omairabaro@gmail.com', true, '2026-09-22 19:36:21.153034', NULL),
	(5, 'Santiago', 'Castellanos', '$2b$10$I79uzz8HsfEih/JVUyVOq.Qjr04jTxyRXLyi7Y1u457uQ7o8.SRH.', '2026-09-24 18:13:25.822', '$2b$10$B01YkM7mBwJN/MO7/Sh.jOysx8Uq.944ev8OQ4VRkV6/vVdWEi5xS', 'santixzzone@gmail.com', true, '2026-09-08 11:31:41.094582', NULL),
	(4, 'Juan Manuel', 'Medina', '$2b$10$Ei1knb.sK.ldJwEPCa9awOrmtbL4eDrUVlqnVEVWcnHiwGbbj88VC', '2026-09-24 18:20:30.446', '$2b$10$gapTx2CAvclYUOiBEIi5CO3uUSFg2GC9d4/Z79jeUUY58BdU6acrq', 'juanma1608g@gmail.com', true, '2026-09-07 12:30:45.019637', NULL),
	(22, 'Cuenta', 'pruebas', NULL, NULL, '$2b$10$JnF5uQ2TQX75hrZdTKULIebuIo/Xku5j.IPR4r30GBXeSUAsQLeyu', 'Pruebas1@gmail.com', true, '2026-10-06 22:57:57.529825', NULL),
	(23, 'Manuel', 'Manuel', NULL, NULL, '$2b$10$mkjcCFT1U8wMJph9j6eb1OECa4ONF6H2XBTObR8zP1edevBgpeysy', 'mxnuel244@gmail.com', true, '2026-10-13 00:31:56.947373', NULL),
	(2, 'Santiago', 'Hurtado', NULL, NULL, '$2b$10$lMr4m1aZdwNcIo4QB4LxvuSCsA9UB9AIRyGjh.GKrsZFGvlUzUAkG', 'santiagohurhur@gmail.com', true, '2026-08-31 21:25:50.48713', NULL);


--
-- Data for Name: categorias; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."categorias" ("id_categoria", "id_usuario", "nombre", "descripcion", "activa", "sistema", "es_global") VALUES
	(1, NULL, 'Alimentación', 'Gastos en comida y bebida', true, true, true),
	(2, NULL, 'Transporte', 'Movilidad y combustible', true, true, true),
	(3, NULL, 'Salud', 'Médicos, medicamentos y bienestar', true, true, true),
	(4, NULL, 'Educación', 'Colegiaturas, libros y cursos', true, true, true),
	(5, NULL, 'Entretenimiento', 'Ocio, streaming y salidas', true, true, true),
	(6, NULL, 'Servicios', 'Agua, luz, internet y gas', true, true, true),
	(7, NULL, 'Vivienda', 'Alquiler, hipoteca y mantenimiento', true, true, true),
	(8, NULL, 'Salario', 'Pago mensual o quincenal por parte de alguna entidad', true, true, true),
	(9, NULL, 'Negocio', 'Ingresos provenientes de un negocio propio', true, true, true),
	(10, 4, 'Mascotas', 'Gastos relacionados con el cuidado de mascotas', true, false, false),
	(11, 4, 'Suscripciones', 'Servicios de streaming, software y membresías', true, false, false),
	(12, 4, 'Freelance', 'Ingresos por trabajos independientes', true, false, false),
	(13, 4, 'Regalos', 'Gastos en regalos y celebraciones', true, false, false),
	(14, 4, 'Inversiones', 'Rendimientos de inversiones personales', true, false, false),
	(30, 4, 'Tecnología', 'Compra de dispositivos y accesorios electrónicos', true, false, false),
	(31, 4, 'Viajes', 'Tiquetes, hospedaje y gastos de viaje', true, false, false),
	(33, 4, 'Belleza', 'Cuidado personal y estética', true, false, false),
	(34, 4, 'Hogar', 'Muebles, decoración y mantenimiento del hogar', true, false, false),
	(35, 2, 'holaaaaaaaaaaaaaa', 'ASD', false, false, false),
	(32, 4, 'Deportes', 'Membresías de gimnasio e implementos deportivos', false, false, false),
	(36, 2, 'Mascota', 'Aaron', true, false, false),
	(37, 22, 'RF15 Prueba editada 20261006', 'Categoría temporal para verificar RF-15', true, false, false),
	(38, 3, 'ropa mascota', NULL, false, false, false);


--
-- Data for Name: movimientos; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."movimientos" ("id_movimiento", "id_usuario", "tipo_flujo", "subtipo_modulo") VALUES
	(2, 3, 'Salida', 'Gasto'),
	(3, 3, 'Entrada', 'Ingreso'),
	(4, 3, 'Entrada', 'Ingreso'),
	(5, 3, 'Entrada', 'Ingreso'),
	(6, 3, 'Entrada', 'Ingreso'),
	(7, 3, 'Salida', 'Gasto'),
	(9, 3, 'Salida', 'Gasto'),
	(10, 3, 'Salida', 'Gasto'),
	(13, 3, 'Salida', 'Imprevisto'),
	(16, 3, 'Entrada', 'Ahorro'),
	(17, 3, 'Entrada', 'Ahorro'),
	(18, 3, 'Salida', 'Deuda'),
	(19, 7, 'Entrada', 'Ingreso'),
	(20, 7, 'Salida', 'Gasto'),
	(21, 3, 'Entrada', 'Ingreso'),
	(22, 3, 'Salida', 'Gasto'),
	(23, 3, 'Salida', 'Imprevisto'),
	(24, 8, 'Salida', 'Gasto'),
	(25, 8, 'Salida', 'Gasto'),
	(26, 10, 'Entrada', 'Ingreso'),
	(27, 10, 'Salida', 'Gasto'),
	(28, 11, 'Entrada', 'Ingreso'),
	(29, 11, 'Entrada', 'Ingreso'),
	(30, 11, 'Entrada', 'Ahorro'),
	(31, 11, 'Salida', 'Deuda'),
	(32, 10, 'Entrada', 'Ingreso'),
	(33, 10, 'Salida', 'Imprevisto'),
	(34, 10, 'Entrada', 'Ahorro'),
	(35, 10, 'Salida', 'Deuda'),
	(36, 3, 'Entrada', 'Ahorro'),
	(37, 4, 'Entrada', 'Ahorro'),
	(38, 3, 'Salida', 'Gasto'),
	(41, 3, 'Salida', 'Gasto'),
	(44, 4, 'Salida', 'Gasto'),
	(45, 4, 'Salida', 'Gasto'),
	(46, 4, 'Salida', 'Gasto'),
	(48, 17, 'Salida', 'Gasto'),
	(49, 17, 'Salida', 'Gasto'),
	(50, 4, 'Entrada', 'Ahorro'),
	(51, 4, 'Entrada', 'Ahorro'),
	(52, 4, 'Entrada', 'Ahorro'),
	(53, 4, 'Entrada', 'Ahorro'),
	(54, 4, 'Entrada', 'Ahorro'),
	(55, 4, 'Entrada', 'Ingreso'),
	(56, 4, 'Entrada', 'Ingreso'),
	(57, 4, 'Entrada', 'Ingreso'),
	(58, 4, 'Entrada', 'Ingreso'),
	(60, 4, 'Salida', 'Gasto'),
	(61, 4, 'Salida', 'Gasto'),
	(62, 4, 'Salida', 'Gasto'),
	(63, 4, 'Salida', 'Gasto'),
	(64, 4, 'Salida', 'Gasto'),
	(65, 4, 'Salida', 'Imprevisto'),
	(66, 4, 'Salida', 'Imprevisto'),
	(67, 4, 'Salida', 'Imprevisto'),
	(68, 4, 'Salida', 'Imprevisto'),
	(69, 4, 'Salida', 'Imprevisto'),
	(70, 4, 'Salida', 'Deuda'),
	(71, 4, 'Salida', 'Deuda'),
	(72, 4, 'Salida', 'Deuda'),
	(73, 4, 'Salida', 'Deuda'),
	(74, 4, 'Salida', 'Deuda'),
	(84, 4, 'Entrada', 'Ahorro'),
	(85, 4, 'Entrada', 'Ahorro'),
	(86, 4, 'Entrada', 'Ahorro'),
	(87, 4, 'Entrada', 'Ahorro'),
	(88, 4, 'Entrada', 'Ahorro'),
	(89, 4, 'Entrada', 'Ingreso'),
	(91, 4, 'Entrada', 'Ingreso'),
	(93, 4, 'Entrada', 'Ingreso'),
	(94, 4, 'Salida', 'Gasto'),
	(95, 4, 'Salida', 'Gasto'),
	(96, 4, 'Salida', 'Gasto'),
	(97, 4, 'Salida', 'Gasto'),
	(98, 4, 'Salida', 'Gasto'),
	(99, 4, 'Salida', 'Imprevisto'),
	(100, 4, 'Salida', 'Imprevisto'),
	(101, 4, 'Salida', 'Imprevisto'),
	(102, 4, 'Salida', 'Imprevisto'),
	(103, 4, 'Salida', 'Imprevisto'),
	(104, 4, 'Salida', 'Deuda'),
	(105, 4, 'Salida', 'Deuda'),
	(106, 4, 'Salida', 'Deuda'),
	(107, 4, 'Salida', 'Deuda'),
	(108, 4, 'Salida', 'Deuda'),
	(109, 2, 'Entrada', 'Ingreso'),
	(111, 4, 'Salida', 'Gasto'),
	(112, 3, 'Entrada', 'Ingreso'),
	(113, 3, 'Entrada', 'Ingreso'),
	(114, 19, 'Salida', 'Gasto'),
	(115, 19, 'Entrada', 'Ingreso'),
	(116, 19, 'Salida', 'Imprevisto'),
	(117, 19, 'Entrada', 'Ahorro'),
	(118, 20, 'Salida', 'Gasto'),
	(119, 20, 'Salida', 'Gasto'),
	(120, 20, 'Salida', 'Gasto'),
	(121, 2, 'Entrada', 'Ingreso'),
	(122, 2, 'Entrada', 'Ingreso'),
	(124, 4, 'Entrada', 'Ahorro'),
	(127, 2, 'Entrada', 'Ingreso'),
	(128, 2, 'Entrada', 'Ingreso'),
	(129, 2, 'Salida', 'Gasto');


--
-- Data for Name: entrada; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."entrada" ("id_entrada", "id_movimiento") VALUES
	(2, 3),
	(3, 4),
	(4, 5),
	(5, 6),
	(9, 16),
	(10, 17),
	(11, 19),
	(12, 21),
	(13, 26),
	(14, 28),
	(15, 29),
	(16, 30),
	(17, 32),
	(18, 34),
	(19, 36),
	(20, 37),
	(23, 50),
	(24, 51),
	(25, 52),
	(26, 53),
	(27, 54),
	(28, 55),
	(29, 56),
	(30, 57),
	(31, 58),
	(42, 84),
	(43, 85),
	(44, 86),
	(45, 87),
	(46, 88),
	(47, 89),
	(49, 91),
	(51, 93),
	(52, 109),
	(54, 112),
	(55, 113),
	(56, 115),
	(57, 117),
	(58, 121),
	(59, 122),
	(60, 124),
	(61, 127),
	(62, 128);


--
-- Data for Name: ahorros; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."ahorros" ("id_ahorros", "id_entrada", "id_categoria", "monto", "monto_acumulado", "descripcion", "meta", "fecha_registro", "fecha_meta") VALUES
	(4, 10, NULL, 300000.00, 0.00, 'Meta de ahorro: Abono a meta', 'Abono a meta', '2026-09-07', NULL),
	(3, 9, NULL, 3000000.00, 500000.00, 'Meta de ahorro: playa', 'playa', '2026-09-08', '2027-09-16'),
	(5, 16, NULL, 9000.00, 500.00, 'Meta de ahorro: Almuerzo', 'Almuerzo', '2026-09-08', '2026-09-09'),
	(6, 18, NULL, 5000000.00, 0.00, 'Meta de ahorro: Francia paseo', 'Francia paseo', '2026-09-08', '2026-09-15'),
	(7, 19, 5, 2000000.00, 0.00, 'viaje a Cartagena el otro año', 'viaje a Cartagena', '2026-09-10', '2027-09-16'),
	(8, 20, 9, 5000000.00, 250000.00, 'capital para invertir en el negocio', 'ahorro general', '2026-09-10', NULL),
	(9, 23, NULL, 3000000.00, 900000.00, 'Ahorro para vacaciones familiares', 'Viaje a Cartagena', '2026-01-10', '2026-12-01'),
	(10, 24, NULL, 5000000.00, 1200000.00, 'Fondo para cuota inicial de vehículo', 'Carro nuevo', '2026-02-01', '2027-06-01'),
	(11, 25, 14, 2000000.00, 2000000.00, 'Ahorro completado para curso de especialización', 'Curso online', '2025-09-01', '2026-01-15'),
	(12, 26, NULL, 1500000.00, 300000.00, 'Colchón financiero adicional', 'Reserva extra', '2026-03-05', NULL),
	(13, 27, NULL, 4000000.00, 500000.00, 'Ahorro navideño', 'Regalos y fin de año', '2026-01-20', '2026-12-15'),
	(23, 42, NULL, 2200000.00, 600000.00, 'Ahorro para renovar el computador', 'Nuevo portátil', '2026-09-02', '2026-11-01'),
	(24, 43, 31, 6000000.00, 1500000.00, 'Ahorro para viaje internacional', 'Viaje a Europa', '2026-09-03', '2027-07-01'),
	(25, 44, NULL, 900000.00, 900000.00, 'Ahorro completado para bicicleta', 'Bicicleta de montaña', '2026-09-01', '2026-09-14'),
	(26, 45, NULL, 3500000.00, 400000.00, 'Ahorro para remodelar la sala', 'Remodelación hogar', '2026-09-05', '2027-01-15'),
	(27, 46, NULL, 1800000.00, 200000.00, 'Fondo para gastos de matrícula del próximo semestre', 'Matrícula universitaria', '2026-09-08', '2027-01-20'),
	(28, 57, 9, 450000.00, 0.00, 'pago de la empresa', '1000000', '2026-09-18', '2026-09-30'),
	(29, 60, 2, 14000000.00, 320000.00, 'asd', 'Moto', '2026-09-24', '2026-09-30');


--
-- Data for Name: abonos_ahorro; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."abonos_ahorro" ("id_abono", "id_ahorros", "monto", "fecha_registro") VALUES
	(1, 9, 300000.00, '2026-02-10'),
	(2, 10, 500000.00, '2026-03-01'),
	(3, 11, 2000000.00, '2026-01-15'),
	(4, 12, 150000.00, '2026-04-05'),
	(5, 13, 200000.00, '2026-02-20'),
	(12, 23, 220000.00, '2026-09-06'),
	(13, 24, 600000.00, '2026-09-09'),
	(14, 25, 900000.00, '2026-09-14'),
	(15, 26, 350000.00, '2026-09-11'),
	(16, 27, 180000.00, '2026-09-15'),
	(17, 29, 300000.00, '2026-09-24'),
	(18, 29, 20000.00, '2026-10-10');


--
-- Data for Name: salida; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."salida" ("id_salida", "id_movimiento") VALUES
	(1, 2),
	(2, 7),
	(4, 9),
	(5, 10),
	(7, 13),
	(8, 18),
	(9, 20),
	(10, 22),
	(11, 23),
	(12, 24),
	(13, 25),
	(14, 27),
	(15, 31),
	(16, 33),
	(17, 35),
	(18, 38),
	(20, 41),
	(22, 44),
	(23, 45),
	(24, 46),
	(26, 48),
	(27, 49),
	(28, 60),
	(29, 61),
	(30, 62),
	(31, 63),
	(32, 64),
	(33, 65),
	(34, 66),
	(35, 67),
	(36, 68),
	(37, 69),
	(38, 70),
	(39, 71),
	(40, 72),
	(41, 73),
	(42, 74),
	(43, 94),
	(44, 95),
	(45, 96),
	(46, 97),
	(47, 98),
	(48, 99),
	(49, 100),
	(50, 101),
	(51, 102),
	(52, 103),
	(53, 104),
	(54, 105),
	(55, 106),
	(56, 107),
	(57, 108),
	(58, 111),
	(59, 114),
	(60, 116),
	(61, 118),
	(62, 119),
	(63, 120),
	(67, 129);


--
-- Data for Name: deudas; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."deudas" ("id_deudas", "id_salida", "id_categoria", "monto", "fuente", "descripcion", "cuotas_total", "cuotas_pagadas", "fecha_inicio", "fecha_fin", "estado") VALUES
	(1, 8, NULL, 1000000.00, 'banco', NULL, 12, 3, '2026-09-07', NULL, 'pendiente'),
	(2, 15, NULL, 25000.00, 'David', NULL, 500, 0, '2026-09-08', NULL, 'pendiente'),
	(3, 17, NULL, 25000.00, 'addi', NULL, NULL, 0, '2026-09-08', NULL, 'pendiente'),
	(4, 38, 7, 15000000.00, 'Banco Nacional', 'Crédito hipotecario', 120, 12, '2025-01-01', '2035-01-01', 'pendiente'),
	(5, 39, 4, 3000000.00, 'Universidad XYZ', 'Crédito educativo', 24, 6, '2025-06-01', '2027-06-01', 'pendiente'),
	(6, 40, NULL, 800000.00, 'Tarjeta de crédito Visa', 'Saldo pendiente tarjeta de crédito', NULL, 0, '2026-02-01', NULL, 'pendiente'),
	(7, 41, 3, 1200000.00, 'Clínica particular', 'Préstamo por procedimiento médico', 12, 12, '2024-06-01', '2025-06-01', 'pagada'),
	(8, 42, NULL, 2500000.00, 'Cooperativa de ahorro', 'Préstamo personal', 18, 3, '2026-01-01', '2027-07-01', 'pendiente'),
	(9, 53, 30, 2400000.00, 'Financiera Sistecrédito', 'Crédito para compra de computador', 12, 4, '2026-06-01', '2027-06-01', 'pendiente'),
	(10, 54, NULL, 1600000.00, 'Tarjeta de crédito Mastercard', 'Saldo pendiente por compras a cuotas', NULL, 0, '2026-09-03', NULL, 'pendiente'),
	(11, 55, 34, 4500000.00, 'Almacén Éxito', 'Crédito para compra de muebles', 10, 10, '2025-11-01', '2026-09-01', 'pagada'),
	(12, 56, 4, 1800000.00, 'Instituto Técnico', 'Crédito por curso de certificación', 6, 2, '2026-07-01', '2027-01-01', 'pendiente'),
	(13, 57, NULL, 950000.00, 'Préstamo entre amigos', 'Préstamo informal para gastos personales', 4, 1, '2026-09-10', '2027-01-10', 'pendiente');


--
-- Data for Name: abonos_deuda; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."abonos_deuda" ("id_abono_deuda", "id_deudas", "cuotas", "monto", "fecha_registro", "descripcion") VALUES
	(1, 4, 1, 180000.00, '2026-01-01', 'Cuota mensual crédito hipotecario'),
	(2, 5, 1, 125000.00, '2026-01-15', 'Cuota crédito educativo'),
	(3, 6, 1, 200000.00, '2026-03-01', 'Pago parcial tarjeta de crédito'),
	(4, 7, 1, 100000.00, '2025-06-01', 'Última cuota préstamo médico'),
	(5, 8, 1, 150000.00, '2026-02-01', 'Cuota préstamo personal'),
	(6, 9, 1, 200000.00, '2026-09-01', 'Cuota mensual crédito computador'),
	(7, 10, 1, 300000.00, '2026-09-04', 'Abono a tarjeta de crédito'),
	(8, 11, 1, 450000.00, '2026-09-01', 'Última cuota crédito de muebles'),
	(9, 12, 1, 300000.00, '2026-09-07', 'Cuota curso de certificación'),
	(10, 13, 1, 237500.00, '2026-09-13', 'Primera cuota del préstamo informal');


--
-- Data for Name: dependientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."dependientes" ("id_dependientes", "id_usuario", "nombre", "relacion", "ocupacion", "fecha_nacimiento", "peso_economico") VALUES
	(1, 4, 'Sofia', 'Hija', 'Estudiante', '2026-02-23', 4),
	(7, 4, 'María Gómez', 'Hija', 'Estudiante', '2015-03-12', 5),
	(8, 4, 'Carlos Gómez', 'Hijo', 'Estudiante', '2018-07-22', 5),
	(9, 4, 'Rosa Pérez', 'Madre', 'Jubilada', '1958-11-05', 3),
	(10, 4, 'Luis Gómez', 'Padre', 'Jubilado', '1955-02-18', 3),
	(11, 4, 'Ana Torres', 'Cónyuge', 'Empleada', '1990-09-30', 4),
	(27, 4, 'Sofía Ramírez', 'Hija', 'Estudiante', '2016-05-20', 5),
	(28, 4, 'Pedro Ramírez', 'Hijo', 'Estudiante', '2019-11-08', 5),
	(29, 4, 'Elena Torres', 'Madre', 'Jubilada', '1960-04-14', 3),
	(30, 4, 'Jorge Torres', 'Padre', 'Jubilado', '1957-08-27', 3),
	(31, 4, 'Laura Méndez', 'Pareja', 'Empleada', '1992-06-15', 4),
	(32, 2, 'Santiago Hurtado', 'Hijastro', 'Estudiante', '2011-05-10', 5);


--
-- Data for Name: fondos_emergencia; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."fondos_emergencia" ("id_fondo", "id_usuario", "meta", "fecha_creacion", "fecha_actualizacion") VALUES
	(1, 4, 6000000.00, '2026-01-01', '2026-09-17 01:43:26.939001'),
	(2, 2, 200000.00, '2026-10-07', '2026-10-07 04:01:01.877898');


--
-- Data for Name: gastos; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."gastos" ("id_gastos", "id_salida", "id_categoria", "id_dependientes", "monto", "descripcion", "fecha_registro") VALUES
	(1, 1, 1, NULL, 5000.00, 'me comí una empanada y costó $5000', '2026-09-01'),
	(2, 2, 1, NULL, 20000.00, '20,000 en mercado', '2026-09-01'),
	(5, 5, 1, NULL, 25.00, 'Gasto QA', '2024-05-20'),
	(6, 9, 9, NULL, 500000.00, 'compre una p*t4', '2026-09-08'),
	(7, 10, 1, NULL, 20000.00, 'pollo asado', '2026-09-08'),
	(8, 12, 4, NULL, 5000.00, 'cuentas de ahorros', '2026-09-08'),
	(9, 13, 8, NULL, 20000.00, 'trabajo ', '2026-09-08'),
	(10, 14, 1, NULL, 1000500.00, 'voy a gastar un millón 500 en mercado', '2026-09-08'),
	(4, 4, NULL, NULL, 200000.00, 'un millón 1,200,000 en el arriendo', '2026-09-01'),
	(11, 18, 1, NULL, 25.00, 'Gasto QA', '2024-05-20'),
	(12, 20, 1, NULL, 25.00, 'Gasto QA', '2024-05-20'),
	(13, 22, 2, 1, 20000.00, 'pasajes', '2026-09-14'),
	(14, 23, 6, NULL, 27480.00, NULL, '2026-09-14'),
	(15, 24, 1, 1, 100000.00, 'Mercado', '2026-01-05'),
	(17, 26, 1, NULL, 25000.00, 'Gasto de prueba Postman', '2026-09-15'),
	(18, 27, 1, NULL, 25.00, 'Gasto QA', '2024-05-20'),
	(19, 28, 1, NULL, 450000.00, 'Mercado del mes', '2026-01-05'),
	(20, 29, 2, NULL, 180000.00, 'Gasolina y peajes', '2026-01-12'),
	(21, 30, 4, 7, 320000.00, 'Matrícula escolar', '2026-01-20'),
	(22, 31, 10, NULL, 95000.00, 'Alimento y vacunas para la mascota', '2026-02-03'),
	(23, 32, 7, 9, 1100000.00, 'Arriendo mensual', '2026-02-05'),
	(24, 43, 6, NULL, 220000.00, 'Pago de servicios públicos (agua, luz, gas)', '2026-09-03'),
	(25, 44, 5, NULL, 130000.00, 'Salida al cine y cena en familia', '2026-09-06'),
	(26, 45, 30, NULL, 780000.00, 'Compra de audífonos inalámbricos', '2026-09-08'),
	(27, 46, 34, 29, 540000.00, 'Compra de electrodoméstico para el hogar', '2026-09-11'),
	(28, 47, 32, 28, 160000.00, 'Inscripción a escuela de fútbol', '2026-09-14'),
	(29, 58, 1, 31, 20000.00, 'almuerzo ', '2026-09-17'),
	(30, 59, 1, NULL, 50000.00, 'almuerzo ', '2026-09-18'),
	(31, 61, 1, NULL, 50000.00, 'compartir', '2026-09-18'),
	(32, 62, 5, NULL, 31333.00, 'buscar a cuetochambito', '2026-09-18'),
	(33, 63, 2, NULL, 10000.00, '10,000 en un taxi', '2026-09-18'),
	(37, 67, 1, NULL, 120000.00, 'Mercado', '2026-10-20');


--
-- Data for Name: historial; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."historial" ("id_historial", "id_usuario", "accion", "detalles", "fecha") VALUES
	(1, 4, 'Inicio de sesión', 'El usuario inició sesión desde un nuevo dispositivo', '2026-01-01 08:15:00'),
	(2, 4, 'Creación de categoría', 'Se creó la categoría personalizada Mascotas', '2026-01-02 09:30:00'),
	(3, 4, 'Registro de gasto', 'Se registró un gasto en Alimentación por $450.000', '2026-01-05 12:00:00'),
	(4, 4, 'Actualización de presupuesto', 'Se activó el Presupuesto Principal', '2026-01-10 18:45:00'),
	(5, 4, 'Registro de ingreso', 'Se registró el ingreso de nómina mensual', '2026-01-30 10:00:00'),
	(6, 4, 'Creación de dependiente', 'Se agregó a Sofía Ramírez como dependiente', '2026-09-02 09:00:00'),
	(7, 4, 'Registro de deuda', 'Se registró una deuda por compra de computador a crédito', '2026-09-04 14:20:00'),
	(8, 4, 'Registro de imprevisto', 'Se registró un imprevisto por daño eléctrico en el hogar', '2026-09-05 19:10:00'),
	(9, 4, 'Actualización de perfil', 'El usuario actualizó su información de contacto', '2026-09-09 11:05:00'),
	(10, 4, 'Cierre de sesión', 'El usuario cerró sesión manualmente', '2026-09-15 21:40:00'),
	(11, 2, 'Actualizó sus datos personales', NULL, '2026-09-22 15:29:00.41059'),
	(12, 2, 'Cambió su contraseña', NULL, '2026-09-22 15:29:26.246486'),
	(13, 21, 'Cambió su contraseña', NULL, '2026-09-22 19:39:05.050877'),
	(14, 2, 'Eliminó un dependiente', 'Dependiente eliminado: ID 34', '2026-09-23 03:33:10.667145'),
	(15, 2, 'Eliminó un dependiente', 'Dependiente eliminado: ID 6', '2026-09-23 03:39:26.73968'),
	(16, 2, 'Eliminó un dependiente', 'Dependiente eliminado: ID 33', '2026-09-23 03:45:58.990886'),
	(17, 2, 'Eliminó un dependiente', 'Dependiente eliminado: ID 35', '2026-09-23 03:51:01.246033'),
	(18, 4, 'Actualizó sus datos personales', NULL, '2026-09-23 04:10:39.461554'),
	(19, 4, 'Cambió su contraseña', NULL, '2026-09-23 04:11:18.848794'),
	(20, 4, 'Cambió su contraseña', NULL, '2026-09-23 10:10:02.42455'),
	(21, 22, 'Eliminó un dependiente', 'Dependiente eliminado: ID 36', '2026-10-06 22:59:51.600546'),
	(22, 2, 'Cambió su contraseña', NULL, '2026-10-20 16:44:58.134897'),
	(23, 2, 'Actualizó sus datos personales', NULL, '2026-10-20 17:37:24.046624'),
	(24, 2, 'Actualizó sus datos personales', NULL, '2026-10-20 17:37:30.028374'),
	(25, 2, 'Actualizó sus datos personales', NULL, '2026-10-20 17:37:35.732763');


--
-- Data for Name: imprevistos; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."imprevistos" ("id_imprevistos", "id_salida", "id_categoria", "id_dependientes", "monto", "causa", "fecha_registro") VALUES
	(1, 7, 3, NULL, 2000.00, NULL, '2026-09-07'),
	(2, 11, 3, NULL, 20000.00, NULL, '2026-09-08'),
	(3, 16, 3, NULL, 208000.00, NULL, '2026-09-08'),
	(4, 33, 3, 8, 250000.00, 'Consulta médica de urgencia', '2026-01-08'),
	(5, 34, 2, NULL, 180000.00, 'Reparación mecánica del vehículo', '2026-01-25'),
	(6, 35, 7, NULL, 400000.00, 'Daño en tubería del apartamento', '2026-02-10'),
	(7, 36, NULL, 10, 150000.00, 'Medicamentos no cubiertos por seguro', '2026-02-18'),
	(8, 37, 10, NULL, 90000.00, 'Emergencia veterinaria', '2026-03-02'),
	(9, 48, 34, NULL, 320000.00, 'Daño en el sistema eléctrico de la casa', '2026-09-01'),
	(10, 49, 3, 30, 410000.00, 'Hospitalización de emergencia', '2026-09-05'),
	(11, 50, NULL, NULL, 95000.00, 'Multa de tránsito inesperada', '2026-09-08'),
	(12, 51, 30, NULL, 260000.00, 'Reparación urgente del portátil de trabajo', '2026-09-12'),
	(13, 52, 7, 27, 175000.00, 'Pérdida de llaves y cambio de cerradura', '2026-09-15'),
	(14, 60, 8, NULL, 80000.00, 'pago del gym', '2026-09-18');


--
-- Data for Name: ingresos; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."ingresos" ("id_ingresos", "id_entrada", "id_categoria", "monto", "descripcion", "fuente", "fecha_registro") VALUES
	(2, 2, 8, 3000000.00, 'recibí tres palos de nómina', 'Nómina', '2026-09-01'),
	(3, 3, NULL, 850000.00, 'vendí el celular en 850,000', 'Otros', '2026-09-01'),
	(4, 4, NULL, 100000.00, 'me pagaron 100 Lucas de honorarios', 'Otros', '2026-09-01'),
	(5, 5, NULL, 50500.00, 'recibí 50,500 de un regalo', 'Otros', '2026-09-01'),
	(7, 11, 9, 1000000.00, 'nomina', 'trafico', '2026-09-08'),
	(8, 12, 8, 20000.00, 'venta de dulces', 'trabajo ', '2026-09-08'),
	(9, 13, 4, 200000000.00, 'Contrato de aprendizaje ', 'sena', '2026-09-08'),
	(10, 14, 1, 1500.00, 'Me pagó juanma', 'Juanma', '2026-09-08'),
	(11, 15, NULL, 50000.00, 'recibí 50,000 de David', 'Otros', '2026-09-08'),
	(12, 17, 4, 5000000.00, '5 millones de contrato de aprendizaje', 'Otros', '2026-09-08'),
	(15, 28, 8, 4500000.00, 'Pago de nómina mensual', 'Empresa ABC S.A.S.', '2026-01-30'),
	(16, 29, 12, 1200000.00, 'Proyecto de desarrollo web', 'Cliente independiente', '2026-02-15'),
	(17, 30, 9, 2800000.00, 'Ganancias del negocio propio', 'Tienda online', '2026-02-28'),
	(18, 31, 8, 4500000.00, 'Pago de nómina mensual', 'Empresa ABC S.A.S.', '2026-02-28'),
	(20, 47, 9, 3200000.00, 'Ganancias por venta de productos artesanales', 'Emprendimiento propio', '2026-09-02'),
	(22, 49, 8, 3900000.00, 'Pago quincenal de nómina', 'Empresa Tech Solutions', '2026-09-07'),
	(24, 51, 9, 2100000.00, 'Pago por asesoría profesional', 'Consultoría independiente', '2026-09-13'),
	(25, 52, 8, 1000000.00, 'nomina', 'seguros', '2026-09-15'),
	(27, 54, 9, 20000.00, 'no se', 'venta de empanadas', '2026-09-17'),
	(28, 55, 8, 100000.00, 'pago nomina', 'empresa', '2026-09-17'),
	(29, 56, 9, 100000.00, 'recibi un pago de un contrato', 'contrato', '2026-09-18'),
	(30, 58, 8, 2000000.00, 'asd', 'No se', '2026-09-23'),
	(31, 59, 8, 20000000.00, 'asd', 'No se', '2026-09-24'),
	(32, 61, 4, 200000.00, '123', 'Camisas', '2026-10-15'),
	(33, 62, 35, 600000.00, 'Quinsena', 'jajaja', '2026-10-15');


--
-- Data for Name: movimientos_fondo_emergencia; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."movimientos_fondo_emergencia" ("id_movimiento_fondo", "id_fondo", "tipo", "monto", "fecha_registro", "descripcion") VALUES
	(1, 1, 'aporte', 500000.00, '2026-01-05', 'Aporte inicial al fondo de emergencia'),
	(2, 1, 'aporte', 300000.00, '2026-02-05', 'Aporte mensual programado'),
	(3, 1, 'aporte', 300000.00, '2026-03-05', 'Aporte mensual programado'),
	(4, 1, 'retiro', 200000.00, '2026-02-20', 'Retiro por emergencia médica de un dependiente'),
	(5, 1, 'aporte', 400000.00, '2026-04-05', 'Aporte mensual programado'),
	(6, 1, 'aporte', 250000.00, '2026-09-02', 'Aporte extra por bono laboral'),
	(7, 1, 'retiro', 150000.00, '2026-09-06', 'Retiro para cubrir imprevisto eléctrico'),
	(8, 1, 'aporte', 350000.00, '2026-09-09', 'Aporte quincenal programado'),
	(9, 1, 'retiro', 100000.00, '2026-09-12', 'Retiro para gastos médicos menores'),
	(10, 1, 'aporte', 300000.00, '2026-09-16', 'Aporte de cierre de quincena'),
	(11, 2, 'aporte', 300000.00, '2026-10-07', NULL);


--
-- Data for Name: notificaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."notificaciones" ("id_notificacion", "id_usuario", "tipo", "entidad_tipo", "entidad_id", "mensaje", "fecha", "leida", "archivada") VALUES
	(1, 4, 'sugerencia', 'periodo_imprevistos_no_usado', 1, 'No usaste casi nada de tu fondo de imprevistos este período. Considera destinar parte de ese dinero a tus ahorros.', '2026-09-07 22:06:47.512301', false, false),
	(3, 1, 'sistema', 'transaccion', 101, 'Se acreditaron $450.000 a tu cuenta.', '2026-09-08 01:40:33.418346', false, false),
	(4, 7, 'sugerencia', 'periodo_imprevistos_no_usado', 3, 'No usaste casi nada de tu fondo de imprevistos este período. Considera destinar parte de ese dinero a tus ahorros.', '2026-09-08 12:26:38.261583', false, false),
	(5, 3, 'sugerencia', 'periodo_imprevistos_no_usado', 4, 'No usaste casi nada de tu fondo de imprevistos este período. Considera destinar parte de ese dinero a tus ahorros.', '2026-09-08 14:02:24.788', false, false),
	(7, 4, 'sugerencia', 'periodo_imprevistos_no_usado', 12, 'No usaste casi nada de tu fondo de imprevistos este período. Considera destinar parte de ese dinero a tus ahorros.', '2026-09-24 18:21:40.347786', false, false),
	(12, 2, 'sistema', NULL, NULL, 'Esta es una notificación de prueba 🚀', '2026-10-07 04:42:58.309409', true, false),
	(13, 2, 'sistema', NULL, NULL, 'Esta es una notificación de prueba 🚀', '2026-10-07 05:12:53.064392', true, false),
	(19, 2, 'sistema', NULL, NULL, 'Esta es una notificación de prueba 🚀', '2026-10-20 16:40:24.900955', true, false),
	(21, 2, 'sugerencia', 'periodo_imprevistos_no_usado', 11, 'No usaste casi nada de tu fondo de imprevistos este período. Considera destinar parte de ese dinero a tus ahorros.', '2026-10-20 16:45:51.506561', true, false),
	(22, 2, 'alerta_presupuesto', 'periodo_gastos', 14, 'Has usado el 108% de tu presupuesto de Gastos en este período.', '2026-10-20 16:47:08.27684', true, false);


--
-- Data for Name: presupuestos; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."presupuestos" ("id_presupuesto", "id_usuario", "nombre", "descripcion", "activo", "dia_corte", "porcentaje_gastos", "porcentaje_deudas", "porcentaje_imprevistos", "porcentaje_ahorros", "porcentaje_emergencia", "fecha_actualizacion") VALUES
	(1, 4, 'Normal', NULL, true, 28, 40.00, 20.00, 15.00, 15.00, 10.00, '2026-09-07 12:41:33.493026'),
	(2, 7, 'Franco', 'lambonessssw', false, 1, 40.00, 20.00, 15.00, 10.00, 15.00, '2026-09-08 12:28:54.271339'),
	(4, 7, 'manueloso', 'sociopatas', true, 3, 40.00, 20.00, 15.00, 10.00, 15.00, '2026-09-08 12:29:07.451358'),
	(5, 8, 'almuerzo', 'almuerzo trabajo', true, 1, 40.00, 20.00, 15.00, 10.00, 15.00, '2026-09-08 12:50:56.715317'),
	(3, 3, 'presupuesto 1', 'trabajo', false, 31, 40.00, 20.00, 15.00, 10.00, 15.00, '2026-09-08 14:03:38.387062'),
	(6, 3, 'ahorrarivo', 'quiero ahorrar', true, 1, 40.00, 15.00, 5.00, 25.00, 15.00, '2026-09-08 14:03:38.387062'),
	(7, 11, 'Prueba', '', true, 5, 40.00, 20.00, 15.00, 10.00, 15.00, '2026-09-08 14:12:14.074924'),
	(8, 10, 'Cuota Casa', 'cuotas con el banco de mi casa', true, 5, 40.00, 20.00, 15.00, 10.00, 15.00, '2026-09-08 14:37:54.602233'),
	(9, 14, 'normal', '', true, 31, 40.00, 20.00, 15.00, 10.00, 15.00, '2026-09-10 12:41:58.165786'),
	(10, 19, 'normal', 'hacer un ahorro', true, 15, 10.00, 20.00, 15.00, 40.00, 15.00, '2026-09-18 11:41:18.308994'),
	(11, 2, 'Mes normal', 'asd', true, 28, 10.00, 0.00, 15.00, 50.00, 25.00, '2026-10-20 16:46:06.817146');


--
-- Data for Name: periodos_presupuesto; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."periodos_presupuesto" ("id_periodo", "id_presupuesto", "id_usuario", "fecha_inicio", "fecha_fin", "ingreso_estimado", "ingreso_real", "saldo_anterior", "estado", "monto_gastos", "monto_deudas", "monto_imprevistos", "monto_ahorros", "monto_emergencia") VALUES
	(1, 1, 4, '2026-09-07', '2026-10-27', 2000000.00, 0.00, 0.00, 'cerrado', 800000.00, 400000.00, 300000.00, 300000.00, 200000.00),
	(3, 2, 7, '2026-09-08', '2026-09-30', 1.00, 1000000.00, 0.00, 'cerrado', 0.40, 0.20, 0.15, 0.10, 0.15),
	(5, 5, 8, '2026-09-08', '2026-09-30', 25000.00, 0.00, 0.00, 'abierto', 10000.00, 5000.00, 3750.00, 2500.00, 3750.00),
	(4, 3, 3, '2026-09-08', '2026-10-30', 2000000.00, 20000.00, 0.00, 'cerrado', 800000.00, 400000.00, 300000.00, 200000.00, 300000.00),
	(7, 7, 11, '2026-09-08', '2026-10-04', 250000.00, 0.00, 0.00, 'abierto', 100000.00, 50000.00, 37500.00, 25000.00, 37500.00),
	(8, 8, 10, '2026-09-08', '2026-10-04', 2000000.00, 0.00, 0.00, 'abierto', 800000.00, 400000.00, 300000.00, 200000.00, 300000.00),
	(9, 9, 14, '2026-09-10', '2026-10-30', 2000000.00, 0.00, 0.00, 'abierto', 800000.00, 400000.00, 300000.00, 200000.00, 300000.00),
	(6, 6, 3, '2026-09-08', '2026-09-30', 2000000.00, 140000.00, 0.00, 'abierto', 800000.00, 300000.00, 100000.00, 500000.00, 300000.00),
	(10, 10, 19, '2026-09-18', '2026-10-14', 1000000.00, 100000.00, 0.00, 'abierto', 100000.00, 200000.00, 150000.00, 400000.00, 150000.00),
	(2, 1, 4, '2026-09-07', '2026-10-27', 10000000.00, 6000000.00, 0.00, 'cerrado', 4000000.00, 2000000.00, 1500000.00, 1500000.00, 1000000.00),
	(12, 1, 4, '2026-09-24', '2026-10-27', 3000000.00, 0.00, 0.00, 'cerrado', 1200000.00, 600000.00, 450000.00, 450000.00, 300000.00),
	(13, 1, 4, '2026-09-24', '2026-10-27', 2000000.00, 0.00, 0.00, 'abierto', 800000.00, 400000.00, 300000.00, 300000.00, 200000.00),
	(11, 11, 2, '2026-09-23', '2026-10-27', 1300000.00, 22800000.00, 0.00, 'cerrado', 65000.00, 65000.00, 195000.00, 650000.00, 325000.00),
	(14, 11, 2, '2026-10-20', '2026-11-27', 1300000.00, 0.00, 0.00, 'abierto', 130000.00, 0.00, 195000.00, 650000.00, 325000.00);


--
-- Data for Name: preferencias_notificacion; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."preferencias_notificacion" ("id_usuario", "tipo", "activa") VALUES
	(2, 'sistema', true),
	(2, 'alerta_presupuesto', true);


--
-- Data for Name: push_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."push_tokens" ("id", "id_usuario", "fcm_token", "plataforma") VALUES
	(1, 2, 'ceyp6DrOSxSUBL_x_sl0_q:APA91bG6s_IzdUz9_kUaMkUlHlFQk4sDiuN6yG8QnafsQAzRWo7eCu65ijvyS3q-yfKtrc28eRIDvNBamjtjwRuJ5Nru50KrXwRAqCWZ37psPk_JqjifiC0', 'android');


--
-- Data for Name: rol; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."rol" ("id_rol", "cargo") VALUES
	(1, 'user'),
	(2, 'admin'),
	(3, 'superuser');


--
-- Data for Name: usuarios_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."usuarios_roles" ("id_usuario", "id_rol") VALUES
	(3, 1),
	(4, 3),
	(5, 1),
	(6, 1),
	(7, 1),
	(8, 1),
	(9, 1),
	(10, 1),
	(11, 1),
	(12, 1),
	(13, 1),
	(14, 1),
	(1, 2),
	(15, 1),
	(16, 1),
	(17, 1),
	(18, 1),
	(19, 1),
	(20, 1),
	(21, 1),
	(22, 1),
	(23, 1),
	(2, 3);


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 2, true);


--
-- Name: abonos_ahorro_id_abono_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."abonos_ahorro_id_abono_seq"', 18, true);


--
-- Name: abonos_deuda_id_abono_deuda_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."abonos_deuda_id_abono_deuda_seq"', 10, true);


--
-- Name: ahorros_id_ahorros_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."ahorros_id_ahorros_seq"', 29, true);


--
-- Name: categorias_id_categoria_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."categorias_id_categoria_seq"', 38, true);


--
-- Name: dependientes_id_dependientes_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."dependientes_id_dependientes_seq"', 36, true);


--
-- Name: deudas_id_deudas_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."deudas_id_deudas_seq"', 13, true);


--
-- Name: entrada_id_entrada_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."entrada_id_entrada_seq"', 62, true);


--
-- Name: fondos_emergencia_id_fondo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."fondos_emergencia_id_fondo_seq"', 2, true);


--
-- Name: gastos_id_gastos_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."gastos_id_gastos_seq"', 37, true);


--
-- Name: historial_id_historial_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."historial_id_historial_seq"', 25, true);


--
-- Name: imprevistos_id_imprevistos_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."imprevistos_id_imprevistos_seq"', 14, true);


--
-- Name: ingresos_id_ingresos_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."ingresos_id_ingresos_seq"', 33, true);


--
-- Name: movimientos_fondo_emergencia_id_movimiento_fondo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."movimientos_fondo_emergencia_id_movimiento_fondo_seq"', 11, true);


--
-- Name: movimientos_id_movimiento_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."movimientos_id_movimiento_seq"', 129, true);


--
-- Name: notificaciones_id_notificacion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."notificaciones_id_notificacion_seq"', 22, true);


--
-- Name: periodos_presupuesto_id_periodo_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."periodos_presupuesto_id_periodo_seq"', 14, true);


--
-- Name: presupuestos_id_presupuesto_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."presupuestos_id_presupuesto_seq"', 11, true);


--
-- Name: push_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."push_tokens_id_seq"', 5, true);


--
-- Name: rol_id_rol_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."rol_id_rol_seq"', 9, true);


--
-- Name: salida_id_salida_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."salida_id_salida_seq"', 67, true);


--
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."usuarios_id_usuario_seq"', 23, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict sQweVaCyEUEeKXkhvwfjedavau0vpkMqfOISOvUhYI87QL9v40APhXZ5TE5Cbyj

RESET ALL;
