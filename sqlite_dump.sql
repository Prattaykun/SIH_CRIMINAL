BEGIN TRANSACTION;
CREATE TABLE alembic_version (
	version_num VARCHAR(32) NOT NULL, 
	CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);
INSERT INTO "alembic_version" VALUES('677a87b10c73');
CREATE TABLE alerts (
	case_id VARCHAR(36) NOT NULL, 
	alert_type VARCHAR(100) NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	description TEXT, 
	severity VARCHAR(50) NOT NULL, 
	confidence_score NUMERIC(3, 2), 
	source_evidence TEXT, 
	evidence_ids JSON, 
	feature_values JSON, 
	rule_version VARCHAR(50), 
	model_version VARCHAR(50), 
	analytics_engine VARCHAR(50), 
	algorithm_version VARCHAR(50), 
	analysis_run_id VARCHAR(100), 
	requires_human_verification BOOLEAN NOT NULL, 
	reviewed_at DATETIME, 
	status VARCHAR(50) NOT NULL, 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id) ON DELETE CASCADE
);
INSERT INTO "alerts" VALUES('16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','PATTERN','Burner Phone Coordination Pattern','Phone 555-0199 contacted by multiple distinct fictional suspects.','HIGH',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,'OPEN','4332cb89-0914-4a69-a877-fe9d25f57b57','2026-09-06 17:33:31.612362','2026-09-06 17:33:31.612362');
INSERT INTO "alerts" VALUES('16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','PATTERN','Burner Phone Coordination Pattern','Phone 555-0199 contacted by multiple distinct fictional suspects.','HIGH',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,'OPEN','632c6ff3-f621-45f6-b0e9-42116ceb8299','2026-09-07 16:43:43.187132','2026-09-07 16:43:43.187132');
INSERT INTO "alerts" VALUES('16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','PATTERN','Burner Phone Coordination Pattern','Phone 555-0199 contacted by multiple distinct fictional suspects.','HIGH',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,'OPEN','955517c4-e1ea-468c-89c1-27ae6f8e554f','2026-09-08 14:23:59.885773','2026-09-08 14:23:59.885773');
INSERT INTO "alerts" VALUES('16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','PATTERN','Burner Phone Coordination Pattern','Phone 555-0199 contacted by multiple distinct fictional suspects.','HIGH',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,'OPEN','1cd78acb-8dc8-4b8c-8fbd-1be9f6abdaec','2026-09-08 14:26:29.642917','2026-09-08 14:26:29.642917');
CREATE TABLE audit_logs (
	user_id VARCHAR(36), 
	action VARCHAR(100) NOT NULL, 
	target_type VARCHAR(50) NOT NULL, 
	target_id VARCHAR(36) NOT NULL, 
	rationale TEXT, 
	previous_state TEXT, 
	new_state TEXT, 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
INSERT INTO "audit_logs" VALUES('c4308e0f-c1e9-4eba-b7c7-baecd19478ed','LOGIN_SUCCEEDED','USER','c4308e0f-c1e9-4eba-b7c7-baecd19478ed',NULL,NULL,NULL,'97c080f4-8f9b-4e6b-bb9c-95c17db38816','2026-09-05 08:01:50.198600','2026-09-05 08:01:50.198600');
INSERT INTO "audit_logs" VALUES('c4308e0f-c1e9-4eba-b7c7-baecd19478ed','LOGIN_SUCCEEDED','USER','c4308e0f-c1e9-4eba-b7c7-baecd19478ed',NULL,NULL,NULL,'75e2ba01-9a8c-41b1-b81d-8ddfd3fe1b18','2026-09-05 08:40:19.986552','2026-09-05 08:40:19.986552');
INSERT INTO "audit_logs" VALUES('c4308e0f-c1e9-4eba-b7c7-baecd19478ed','LOGIN_SUCCEEDED','USER','c4308e0f-c1e9-4eba-b7c7-baecd19478ed',NULL,NULL,NULL,'9c08544d-5331-4bb4-9f1b-8525d9dcf006','2026-09-05 08:40:21.490375','2026-09-05 08:40:21.490375');
INSERT INTO "audit_logs" VALUES('c4308e0f-c1e9-4eba-b7c7-baecd19478ed','LOGIN_SUCCEEDED','USER','c4308e0f-c1e9-4eba-b7c7-baecd19478ed',NULL,NULL,NULL,'cb2019a6-f508-4ac6-ba3e-6c9916755625','2026-09-05 08:40:22.303814','2026-09-05 08:40:22.303814');
INSERT INTO "audit_logs" VALUES('c4308e0f-c1e9-4eba-b7c7-baecd19478ed','LOGIN_SUCCEEDED','USER','c4308e0f-c1e9-4eba-b7c7-baecd19478ed',NULL,NULL,NULL,'ae81d8c1-4a6e-4095-a4f4-4abc356db485','2026-09-05 08:40:23.321529','2026-09-05 08:40:23.321529');
INSERT INTO "audit_logs" VALUES('DEV-USER-001','REVIEW_ALERT_ACCEPT','ALERT','8a4c5586-5f0f-4832-a202-42383a3efe7f','',NULL,NULL,'a98066b6-6581-45b4-94e9-990138e7910e','2026-09-05 08:40:41.526918','2026-09-05 08:40:41.526918');
INSERT INTO "audit_logs" VALUES('c4308e0f-c1e9-4eba-b7c7-baecd19478ed','LOGIN_SUCCEEDED','USER','c4308e0f-c1e9-4eba-b7c7-baecd19478ed',NULL,NULL,NULL,'cf50beca-8e98-49e1-84a7-e912f6b4f728','2026-09-05 16:37:53.052750','2026-09-05 16:37:53.052750');
INSERT INTO "audit_logs" VALUES('c4308e0f-c1e9-4eba-b7c7-baecd19478ed','AUTHORIZATION_DENIED','CASE','new',NULL,NULL,'{"reason": "User is not assigned to this case"}','c4f562cf-06f0-4a3d-8765-0a7c336ac335','2026-09-05 16:38:16.441553','2026-09-05 16:38:16.441553');
INSERT INTO "audit_logs" VALUES('c4308e0f-c1e9-4eba-b7c7-baecd19478ed','AUTHORIZATION_DENIED','CASE','new',NULL,NULL,'{"reason": "User is not assigned to this case"}','614ef2b0-4e27-4eb1-8228-4a068872e351','2026-09-05 16:38:16.449694','2026-09-05 16:38:16.449694');
INSERT INTO "audit_logs" VALUES('c4308e0f-c1e9-4eba-b7c7-baecd19478ed','AUTHORIZATION_DENIED','CASE','new',NULL,NULL,'{"reason": "User is not assigned to this case"}','a3739d70-0317-47a9-808e-5f1bd3d3cd6a','2026-09-05 16:38:36.452385','2026-09-05 16:38:36.452385');
INSERT INTO "audit_logs" VALUES('c4308e0f-c1e9-4eba-b7c7-baecd19478ed','AUTHORIZATION_DENIED','CASE','new',NULL,NULL,'{"reason": "User is not assigned to this case"}','31a3b735-e243-4943-ad11-906c49623f09','2026-09-05 16:38:36.464960','2026-09-05 16:38:36.464960');
INSERT INTO "audit_logs" VALUES('c4308e0f-c1e9-4eba-b7c7-baecd19478ed','AUTHORIZATION_DENIED','CASE','new',NULL,NULL,'{"reason": "User is not assigned to this case"}','16b56718-04ab-4493-8ffe-f58ba9541d27','2026-09-05 16:38:39.266541','2026-09-05 16:38:39.266541');
INSERT INTO "audit_logs" VALUES('c4308e0f-c1e9-4eba-b7c7-baecd19478ed','AUTHORIZATION_DENIED','CASE','new',NULL,NULL,'{"reason": "User is not assigned to this case"}','87f4a84e-cb39-478d-a668-a24737de3b6a','2026-09-05 16:38:39.273723','2026-09-05 16:38:39.273723');
INSERT INTO "audit_logs" VALUES('c4308e0f-c1e9-4eba-b7c7-baecd19478ed','LOGIN_SUCCEEDED','USER','c4308e0f-c1e9-4eba-b7c7-baecd19478ed',NULL,NULL,NULL,'e735cb24-9cbc-4bef-82b0-20a0e9906a6e','2026-09-05 17:04:50.620204','2026-09-05 17:04:50.620204');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_SUCCEEDED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682',NULL,NULL,NULL,'7677b7e1-052c-433c-8d06-1851c056bc46','2026-09-06 17:34:56.596929','2026-09-06 17:34:56.596929');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','AUTHORIZATION_DENIED','CASE','new',NULL,NULL,'{"reason": "User is not assigned to this case"}','5610be05-cf24-457b-9ea8-71a04717f950','2026-09-06 17:35:03.571426','2026-09-06 17:35:03.571426');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','AUTHORIZATION_DENIED','CASE','new',NULL,NULL,'{"reason": "User is not assigned to this case"}','9d869c27-a192-475b-a5a2-bf8e4c2a173a','2026-09-06 17:35:03.582305','2026-09-06 17:35:03.582305');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','AUTHORIZATION_DENIED','CASE','new',NULL,NULL,'{"reason": "User is not assigned to this case"}','9799c2c9-96eb-4982-84f3-5b0506135531','2026-09-06 17:37:25.698433','2026-09-06 17:37:25.698433');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','AUTHORIZATION_DENIED','CASE','new',NULL,NULL,'{"reason": "User is not assigned to this case"}','45ee808d-4b44-44a4-aa49-ab0fd879c921','2026-09-06 17:37:25.709818','2026-09-06 17:37:25.709818');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_RELATIONSHIP','RELATIONSHIP','ac82db22-0cfc-4d79-8492-cf6043eb2512','',NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": ""}','4a54b574-91b0-42fb-a797-0f62abb4303b','2026-09-06 17:37:47.951002','2026-09-06 17:37:47.951002');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','1d718832-a9b2-42b8-9b4c-2a1ab911ba67','',NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": ""}','93eaf5ae-d597-48ce-af6c-e93a6eb32058','2026-09-06 17:37:50.544028','2026-09-06 17:37:50.544028');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_RELATIONSHIP','RELATIONSHIP','8da9e043-1a9d-47f8-ae1b-83c527eb1ca8','',NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": ""}','8bde8015-2b5f-410d-9380-ca540fe09b97','2026-09-06 17:37:52.041762','2026-09-06 17:37:52.041762');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_RELATIONSHIP','RELATIONSHIP','e45b8160-7661-498c-a303-bfbe4f7e4bcc','',NULL,'{"verification_status": "REJECTED", "status": "REJECTED", "corrected_value": null, "rationale": ""}','5a9a7fe4-f4a4-4a77-9598-39cd90f0c937','2026-09-06 17:38:17.709926','2026-09-06 17:38:17.709926');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_RELATIONSHIP','RELATIONSHIP','c909a91c-60b5-4af9-85ee-5dd6479f521d','',NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": ""}','20561439-163b-4e99-811b-7d5cbcefd591','2026-09-06 17:38:18.983890','2026-09-06 17:38:18.983890');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_FAILED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682','Invalid credentials',NULL,NULL,'d0f2b5f0-3b0a-4cf1-9a7f-d8c9afad68d2','2026-09-07 16:52:25.994539','2026-09-07 16:52:25.994539');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_FAILED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682','Invalid credentials',NULL,NULL,'b1a49475-6905-4568-8807-bb02cc4b5647','2026-09-07 16:52:33.428170','2026-09-07 16:52:33.428170');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_FAILED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682','Invalid credentials',NULL,NULL,'7b5aa572-4aa0-46b8-8181-d0b1b9dac7c8','2026-09-07 16:52:42.388889','2026-09-07 16:52:42.388889');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_FAILED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682','Invalid credentials',NULL,NULL,'b938feb9-f833-458f-8ce5-981ded9b9c2e','2026-09-07 16:52:48.388886','2026-09-07 16:52:48.388886');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_SUCCEEDED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682',NULL,NULL,NULL,'720744e1-fb17-4d18-904c-2426e4c4600b','2026-09-07 16:54:49.140202','2026-09-07 16:54:49.140202');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_SUCCEEDED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682',NULL,NULL,NULL,'d1a3d153-0a0e-4ac7-a755-226abd1a877e','2026-09-07 16:55:17.353392','2026-09-07 16:55:17.353392');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','CASE_CREATED','CASE','20954795-4841-4c25-8700-91cbbb48875e',NULL,NULL,NULL,'85a19dbd-5fba-4b2a-b105-63eca91063b2','2026-09-07 16:55:27.449682','2026-09-07 16:55:27.449682');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','DOCUMENT_UPLOADED','DOCUMENT','e3bccc7a-2cea-4b5f-8d45-0c4d64a2881e',NULL,NULL,NULL,'90db559e-83cc-4300-a74d-544f2f1bcf94','2026-09-07 16:55:40.428459','2026-09-07 16:55:40.428459');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','DOCUMENT_UPLOADED','DOCUMENT','dfbece01-153e-4dff-9443-cb353319bdc4',NULL,NULL,NULL,'0eca464d-0142-4e40-94c3-074fa36dfe50','2026-09-07 16:56:40.464274','2026-09-07 16:56:40.464274');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','40ef2b68-06b1-4138-b952-e306518e6052','',NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": ""}','7b5e831f-70f8-44ca-87ee-32472fa7f739','2026-09-07 16:56:51.924691','2026-09-07 16:56:51.924691');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_RELATIONSHIP','RELATIONSHIP','da322d75-54fa-48bf-b613-a76bc206938b','',NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": ""}','0e5dda1f-9806-4112-bce8-4f9e93c0b5bf','2026-09-07 16:56:53.338599','2026-09-07 16:56:53.339108');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','c4758878-508e-4d6a-9866-75ec842453a4','',NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": ""}','4a05547d-b2ba-4533-9743-cf2549425971','2026-09-07 16:57:03.635999','2026-09-07 16:57:03.635999');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_RELATIONSHIP','RELATIONSHIP','8dbbe458-5f4c-4ddb-a072-fa9e77354e98','',NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": ""}','fa33c676-a852-423a-963a-3c5ecb282a32','2026-09-07 16:57:08.683455','2026-09-07 16:57:08.683455');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','cff41033-8ace-44c9-afc3-e87cef987e01','',NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": ""}','93bd1e51-f7ab-4d21-87c6-ab6462733fae','2026-09-07 16:57:10.645626','2026-09-07 16:57:10.645626');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_RELATIONSHIP','RELATIONSHIP','c121ab08-571a-461b-aef2-a202b70d8c39','',NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": ""}','32042976-dd2e-48a3-867b-3f2dbbe051c7','2026-09-07 16:57:11.512922','2026-09-07 16:57:11.512922');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_SUCCEEDED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682',NULL,NULL,NULL,'505a0b8a-4e1b-4019-9f88-0d99ae384274','2026-09-07 16:58:29.736947','2026-09-07 16:58:29.736947');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_FAILED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682','Invalid credentials',NULL,NULL,'f91e7d53-dede-4ca7-ac8b-d7bea5983b41','2026-09-07 17:27:48.200093','2026-09-07 17:27:48.200093');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_SUCCEEDED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682',NULL,NULL,NULL,'036ef000-abaf-448f-81c1-77a64f974a95','2026-09-07 17:28:09.216757','2026-09-07 17:28:09.216757');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_FAILED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682','Invalid credentials',NULL,NULL,'1e539517-6cac-4854-86f9-c344a0666499','2026-09-07 17:55:21.803156','2026-09-07 17:55:21.803156');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_FAILED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682','Invalid credentials',NULL,NULL,'1ae6c9de-dd19-4b33-86c7-ce97eeb8f391','2026-09-07 17:55:34.848811','2026-09-07 17:55:34.848811');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_FAILED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682','Invalid credentials',NULL,NULL,'138c2ad6-bf6e-4877-aa0c-f3219b4a43d8','2026-09-07 17:56:15.393468','2026-09-07 17:56:15.393468');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_SUCCEEDED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682',NULL,NULL,NULL,'6b8eea48-6472-4008-b94b-d107b5359191','2026-09-07 17:56:55.962912','2026-09-07 17:56:55.962912');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_FAILED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682','Invalid credentials',NULL,NULL,'3f68ce68-1fc6-400f-9d30-e44e3bdf020c','2026-09-07 18:09:42.816216','2026-09-07 18:09:42.816216');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_SUCCEEDED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682',NULL,NULL,NULL,'a3251094-3e16-47ec-89d3-94f9ff020d84','2026-09-07 18:09:59.595834','2026-09-07 18:09:59.595834');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_SUCCEEDED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682',NULL,NULL,NULL,'5fccdc4b-beeb-415f-aa72-70887d5fb68b','2026-09-07 18:14:18.582216','2026-09-07 18:14:18.582216');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','CASE_CREATED','CASE','a90b929a-ec83-4aa6-88f8-cc3141238917',NULL,NULL,NULL,'4bddd759-3db0-4075-a4ec-61b97d158010','2026-09-07 18:14:35.383824','2026-09-07 18:14:35.383824');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_FAILED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682','Invalid credentials',NULL,NULL,'989dc23b-3ae1-4cb7-9562-a74596dbdcff','2026-09-08 07:11:02.593231','2026-09-08 07:11:02.593231');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_SUCCEEDED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682',NULL,NULL,NULL,'05dc06d5-3b12-4f91-9984-143364c8a82b','2026-09-08 07:11:17.060033','2026-09-08 07:11:17.060033');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','AUTHORIZATION_DENIED','CASE','CASE-2024-SYN-185',NULL,NULL,'{"reason": "User is not assigned to this case"}','99ac0592-8930-4239-977c-ef0df002fdf3','2026-09-08 07:11:40.462891','2026-09-08 07:11:40.462891');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','AUTHORIZATION_DENIED','CASE','CASE-2024-SYN-185',NULL,NULL,'{"reason": "User is not assigned to this case"}','2578462a-cdd9-493d-b2f3-b8ece3e1e9d2','2026-09-08 07:11:40.470355','2026-09-08 07:11:40.470355');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_FAILED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682','Invalid credentials',NULL,NULL,'efe2e988-af8d-42de-a1ba-8b9e54e70b3f','2026-09-08 09:03:08.320385','2026-09-08 09:03:08.320385');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_SUCCEEDED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682',NULL,NULL,NULL,'ee241d81-d294-41dc-954b-b40978bad7a3','2026-09-08 09:03:12.202714','2026-09-08 09:03:12.202714');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','AUTHORIZATION_DENIED','CASE','CASE-2024-SYN-185',NULL,NULL,'{"reason": "User is not assigned to this case"}','bc147a91-791e-4fd1-85c4-ebb544ca3c23','2026-09-08 09:03:21.401046','2026-09-08 09:03:21.401046');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','AUTHORIZATION_DENIED','CASE','CASE-2024-SYN-185',NULL,NULL,'{"reason": "User is not assigned to this case"}','ffbad81a-cbe7-4b5c-b410-cd953d2fb82a','2026-09-08 09:03:21.406996','2026-09-08 09:03:21.406996');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','AUTHORIZATION_DENIED','CASE','CASE-2024-SYN-758',NULL,NULL,'{"reason": "User is not assigned to this case"}','a765b4e9-dc29-4493-a383-cd719a9ec6c3','2026-09-08 09:13:47.300818','2026-09-08 09:13:47.300818');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','AUTHORIZATION_DENIED','CASE','CASE-2024-SYN-758',NULL,NULL,'{"reason": "User is not assigned to this case"}','36648f6f-e3f8-4d45-8f38-3d9fd970c680','2026-09-08 09:13:47.306432','2026-09-08 09:13:47.306432');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','AUTHORIZATION_DENIED','CASE','CASE-2024-SYN-758',NULL,NULL,'{"reason": "User is not assigned to this case"}','82f54727-a86e-4663-b2e5-9eee4810764b','2026-09-08 09:14:03.093791','2026-09-08 09:14:03.093791');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','AUTHORIZATION_DENIED','CASE','CASE-2024-SYN-758',NULL,NULL,'{"reason": "User is not assigned to this case"}','00ad4519-c03c-4788-9e46-4d395de734a7','2026-09-08 09:14:03.104222','2026-09-08 09:14:03.104222');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','AUTHORIZATION_DENIED','CASE','CASE-2024-SYN-758',NULL,NULL,'{"reason": "User is not assigned to this case"}','c7fdd29a-c01e-49f7-adab-e5e52232c0f8','2026-09-08 09:14:08.997691','2026-09-08 09:14:08.997691');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','AUTHORIZATION_DENIED','CASE','CASE-2024-SYN-185',NULL,NULL,'{"reason": "User is not assigned to this case"}','1d79f971-ded6-4c0a-b9f3-238564e468c2','2026-09-08 09:22:15.722044','2026-09-08 09:22:15.722044');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','AUTHORIZATION_DENIED','CASE','CASE-2024-SYN-185',NULL,NULL,'{"reason": "User is not assigned to this case"}','4199e198-90c1-4ce9-aabc-fd0c25f01fdd','2026-09-08 09:22:15.728224','2026-09-08 09:22:15.728224');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_SUCCEEDED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682',NULL,NULL,NULL,'9da9f36d-aa01-4410-95ce-7346a0fb7048','2026-09-08 10:01:10.790700','2026-09-08 10:01:10.790700');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_SUCCEEDED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682',NULL,NULL,NULL,'06eebfe0-c7ed-420e-ac12-2985f9e6d946','2026-09-08 10:01:49.355496','2026-09-08 10:01:49.355496');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_SUCCEEDED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682',NULL,NULL,NULL,'cf896978-9580-4375-aaa3-36791919b7dd','2026-09-08 12:39:51.613934','2026-09-08 12:39:51.613934');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_SUCCEEDED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682',NULL,NULL,NULL,'1b0e0239-b768-4953-a701-3e8fc279b1a5','2026-09-08 12:40:36.746617','2026-09-08 12:40:36.746617');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_SUCCEEDED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682',NULL,NULL,NULL,'506eec4f-857a-493a-bfb5-d1df8367edfc','2026-09-08 12:44:19.523687','2026-09-08 12:44:19.523687');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','DOCUMENT_UPLOADED','DOCUMENT','8db381de-69f2-40ab-be53-d03335e49144',NULL,NULL,NULL,'64a3be2d-d2e7-4922-ab12-756717bf786e','2026-09-08 12:44:38.257382','2026-09-08 12:44:38.257382');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_SUCCEEDED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682',NULL,NULL,NULL,'a6abc525-9af3-41c8-a990-ceabef2c4ea4','2026-09-08 12:53:35.969261','2026-09-08 12:53:35.969261');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','CASE_CREATED','CASE','fdb9e3b1-5a66-40e0-81e8-5feeca57551d',NULL,NULL,NULL,'8a84bee6-1c3d-4efd-b2f1-e081d0129f5c','2026-09-08 13:08:03.864097','2026-09-08 13:08:03.864097');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_SUCCEEDED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682',NULL,NULL,NULL,'b86117aa-f153-4976-acac-70239111d534','2026-09-08 13:19:43.857333','2026-09-08 13:19:43.857333');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_FAILED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682','Invalid credentials',NULL,NULL,'80098145-9e33-4bac-ba11-e11501405e98','2026-09-08 13:21:42.546095','2026-09-08 13:21:42.546095');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_FAILED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682','Invalid credentials',NULL,NULL,'a6ac8d4f-ba32-4ebf-ac4e-f90c35b5b854','2026-09-08 13:22:12.603875','2026-09-08 13:22:12.603875');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_SUCCEEDED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682',NULL,NULL,NULL,'bf5cfab0-dfa5-4624-9abb-8bf5393b2149','2026-09-08 13:27:13.346148','2026-09-08 13:27:13.346148');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_FAILED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682','Invalid credentials',NULL,NULL,'0f714c3f-2cac-4281-92fe-b3a3d5647cb3','2026-09-08 13:28:06.841249','2026-09-08 13:28:06.841249');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_FAILED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682','Invalid credentials',NULL,NULL,'69890dc4-0039-45be-b140-e35cf4cf4104','2026-09-08 13:28:17.987032','2026-09-08 13:28:17.987032');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_FAILED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682','Invalid credentials',NULL,NULL,'7f877323-71df-43e6-abb1-6eca2699f1d6','2026-09-08 13:28:29.973897','2026-09-08 13:28:29.973897');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_SUCCEEDED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682',NULL,NULL,NULL,'589fd1f7-5745-46f9-ac9b-84663b874229','2026-09-08 13:29:20.316088','2026-09-08 13:29:20.316088');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_FAILED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682','Invalid credentials',NULL,NULL,'d9d9ca23-7df2-4c34-b737-9c38812d344f','2026-09-08 13:30:13.441735','2026-09-08 13:30:13.441735');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_SUCCEEDED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682',NULL,NULL,NULL,'64d994c2-a249-4dc0-a1ce-5844321eb6b5','2026-09-08 13:30:22.699547','2026-09-08 13:30:22.699547');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','DOCUMENT_UPLOADED','DOCUMENT','3a9a3060-1833-4031-af0b-efc16a9b3fba',NULL,NULL,NULL,'68627fc9-c98b-44bf-85f2-cd977a739cbf','2026-09-08 13:31:22.990966','2026-09-08 13:31:22.990966');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','eda6e8e4-6ce2-4b6f-80e1-b17af5a844dd',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','5a01e1f9-f03a-41c8-959b-d5611d09bca4','2026-09-08 13:39:13.131069','2026-09-08 13:39:13.131069');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','4aa3a8b0-b8ce-4778-9415-55e7626c0cd2',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','3374cfbf-6132-4b3c-a0d5-cb3a7dbb29ff','2026-09-08 13:39:14.555345','2026-09-08 13:39:14.555345');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','e74a0e4b-f6b6-47bf-9134-05c06384f114',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','926f4ec5-8053-4061-af23-5d65fa04cef7','2026-09-08 13:39:15.474753','2026-09-08 13:39:15.474753');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','dd9d5a1e-13fa-4ec3-9770-f4fef2a35c81',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','bacd7a87-00b8-4c5c-9ff4-b97219db4dfe','2026-09-08 13:39:15.676742','2026-09-08 13:39:15.676742');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','009655da-e195-4b39-b7bb-9f710349d549',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','eed2188c-a5ee-4a80-9397-35ad09b6a1b1','2026-09-08 13:39:15.854597','2026-09-08 13:39:15.854597');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','bde88167-2c7f-45d7-b613-07bfa013a503',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','d2a4bf65-f22b-4578-8644-647b606cbe7b','2026-09-08 13:39:16.030291','2026-09-08 13:39:16.030291');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','7f1b5691-bcc0-43a5-83cc-d313c21fe1a7',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','54006394-e863-48cc-813e-a7aab865a20a','2026-09-08 13:39:16.214827','2026-09-08 13:39:16.214827');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','8f5f2a7d-24fa-4233-9ffc-0acf68a0eadf',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','50b49a9c-b4a9-4240-a638-a8b0eeeb683e','2026-09-08 13:39:16.388323','2026-09-08 13:39:16.388323');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','17caa617-b83b-4815-925f-5b983d6d5657',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','4c087f86-b4e7-42f3-ad89-fa659501163b','2026-09-08 13:39:16.584651','2026-09-08 13:39:16.584651');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','778edad3-5e72-43aa-8760-ec1f5936a650',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','e3f8f0d8-4e9d-41f1-acd8-e67ba5844060','2026-09-08 13:39:16.756263','2026-09-08 13:39:16.756263');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','366e32ff-99a3-49b1-8c7b-a3cfe7574c50',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','66fe7cfa-5f9d-40c2-9e8a-9e69f8052df1','2026-09-08 13:39:16.946755','2026-09-08 13:39:16.946755');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','5f5cd77c-61f1-4289-8745-31711f042aca',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','9f5f995c-7597-4172-91ca-38e40ed7ef9a','2026-09-08 13:39:17.122011','2026-09-08 13:39:17.122011');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','2f7cd7d3-2cfe-43b9-897a-ad54bd2115b9',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','547274f1-ae7d-4055-a11f-8ee8763224a6','2026-09-08 13:39:17.306672','2026-09-08 13:39:17.306672');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','c3525936-f477-40d1-a392-4e17042582e5',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','7ee3c33b-1c22-495b-9331-744bb46b13f8','2026-09-08 13:39:17.480583','2026-09-08 13:39:17.480583');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','56cd5349-1d9e-45f6-b3f8-10baa199b95c',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','eac4233e-0277-4b4a-b4a9-1b3bf163991e','2026-09-08 13:39:17.668418','2026-09-08 13:39:17.668418');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','744e0430-7be3-44dc-8c13-6b4d8c52d8a8',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','7d22e2c6-79a1-48e3-9ef6-38ad0c557767','2026-09-08 13:39:17.848659','2026-09-08 13:39:17.848659');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','f9f77b7e-e034-4721-96cf-de4b3d6e68e4',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','ef2740c4-3a37-401e-9851-e853d87d306c','2026-09-08 13:39:18.034391','2026-09-08 13:39:18.034391');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','d2179386-57b6-46ac-b8be-241d3e608a13',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','bd7444c0-7812-4321-a2fe-a1ff55aae60d','2026-09-08 13:39:18.203956','2026-09-08 13:39:18.203956');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','de8f7fbf-3a85-4798-8d68-77b60ab87856',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','be79fe96-1831-4161-9436-c0eab856308b','2026-09-08 13:39:18.394982','2026-09-08 13:39:18.394982');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','a9526b76-9226-4c9d-8f63-9aec16477757',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','d256069a-4522-435e-b9e3-f5f864b9cf5d','2026-09-08 13:39:18.580329','2026-09-08 13:39:18.580329');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','ccb50763-67b5-4f64-b4d9-0713d9f574f2',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','90f01b67-5eca-4460-9aa2-af7b58f0e5ba','2026-09-08 13:39:18.766536','2026-09-08 13:39:18.766536');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','edcd6d7e-06ae-4e1d-8740-9616422c29d3',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','b98c1c47-a5fd-4bd7-9b8a-99af5c7a205f','2026-09-08 13:39:19.708853','2026-09-08 13:39:19.708853');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','333766f4-e97b-4be6-b7fc-8c2b91243851',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','ca72a3de-430e-49be-9b8a-e0d509de13df','2026-09-08 13:39:22.184958','2026-09-08 13:39:22.184958');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','8c8e3d4f-529e-4f3c-abef-11ef8a84e119',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','6d1200ff-c820-4058-85ce-dbca642d73f6','2026-09-08 13:39:23.148838','2026-09-08 13:39:23.148838');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','7d4cce07-910b-4cc4-9bdb-a80a71ea2134',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','68a9ce80-bd4a-4306-8ebe-3ec85d504e74','2026-09-08 13:39:24.427259','2026-09-08 13:39:24.427259');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','255b27b7-290b-4310-83f5-ef8a0bac4af0',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','0dd278be-9bdc-4b29-9e1a-c71fde768346','2026-09-08 13:39:25.266401','2026-09-08 13:39:25.266401');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','df6ed179-1230-4218-a709-3e9e837dee13',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','c067558c-5195-4bc7-99ee-9172c2b8a72a','2026-09-08 13:39:25.904924','2026-09-08 13:39:25.904924');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','644ec1dd-eae6-4e92-b8a1-2f18c9875bf6',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','f26c01dd-cef1-44ad-85c6-8318a4a7b818','2026-09-08 13:39:26.593159','2026-09-08 13:39:26.593159');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','217d296d-0fe5-4087-b83b-27afa43e7c14',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','0d02edc9-be07-4e3d-b79b-c38615b44179','2026-09-08 13:39:27.060992','2026-09-08 13:39:27.060992');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_SUCCEEDED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682',NULL,NULL,NULL,'24df0923-fa72-40a0-b2b1-13db65435991','2026-09-08 14:28:23.717579','2026-09-08 14:28:23.717579');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_FAILED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682','Invalid credentials',NULL,NULL,'8f43ad62-f6c8-4a00-bee4-b1a2756c7ca7','2026-09-08 14:32:22.137891','2026-09-08 14:32:22.137891');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_SUCCEEDED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682',NULL,NULL,NULL,'7ab7c26b-ab85-4035-947b-dfa5fba131c7','2026-09-08 14:32:47.809078','2026-09-08 14:32:47.809078');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_SUCCEEDED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682',NULL,NULL,NULL,'848942c6-4a67-486c-9936-0c2f668a943f','2026-09-08 14:54:16.188207','2026-09-08 14:54:16.188207');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','CASE_CREATED','CASE','bb81dd11-6802-433b-aad3-25b0c205854f',NULL,NULL,NULL,'2bd46a6f-fc22-44ab-bb5c-92f92edeb9e2','2026-09-08 14:54:16.213582','2026-09-08 14:54:16.213582');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','DELETE_CASE','CASE','bb81dd11-6802-433b-aad3-25b0c205854f',NULL,'{"case_number": "CASE-TEST-DEL", "title": "Test Deletion"}',NULL,'6308fcb0-f5d1-45ce-a3ba-a2ee00f0f361','2026-09-08 14:54:16.229149','2026-09-08 14:54:16.229149');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_SUCCEEDED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682',NULL,NULL,NULL,'19d9df04-b7a6-4a58-b19d-1314f6c7c64a','2026-09-08 14:55:09.000435','2026-09-08 14:55:09.000435');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','CASE_CREATED','CASE','0db6bf64-fc65-4915-8f6a-22b7023f3a9d',NULL,NULL,NULL,'ed746f03-76dc-4c66-941f-12b65bacdb64','2026-09-08 14:55:09.024500','2026-09-08 14:55:09.024500');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','DELETE_CASE','CASE','0db6bf64-fc65-4915-8f6a-22b7023f3a9d',NULL,'{"case_number": "CASE-BY-NUM", "title": "Test Deletion by Num"}',NULL,'94c7aadf-d9c8-438b-94c6-e8e3cebc6ae1','2026-09-08 14:55:09.040161','2026-09-08 14:55:09.040161');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','LOGIN_SUCCEEDED','USER','51ff496f-8926-4cf1-a7ba-8eefbec78682',NULL,NULL,NULL,'d75568ab-eb96-42cf-a3da-1146ecea0609','2026-09-08 14:56:34.066778','2026-09-08 14:56:34.066778');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','DELETE_CASE','CASE','fdb9e3b1-5a66-40e0-81e8-5feeca57551d',NULL,'{"case_number": "CASE-2024-SYN-959", "title": "test"}',NULL,'49afb79a-3f6c-488a-97b2-5c1c35589f4d','2026-09-08 14:56:40.193313','2026-09-08 14:56:40.193313');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','DELETE_CASE','CASE','20954795-4841-4c25-8700-91cbbb48875e',NULL,'{"case_number": "CASE-2024-SYN-185", "title": "test"}',NULL,'96b0ac44-7c8c-49bd-ac0d-3216755d0eeb','2026-09-08 14:56:43.094004','2026-09-08 14:56:43.094004');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','DELETE_CASE','CASE','a90b929a-ec83-4aa6-88f8-cc3141238917',NULL,'{"case_number": "CASE-2024-SYN-758", "title": "test2"}',NULL,'eff4aac0-b537-4f2b-8d97-4a14eb95055f','2026-09-08 14:56:45.148128','2026-09-08 14:56:45.148128');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','CASE_CREATED','CASE','d88febd7-d396-4885-ba2a-a21b61915ba0',NULL,NULL,NULL,'3cb56093-54c1-4a2e-aa2c-14bc45c58f18','2026-09-08 15:01:10.045186','2026-09-08 15:01:10.045186');
INSERT INTO "audit_logs" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','DOCUMENT_UPLOADED','DOCUMENT','aaca2601-1434-4bec-b4d8-e0375396357d',NULL,NULL,NULL,'d408ed94-cf10-426d-8475-11b831a7a24b','2026-09-08 15:01:10.080124','2026-09-08 15:01:10.080124');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','3af48ca3-1e20-4875-bc3d-0f8f93a54e36',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','46e0d45c-76a0-4f27-a60b-bde47b432f0b','2026-09-08 15:04:59.728269','2026-09-08 15:04:59.728269');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','a27aeddb-d1a0-45f3-8173-9fd5ff3d0642',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','a04f2c7f-1962-4705-b9f7-f85a5174c5f8','2026-09-08 15:05:00.337490','2026-09-08 15:05:00.337490');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','cab73cc2-8393-4e5e-8eb5-ffd0fc509cde',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','12b2d2e5-cbca-46c6-80e2-a5d33f65b96b','2026-09-08 15:05:00.544320','2026-09-08 15:05:00.544320');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','e4c6f2eb-3ce2-4429-ad14-606453d45adc',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','679e27bf-235c-4b94-a394-61829bf6183d','2026-09-08 15:05:00.690344','2026-09-08 15:05:00.690344');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','4d4545c1-1e52-425e-af91-e1aa8d4c60d7',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','65972a69-78ce-4238-b2af-b302a14830b8','2026-09-08 15:05:00.867054','2026-09-08 15:05:00.867054');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','bd8a2012-47d7-43d7-8c8e-688c67f2f774',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','df22741f-0153-4747-8e4c-7f4ebcabe6ae','2026-09-08 15:05:01.044054','2026-09-08 15:05:01.044054');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','12ea7a6f-c4b7-433a-8813-bd4480b18ad4',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','ca1572b2-442e-4bb7-9f31-3a5c48eb34d1','2026-09-08 15:05:01.190178','2026-09-08 15:05:01.190178');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','ad1296f0-525e-45a0-ab39-dccc950e70e6',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','2ae97e7d-c626-4143-be6a-170945f6e04a','2026-09-08 15:05:01.374921','2026-09-08 15:05:01.374921');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','f441a884-f3cc-489a-9174-c974b16cefba',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','45346f00-dd92-42e6-997c-e00b3dfb22cc','2026-09-08 15:05:01.531054','2026-09-08 15:05:01.531054');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','422bd32a-75b2-4d72-b898-ecbbf04d982b',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','af00e198-f458-4498-bd35-faa18e167a0a','2026-09-08 15:05:01.707889','2026-09-08 15:05:01.707889');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','435dbf8f-ab74-4468-bf04-2996e948c081',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','0400df7b-efd1-4335-9e90-df283f8ed3eb','2026-09-08 15:05:01.867542','2026-09-08 15:05:01.867542');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','b3176c2b-656c-4e5a-a912-277876ab7c2f',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','23feb49d-2626-4217-8397-509ede52d9a7','2026-09-08 15:05:02.359795','2026-09-08 15:05:02.359795');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','2d169a5a-a63c-482e-8090-c83585cde709',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','786cef1f-a102-477b-bb1f-2d9683ff3976','2026-09-08 15:06:04.900634','2026-09-08 15:06:04.900634');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','b074d4c8-c960-43e0-8a27-68c81b81eba2',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','6946026a-340c-4853-892c-52283ccb8a4c','2026-09-08 15:06:05.078986','2026-09-08 15:06:05.078986');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','d68cd1f4-c0d8-46f6-af86-6387c66b5026',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','c7452321-5d01-49ec-ba35-ec42538f174f','2026-09-08 15:06:05.863180','2026-09-08 15:06:05.863180');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','ffab1862-c317-4c7d-9a0f-e568c9671e2a',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','2df2a180-cdda-4b83-b349-6af25fd31e1d','2026-09-08 15:06:17.910097','2026-09-08 15:06:17.910097');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','f685119a-a696-4ecb-b825-4ba7bf185158',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','4c404ac3-3393-4c9e-b83e-2f691125f4cd','2026-09-08 15:06:18.427780','2026-09-08 15:06:18.427780');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','27e36fc2-97e3-415d-870f-eaab22bd5bc1',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','e6384b79-8ba8-44ff-8c68-73c3a690fb2b','2026-09-08 15:06:19.523657','2026-09-08 15:06:19.523657');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','447db4bc-1dfd-4aca-a995-37694c7cdd8e',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','1da3e322-dd4b-4cd9-a84f-6e89b6d950ed','2026-09-08 15:06:19.677532','2026-09-08 15:06:19.677532');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','71113a35-df94-4437-909a-33047dda6279',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','9f5025fb-4dfb-4ba3-9844-989507473556','2026-09-08 15:06:19.855511','2026-09-08 15:06:19.855511');
INSERT INTO "audit_logs" VALUES('demo_investigator','REVIEW_ENTITY','ENTITY','c20914cf-3ea7-4e03-af19-2546f0b197d6',NULL,NULL,'{"verification_status": "ACCEPTED", "status": "ACCEPTED", "corrected_value": null, "rationale": null}','c5710cf5-7d3e-46e1-812b-1b9b9cea31dd','2026-09-08 15:06:20.317625','2026-09-08 15:06:20.317625');
CREATE TABLE case_access (
	user_id VARCHAR(36) NOT NULL, 
	case_id VARCHAR(36) NOT NULL, 
	access_level VARCHAR(50) NOT NULL, 
	assigned_by_user_id VARCHAR(36), 
	assigned_at DATETIME NOT NULL, 
	revoked_at DATETIME, 
	is_active BOOLEAN NOT NULL, 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id), 
	FOREIGN KEY(assigned_by_user_id) REFERENCES users (id)
);
INSERT INTO "case_access" VALUES('290afe3c-9ba0-4cb5-a92a-b252536a308f','16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','MANAGE','290afe3c-9ba0-4cb5-a92a-b252536a308f','2026-09-06 17:33:31.605743',NULL,1,'c132911c-4d29-4624-8950-39c92f3d3ad2','2026-09-06 17:33:31.605743','2026-09-06 17:33:31.605743');
INSERT INTO "case_access" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','MANAGE','290afe3c-9ba0-4cb5-a92a-b252536a308f','2026-09-06 17:33:31.605743',NULL,1,'2b1077f6-903a-4dc4-b463-eab113364b4c','2026-09-06 17:33:31.605743','2026-09-06 17:33:31.605743');
INSERT INTO "case_access" VALUES('102bded1-cbb2-48c1-a8d5-03559afa5ffa','16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','ANALYZE','290afe3c-9ba0-4cb5-a92a-b252536a308f','2026-09-06 17:33:31.605743',NULL,1,'2e50e71d-c2cd-4984-b75c-90379da40065','2026-09-06 17:33:31.605743','2026-09-06 17:33:31.605743');
INSERT INTO "case_access" VALUES('ec148f44-2f1a-4f64-89cd-049de6c842db','16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','REVIEW','290afe3c-9ba0-4cb5-a92a-b252536a308f','2026-09-06 17:33:31.605743',NULL,1,'3e612c4c-b2bc-44b7-b687-370b7c6ed7c4','2026-09-06 17:33:31.605743','2026-09-06 17:33:31.605743');
INSERT INTO "case_access" VALUES('51ff496f-8926-4cf1-a7ba-8eefbec78682','d88febd7-d396-4885-ba2a-a21b61915ba0','MANAGE','51ff496f-8926-4cf1-a7ba-8eefbec78682','2026-09-08 15:01:10.046197',NULL,1,'f96ec0a1-f893-4e3f-a44b-32a354f36f48','2026-09-08 15:01:10.046197','2026-09-08 15:01:10.046197');
CREATE TABLE case_feature_vectors (
	case_id VARCHAR(36) NOT NULL, 
	feature_names JSON NOT NULL, 
	feature_values JSON NOT NULL, 
	feature_version VARCHAR(50) NOT NULL, 
	analysis_run_id VARCHAR(100) NOT NULL, 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id) ON DELETE CASCADE
);
INSERT INTO "case_feature_vectors" VALUES('16d5cee3-d1c4-4ff8-b9d2-8fd31932453f','["node_count", "edge_count", "graph_density", "connected_component_count", "community_count", "largest_community_size", "average_degree", "maximum_degree", "average_betweenness", "maximum_betweenness", "bridge_candidate_count", "person_count", "phone_count", "vehicle_count", "location_count", "organization_count", "bank_account_count", "event_count", "call_count", "transaction_count", "location_visit_count", "shared_phone_count", "shared_vehicle_count", "cross_case_relationship_count", "event_span_hours", "average_event_gap_hours", "rapid_transaction_chain_count", "repeated_location_window_count", "cross_case_connector_count", "shared_phone_pattern_count", "shared_vehicle_pattern_count", "repeated_location_pattern_count", "bridge_pattern_count", "high_connectivity_pattern_count"]','[5.0, 4.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 2.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]','1.0.0','996db252-03b2-4d7c-96fb-e514cc230bca','a21aaf6e-54a7-4ac8-8d77-847be72680b4','2026-09-05 16:39:35.946874','2026-09-05 16:39:35.946874');
CREATE TABLE case_graph_analytics (
	case_id VARCHAR(36) NOT NULL, 
	node_count INTEGER NOT NULL, 
	edge_count INTEGER NOT NULL, 
	community_count INTEGER NOT NULL, 
	density FLOAT NOT NULL, 
	algorithm_version VARCHAR(50) NOT NULL, 
	analytics_engine VARCHAR(50) NOT NULL, 
	analysis_run_id VARCHAR(100) NOT NULL, 
	status VARCHAR(50) NOT NULL, 
	truncated BOOLEAN NOT NULL, 
	warnings JSON, 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id) ON DELETE CASCADE
);
CREATE TABLE cases (
	case_number VARCHAR(100) NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	description TEXT, 
	status VARCHAR(50) NOT NULL, 
	priority VARCHAR(50) NOT NULL, 
	created_by VARCHAR(36), 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (case_number), 
	FOREIGN KEY(created_by) REFERENCES users (id)
);
INSERT INTO "cases" VALUES('CASE-2024-SYN-001','[DEMO] Synthetic Syndicate Operations','Synthetic case regarding fictional smuggling operations.','ACTIVE','HIGH','290afe3c-9ba0-4cb5-a92a-b252536a308f','16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','2026-09-06 17:33:31.601608','2026-09-06 17:33:31.601608');
INSERT INTO "cases" VALUES('CASE-2024-SYN-922','test1','','ACTIVE','HIGH','51ff496f-8926-4cf1-a7ba-8eefbec78682','d88febd7-d396-4885-ba2a-a21b61915ba0','2026-09-08 15:01:10.044168','2026-09-08 15:01:10.044168');
CREATE TABLE documents (
	case_id VARCHAR(36) NOT NULL, 
	file_name VARCHAR(255) NOT NULL, 
	file_type VARCHAR(50) NOT NULL, 
	file_hash VARCHAR(64), 
	raw_content TEXT, 
	status VARCHAR(50) NOT NULL, 
	uploaded_by VARCHAR(36), 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, file_path VARCHAR(1024), mime_type VARCHAR(100), error_message TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id) ON DELETE CASCADE, 
	FOREIGN KEY(uploaded_by) REFERENCES users (id)
);
INSERT INTO "documents" VALUES('16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','synthetic_intelligence_briefing.txt','TEXT_REPORT',NULL,'Intercepted communication indicates John Doe (555-0199) and Jane Smith coordinate logistics via Frontway Logistics at Warehouse 4. Mike Johnson operates Black SUV and visits Warehouse 4.','PROCESSED','290afe3c-9ba0-4cb5-a92a-b252536a308f','doc-1','2026-09-06 17:33:31.603196','2026-09-06 17:33:31.603196',NULL,NULL,NULL);
INSERT INTO "documents" VALUES('d88febd7-d396-4885-ba2a-a21b61915ba0','FIRST_INFORMATION_REPORT_&_SURVEILLANCE_LOG.txt','TEXT_REPORT','8ddcc5dcaca03ea8e57c41016403ed2f1f8def3824fe20554956aa0641cede73','Case Reference: CASE-2024-SYN-GOLD-901
Date of Incident: 18 February 2024
Investigating Unit: Economic Offences Wing, Mumbai
Investigating Officer: Senior Inspector K. Deshmukh

INCIDENT NARRATIVE:
On 18 February 2024, at approximately 16:45 hours, subject Sameer Khan was observed arriving at the registered office of Zenith Bullion Logistics in Andheri East, Mumbai. 

Sameer Khan met with operations manager Pooja Verma inside the facility. Following the meeting, Sameer Khan authorized an RTGS electronic transfer of INR 12,50,000 from Zenith Bullion Logistics corporate account (ACCT-5566778899) to an account held by associate Tariq Sheikh (ACCT-1122334455) at Indus National Bank.

At 18:20 hours, Sameer Khan departed the premises driving a silver Mahindra Scorpio with registration number MH-02-CD-4567 towards Bandra Kurla Complex. 

Call Detail Records (CDR) indicate that during transit, Sameer Khan used mobile number +91-98200-11223 to make four encrypted phone calls to Tariq Sheikh at mobile number +91-98200-99887. 

Surveillance confirms all subjects are operating under synthetic evaluation parameters.','PROCESSED','51ff496f-8926-4cf1-a7ba-8eefbec78682','aaca2601-1434-4bec-b4d8-e0375396357d','2026-09-08 15:01:10.076612','2026-09-08 15:01:13.477177','data\uploads\d88febd7-d396-4885-ba2a-a21b61915ba0\8ddcc5dcaca03ea8e57c41016403ed2f1f8def3824fe20554956aa0641cede73_FIRST_INFORMATION_REPORT_&_SURVEILLANCE_LOG.txt','text/plain',NULL);
CREATE TABLE entity_graph_features (
	entity_id VARCHAR(100) NOT NULL, 
	case_id VARCHAR(36) NOT NULL, 
	entity_type VARCHAR(50) NOT NULL, 
	degree INTEGER NOT NULL, 
	in_degree INTEGER, 
	out_degree INTEGER, 
	case_count INTEGER NOT NULL, 
	unique_neighbour_count INTEGER NOT NULL, 
	shared_location_count INTEGER NOT NULL, 
	shared_phone_count INTEGER NOT NULL, 
	shared_vehicle_count INTEGER NOT NULL, 
	transaction_count INTEGER NOT NULL, 
	transaction_total FLOAT NOT NULL, 
	transaction_chain_count INTEGER NOT NULL, 
	community_id VARCHAR(100), 
	community_size INTEGER NOT NULL, 
	pagerank_score FLOAT NOT NULL, 
	betweenness_score FLOAT NOT NULL, 
	bridge_score FLOAT NOT NULL, 
	historical_similarity_score FLOAT, 
	algorithm_version VARCHAR(50) NOT NULL, 
	analytics_engine VARCHAR(50) NOT NULL, 
	analysis_run_id VARCHAR(100) NOT NULL, 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id) ON DELETE CASCADE
);
CREATE TABLE "extracted_entities" (
	extraction_run_id VARCHAR(64), 
	case_id VARCHAR(36) NOT NULL, 
	document_id VARCHAR(36), 
	entity_type VARCHAR(50) NOT NULL, 
	original_value VARCHAR(255), 
	canonical_name VARCHAR(255) NOT NULL, 
	source_text TEXT, 
	start_offset INTEGER, 
	end_offset INTEGER, 
	attributes TEXT, 
	confidence_score NUMERIC(3, 2), 
	verification_status VARCHAR(50) NOT NULL, 
	extraction_provider VARCHAR(100), 
	extraction_version VARCHAR(50), 
	reviewer_identity VARCHAR(100), 
	review_rationale TEXT, 
	source_record_type VARCHAR(50), 
	source_record_id VARCHAR(100), 
	graph_sync_status VARCHAR(50) NOT NULL, 
	graph_sync_error TEXT, 
	graph_synced_at DATETIME, 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(document_id) REFERENCES documents (id) ON DELETE SET NULL, 
	FOREIGN KEY(case_id) REFERENCES cases (id) ON DELETE CASCADE
);
INSERT INTO "extracted_entities" VALUES(NULL,'16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','PERSON','John Doe','John Doe',NULL,NULL,NULL,NULL,0.95,'ACCEPTED',NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'8361f10f-b192-470e-8f91-ebe3aa6c691b','2026-09-06 17:33:31.609303','2026-09-06 17:33:31.609303');
INSERT INTO "extracted_entities" VALUES(NULL,'16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','PERSON','Jane Smith','Jane Smith',NULL,NULL,NULL,NULL,0.92,'ACCEPTED',NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'16e0197c-0f8c-4dd1-9cc6-a5c1bc86c83f','2026-09-06 17:33:31.609303','2026-09-06 17:33:31.609303');
INSERT INTO "extracted_entities" VALUES(NULL,'16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','LOCATION','123 Fake Street, Springfield','123 Fake Street, Springfield',NULL,NULL,NULL,NULL,0.88,'ACCEPTED',NULL,NULL,'demo_investigator',NULL,NULL,NULL,'PENDING',NULL,NULL,'1d718832-a9b2-42b8-9b4c-2a1ab911ba67','2026-09-06 17:33:31.609303','2026-09-06 17:37:50.545054');
INSERT INTO "extracted_entities" VALUES(NULL,'16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','PHONE','555-0199','555-0199',NULL,NULL,NULL,NULL,0.99,'ACCEPTED',NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'30a86f97-2ebe-41ed-b1ed-fff134aea61f','2026-09-06 17:33:31.609303','2026-09-06 17:33:31.609303');
INSERT INTO "extracted_entities" VALUES(NULL,'16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','ORGANIZATION','Frontway Logistics','Frontway Logistics',NULL,NULL,NULL,NULL,0.85,'ACCEPTED',NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'8f80bdfd-b1fb-4f15-974b-730d663b65e7','2026-09-06 17:33:31.609303','2026-09-06 17:33:31.609303');
INSERT INTO "extracted_entities" VALUES(NULL,'16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','PERSON','Mike Johnson','Mike Johnson',NULL,NULL,NULL,NULL,0.82,'UNREVIEWED',NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'9bc307d2-2cbf-417d-b83c-af57e0e8e2e7','2026-09-06 17:33:31.609303','2026-09-06 17:33:31.609303');
INSERT INTO "extracted_entities" VALUES(NULL,'16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','VEHICLE','Black SUV','Black SUV',NULL,NULL,NULL,NULL,0.78,'UNREVIEWED',NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'0713c8a8-8e6a-4f89-8f43-78cef3439728','2026-09-06 17:33:31.609303','2026-09-06 17:33:31.609303');
INSERT INTO "extracted_entities" VALUES(NULL,'16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','PHONE','555-0200','555-0200',NULL,NULL,NULL,NULL,0.81,'UNREVIEWED',NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'d09076a7-4088-4466-b642-e294d22f9a89','2026-09-06 17:33:31.609822','2026-09-06 17:33:31.609822');
INSERT INTO "extracted_entities" VALUES(NULL,'16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','LOCATION','Warehouse 4','Warehouse 4',NULL,NULL,NULL,NULL,0.89,'UNREVIEWED',NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'c51aa53a-5c4a-4942-96e8-bfc2a85ddc02','2026-09-06 17:33:31.609822','2026-09-06 17:33:31.609822');
INSERT INTO "extracted_entities" VALUES(NULL,'16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','BANK_ACCOUNT','ACCT-9988','ACCT-9988',NULL,NULL,NULL,NULL,0.74,'UNREVIEWED',NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'a3e35dc4-66be-46e1-9ea9-365cee7fa6e5','2026-09-06 17:33:31.609822','2026-09-06 17:33:31.609822');
INSERT INTO "extracted_entities" VALUES(NULL,'16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','PERSON','Aditya Malhotra','Aditya Malhotra',NULL,NULL,NULL,NULL,0.96,'ACCEPTED',NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'6f53958b-e4eb-486a-af2a-d56e2208056b','2026-09-06 17:33:31.609822','2026-09-06 17:33:31.609822');
INSERT INTO "extracted_entities" VALUES(NULL,'16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','PERSON','Priya Sharma','Priya Sharma',NULL,NULL,NULL,NULL,0.93,'ACCEPTED',NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'819dc88f-3cf9-4e4d-a405-33f20336e36f','2026-09-06 17:33:31.609822','2026-09-06 17:33:31.609822');
INSERT INTO "extracted_entities" VALUES(NULL,'16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','ORGANIZATION','Apex Traders','Apex Traders',NULL,NULL,NULL,NULL,0.9,'ACCEPTED',NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'3bd1aa60-4712-4d9b-8dd7-d086cc0bf183','2026-09-06 17:33:31.609822','2026-09-06 17:33:31.609822');
INSERT INTO "extracted_entities" VALUES(NULL,'16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','PHONE','+91 98765 43210','+91 98765 43210',NULL,NULL,NULL,NULL,0.98,'ACCEPTED',NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'e8d4cbc2-5be4-4cfc-87b1-f803be8a55a7','2026-09-06 17:33:31.609822','2026-09-06 17:33:31.609822');
INSERT INTO "extracted_entities" VALUES('6101006ff74b11f71071e2416a7ef68d3c6707335c748bf4f02efb28aac28f7b','16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','PERSON','John Doe','John Doe','John Doe',36,44,'{"resolution": {"has_match": true, "existing_entity_id": "8361f10f-b192-470e-8f91-ebe3aa6c691b", "match_score": 1.0, "match_reasons": ["Exact canonical_name match"], "requires_human_review": false}}',0.9,'UNREVIEWED','MOCK_EXTRACTOR','1.0.0',NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'8b91f0a6-88fe-488d-b9a2-a7b0a7bd7533','2026-09-06 17:37:56.187458','2026-09-06 17:37:56.187458');
INSERT INTO "extracted_entities" VALUES('6101006ff74b11f71071e2416a7ef68d3c6707335c748bf4f02efb28aac28f7b','16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','PERSON','Jane Smith','Jane Smith','Jane Smith',60,70,'{"resolution": {"has_match": true, "existing_entity_id": "16e0197c-0f8c-4dd1-9cc6-a5c1bc86c83f", "match_score": 1.0, "match_reasons": ["Exact canonical_name match"], "requires_human_review": false}}',0.9,'UNREVIEWED','MOCK_EXTRACTOR','1.0.0',NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'b8e8cd40-32d6-4f5a-ace5-13a1b9e52d9e','2026-09-06 17:37:56.187458','2026-09-06 17:37:56.187458');
INSERT INTO "extracted_entities" VALUES('6101006ff74b11f71071e2416a7ef68d3c6707335c748bf4f02efb28aac28f7b','16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','PERSON','Frontway Logistics','Frontway Logistics','Frontway Logistics',96,114,'{"resolution": {"has_match": false, "existing_entity_id": null, "match_score": 0.0, "match_reasons": [], "requires_human_review": false}}',0.9,'UNREVIEWED','MOCK_EXTRACTOR','1.0.0',NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'203b9fab-b141-46af-ac40-30fd748c35b1','2026-09-06 17:37:56.187458','2026-09-06 17:37:56.187458');
INSERT INTO "extracted_entities" VALUES('6101006ff74b11f71071e2416a7ef68d3c6707335c748bf4f02efb28aac28f7b','16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','PERSON','Mike Johnson','Mike Johnson','Mike Johnson',131,143,'{"resolution": {"has_match": true, "existing_entity_id": "9bc307d2-2cbf-417d-b83c-af57e0e8e2e7", "match_score": 1.0, "match_reasons": ["Exact canonical_name match"], "requires_human_review": false}}',0.9,'UNREVIEWED','MOCK_EXTRACTOR','1.0.0',NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'c4e315c4-4dfa-4934-bedd-2fa00c2f3188','2026-09-06 17:37:56.187458','2026-09-06 17:37:56.187458');
INSERT INTO "extracted_entities" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','PHONE_NUMBER','5566778899','5566778899','5566778899',589,599,'{"resolution": {"has_match": false, "existing_entity_id": null, "match_score": 0.0, "match_reasons": [], "requires_human_review": false}}',0.88,'ACCEPTED','hybrid_nlp_engine','1.0','demo_investigator',NULL,NULL,NULL,'RETRYABLE_FAILURE','Neo4j Offline',NULL,'3af48ca3-1e20-4875-bc3d-0f8f93a54e36','2026-09-08 15:01:13.449223','2026-09-08 15:04:59.734961');
INSERT INTO "extracted_entities" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','PHONE_NUMBER','1122334455','1122334455','1122334455',652,662,'{"resolution": {"has_match": false, "existing_entity_id": null, "match_score": 0.0, "match_reasons": [], "requires_human_review": false}}',0.88,'ACCEPTED','hybrid_nlp_engine','1.0','demo_investigator',NULL,NULL,NULL,'RETRYABLE_FAILURE','Neo4j Offline',NULL,'a27aeddb-d1a0-45f3-8173-9fd5ff3d0642','2026-09-08 15:01:13.451324','2026-09-08 15:05:00.342109');
INSERT INTO "extracted_entities" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','VEHICLE','MH-02-CD-4567','MH-02-CD-4567','MH-02-CD-4567',798,811,'{"resolution": {"has_match": false, "existing_entity_id": null, "match_score": 0.0, "match_reasons": [], "requires_human_review": false}}',0.88,'ACCEPTED','hybrid_nlp_engine','1.0','demo_investigator',NULL,NULL,NULL,'RETRYABLE_FAILURE','Neo4j Offline',NULL,'cab73cc2-8393-4e5e-8eb5-ffd0fc509cde','2026-09-08 15:01:13.451324','2026-09-08 15:05:00.549940');
INSERT INTO "extracted_entities" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','MONEY','INR 12,50,000','INR 12,50,000','INR 12,50,000',521,534,'{"resolution": {"has_match": false, "existing_entity_id": null, "match_score": 0.0, "match_reasons": [], "requires_human_review": false}}',0.88,'ACCEPTED','hybrid_nlp_engine','1.0','demo_investigator',NULL,NULL,NULL,'RETRYABLE_FAILURE','Neo4j Offline',NULL,'e4c6f2eb-3ce2-4429-ad14-606453d45adc','2026-09-08 15:01:13.452381','2026-09-08 15:05:00.695647');
INSERT INTO "extracted_entities" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','ORGANIZATION','Zenith Bullion Logistics','Zenith Bullion Logistics','Zenith Bullion Logistics',319,343,'{"resolution": {"has_match": false, "existing_entity_id": null, "match_score": 0.0, "match_reasons": [], "requires_human_review": false}}',0.88,'ACCEPTED','hybrid_nlp_engine','1.0','demo_investigator',NULL,NULL,NULL,'RETRYABLE_FAILURE','Neo4j Offline',NULL,'4d4545c1-1e52-425e-af91-e1aa8d4c60d7','2026-09-08 15:01:13.452381','2026-09-08 15:05:00.873996');
INSERT INTO "extracted_entities" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','ORGANIZATION','Zenith Bullion Logistics','Zenith Bullion Logistics','Zenith Bullion Logistics',540,564,'{"resolution": {"has_match": true, "existing_entity_id": "4d4545c1-1e52-425e-af91-e1aa8d4c60d7", "match_score": 1.0, "match_reasons": ["Exact canonical_name match"], "requires_human_review": false}}',0.88,'ACCEPTED','hybrid_nlp_engine','1.0','demo_investigator',NULL,NULL,NULL,'RETRYABLE_FAILURE','Neo4j Offline',NULL,'bd8a2012-47d7-43d7-8c8e-688c67f2f774','2026-09-08 15:01:13.453491','2026-09-08 15:05:01.048646');
INSERT INTO "extracted_entities" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','ORGANIZATION','Indus National Bank','Indus National Bank','Indus National Bank',667,686,'{"resolution": {"has_match": false, "existing_entity_id": null, "match_score": 0.0, "match_reasons": [], "requires_human_review": false}}',0.88,'ACCEPTED','hybrid_nlp_engine','1.0','demo_investigator',NULL,NULL,NULL,'RETRYABLE_FAILURE','Neo4j Offline',NULL,'12ea7a6f-c4b7-433a-8813-bd4480b18ad4','2026-09-08 15:01:13.453491','2026-09-08 15:05:01.195854');
INSERT INTO "extracted_entities" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','PERSON','Economic Offences','Economic Offences','Economic Offences',94,111,'{"resolution": {"has_match": false, "existing_entity_id": null, "match_score": 0.0, "match_reasons": [], "requires_human_review": false}}',0.88,'ACCEPTED','hybrid_nlp_engine','1.0','demo_investigator',NULL,NULL,NULL,'RETRYABLE_FAILURE','Neo4j Offline',NULL,'ad1296f0-525e-45a0-ab39-dccc950e70e6','2026-09-08 15:01:13.454577','2026-09-08 15:05:01.380609');
INSERT INTO "extracted_entities" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','PERSON','Senior Inspector','Senior Inspector','Senior Inspector',148,164,'{"resolution": {"has_match": false, "existing_entity_id": null, "match_score": 0.0, "match_reasons": [], "requires_human_review": false}}',0.88,'ACCEPTED','hybrid_nlp_engine','1.0','demo_investigator',NULL,NULL,NULL,'RETRYABLE_FAILURE','Neo4j Offline',NULL,'f441a884-f3cc-489a-9174-c974b16cefba','2026-09-08 15:01:13.454577','2026-09-08 15:05:01.537433');
INSERT INTO "extracted_entities" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','PERSON','Sameer Khan','Sameer Khan','Sameer Khan',257,268,'{"resolution": {"has_match": false, "existing_entity_id": null, "match_score": 0.0, "match_reasons": [], "requires_human_review": false}}',0.88,'ACCEPTED','hybrid_nlp_engine','1.0','demo_investigator',NULL,NULL,NULL,'RETRYABLE_FAILURE','Neo4j Offline',NULL,'422bd32a-75b2-4d72-b898-ecbbf04d982b','2026-09-08 15:01:13.455681','2026-09-08 15:05:01.712546');
INSERT INTO "extracted_entities" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','PERSON','Andheri East','Andheri East','Andheri East',347,359,'{"resolution": {"has_match": false, "existing_entity_id": null, "match_score": 0.0, "match_reasons": [], "requires_human_review": false}}',0.88,'ACCEPTED','hybrid_nlp_engine','1.0','demo_investigator',NULL,NULL,NULL,'RETRYABLE_FAILURE','Neo4j Offline',NULL,'435dbf8f-ab74-4468-bf04-2996e948c081','2026-09-08 15:01:13.455681','2026-09-08 15:05:01.873768');
INSERT INTO "extracted_entities" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','PERSON','Sameer Khan','Sameer Khan','Sameer Khan',371,382,'{"resolution": {"has_match": true, "existing_entity_id": "422bd32a-75b2-4d72-b898-ecbbf04d982b", "match_score": 1.0, "match_reasons": ["Exact canonical_name match"], "requires_human_review": false}}',0.88,'ACCEPTED','hybrid_nlp_engine','1.0','demo_investigator',NULL,NULL,NULL,'RETRYABLE_FAILURE','Neo4j Offline',NULL,'b3176c2b-656c-4e5a-a912-277876ab7c2f','2026-09-08 15:01:13.456705','2026-09-08 15:05:02.364426');
INSERT INTO "extracted_entities" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','PERSON','Pooja Verma','Pooja Verma','Pooja Verma',411,422,'{"resolution": {"has_match": false, "existing_entity_id": null, "match_score": 0.0, "match_reasons": [], "requires_human_review": false}}',0.88,'ACCEPTED','hybrid_nlp_engine','1.0','demo_investigator',NULL,NULL,NULL,'RETRYABLE_FAILURE','Neo4j Offline',NULL,'2d169a5a-a63c-482e-8090-c83585cde709','2026-09-08 15:01:13.456705','2026-09-08 15:06:04.908535');
INSERT INTO "extracted_entities" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','PERSON','Sameer Khan','Sameer Khan','Sameer Khan',467,478,'{"resolution": {"has_match": true, "existing_entity_id": "422bd32a-75b2-4d72-b898-ecbbf04d982b", "match_score": 1.0, "match_reasons": ["Exact canonical_name match"], "requires_human_review": true}}',0.88,'ACCEPTED','hybrid_nlp_engine','1.0','demo_investigator',NULL,NULL,NULL,'RETRYABLE_FAILURE','Neo4j Offline',NULL,'b074d4c8-c960-43e0-8a27-68c81b81eba2','2026-09-08 15:01:13.458207','2026-09-08 15:06:05.084284');
INSERT INTO "extracted_entities" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','PERSON','Tariq Sheikh','Tariq Sheikh','Tariq Sheikh',633,645,'{"resolution": {"has_match": false, "existing_entity_id": null, "match_score": 0.0, "match_reasons": [], "requires_human_review": false}}',0.88,'ACCEPTED','hybrid_nlp_engine','1.0','demo_investigator',NULL,NULL,NULL,'RETRYABLE_FAILURE','Neo4j Offline',NULL,'d68cd1f4-c0d8-46f6-af86-6387c66b5026','2026-09-08 15:01:13.459499','2026-09-08 15:06:05.869978');
INSERT INTO "extracted_entities" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','PERSON','Sameer Khan','Sameer Khan','Sameer Khan',705,716,'{"resolution": {"has_match": true, "existing_entity_id": "422bd32a-75b2-4d72-b898-ecbbf04d982b", "match_score": 1.0, "match_reasons": ["Exact canonical_name match"], "requires_human_review": true}}',0.88,'ACCEPTED','hybrid_nlp_engine','1.0','demo_investigator',NULL,NULL,NULL,'RETRYABLE_FAILURE','Neo4j Offline',NULL,'ffab1862-c317-4c7d-9a0f-e568c9671e2a','2026-09-08 15:01:13.460003','2026-09-08 15:06:17.916381');
INSERT INTO "extracted_entities" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','PERSON','Mahindra Scorpio','Mahindra Scorpio','Mahindra Scorpio',756,772,'{"resolution": {"has_match": false, "existing_entity_id": null, "match_score": 0.0, "match_reasons": [], "requires_human_review": false}}',0.88,'ACCEPTED','hybrid_nlp_engine','1.0','demo_investigator',NULL,NULL,NULL,'RETRYABLE_FAILURE','Neo4j Offline',NULL,'f685119a-a696-4ecb-b825-4ba7bf185158','2026-09-08 15:01:13.460003','2026-09-08 15:06:18.433498');
INSERT INTO "extracted_entities" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','PERSON','Bandra Kurla','Bandra Kurla','Bandra Kurla',820,832,'{"resolution": {"has_match": false, "existing_entity_id": null, "match_score": 0.0, "match_reasons": [], "requires_human_review": false}}',0.88,'ACCEPTED','hybrid_nlp_engine','1.0','demo_investigator',NULL,NULL,NULL,'RETRYABLE_FAILURE','Neo4j Offline',NULL,'27e36fc2-97e3-415d-870f-eaab22bd5bc1','2026-09-08 15:01:13.461016','2026-09-08 15:06:19.528398');
INSERT INTO "extracted_entities" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','PERSON','Call Detail','Call Detail','Call Detail',844,855,'{"resolution": {"has_match": false, "existing_entity_id": null, "match_score": 0.0, "match_reasons": [], "requires_human_review": false}}',0.88,'ACCEPTED','hybrid_nlp_engine','1.0','demo_investigator',NULL,NULL,NULL,'RETRYABLE_FAILURE','Neo4j Offline',NULL,'447db4bc-1dfd-4aca-a995-37694c7cdd8e','2026-09-08 15:01:13.461016','2026-09-08 15:06:19.682183');
INSERT INTO "extracted_entities" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','PERSON','Sameer Khan','Sameer Khan','Sameer Khan',900,911,'{"resolution": {"has_match": true, "existing_entity_id": "422bd32a-75b2-4d72-b898-ecbbf04d982b", "match_score": 1.0, "match_reasons": ["Exact canonical_name match"], "requires_human_review": true}}',0.88,'ACCEPTED','hybrid_nlp_engine','1.0','demo_investigator',NULL,NULL,NULL,'RETRYABLE_FAILURE','Neo4j Offline',NULL,'71113a35-df94-4437-909a-33047dda6279','2026-09-08 15:01:13.462020','2026-09-08 15:06:19.861696');
INSERT INTO "extracted_entities" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','PERSON','Tariq Sheikh','Tariq Sheikh','Tariq Sheikh',985,997,'{"resolution": {"has_match": true, "existing_entity_id": "d68cd1f4-c0d8-46f6-af86-6387c66b5026", "match_score": 1.0, "match_reasons": ["Exact canonical_name match"], "requires_human_review": false}}',0.88,'ACCEPTED','hybrid_nlp_engine','1.0','demo_investigator',NULL,NULL,NULL,'RETRYABLE_FAILURE','Neo4j Offline',NULL,'c20914cf-3ea7-4e03-af19-2546f0b197d6','2026-09-08 15:01:13.463129','2026-09-08 15:06:20.322312');
CREATE TABLE "extracted_relationships" (
	extraction_run_id VARCHAR(64), 
	case_id VARCHAR(36) NOT NULL, 
	document_id VARCHAR(36), 
	source_entity_id VARCHAR(36) NOT NULL, 
	target_entity_id VARCHAR(36) NOT NULL, 
	relation_type VARCHAR(100) NOT NULL, 
	source_text_snippet TEXT, 
	start_offset INTEGER, 
	end_offset INTEGER, 
	event_timestamp DATETIME, 
	attributes TEXT, 
	confidence_score NUMERIC(3, 2), 
	verification_status VARCHAR(50) NOT NULL, 
	extraction_provider VARCHAR(100), 
	extraction_version VARCHAR(50), 
	relationship_rule_version VARCHAR(50), 
	reviewer_identity VARCHAR(100), 
	review_rationale TEXT, 
	verified_by VARCHAR(36), 
	verified_at DATETIME, 
	source_record_type VARCHAR(50), 
	source_record_id VARCHAR(100), 
	graph_sync_status VARCHAR(50) NOT NULL, 
	graph_sync_error TEXT, 
	graph_synced_at DATETIME, 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(source_entity_id) REFERENCES extracted_entities (id) ON DELETE CASCADE, 
	FOREIGN KEY(case_id) REFERENCES cases (id) ON DELETE CASCADE, 
	FOREIGN KEY(verified_by) REFERENCES users (id), 
	FOREIGN KEY(document_id) REFERENCES documents (id) ON DELETE SET NULL, 
	FOREIGN KEY(target_entity_id) REFERENCES extracted_entities (id) ON DELETE CASCADE
);
INSERT INTO "extracted_relationships" VALUES(NULL,'16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','8361f10f-b192-470e-8f91-ebe3aa6c691b','30a86f97-2ebe-41ed-b1ed-fff134aea61f','COMMUNICATED_WITH','John Doe was seen using phone number 555-0199.',NULL,NULL,NULL,NULL,0.91,'ACCEPTED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'f2d6d4ad-f022-4b5b-a912-3f8d3cb4528d','2026-09-06 17:33:31.610834','2026-09-06 17:33:31.610834');
INSERT INTO "extracted_relationships" VALUES(NULL,'16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','16e0197c-0f8c-4dd1-9cc6-a5c1bc86c83f','8f80bdfd-b1fb-4f15-974b-730d663b65e7','OWNS','Records indicate Jane Smith owns Frontway Logistics.',NULL,NULL,NULL,NULL,0.89,'ACCEPTED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'c595b5b4-15f3-4597-b233-6145aa28c11b','2026-09-06 17:33:31.610834','2026-09-06 17:33:31.610834');
INSERT INTO "extracted_relationships" VALUES(NULL,'16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','8361f10f-b192-470e-8f91-ebe3aa6c691b','1d718832-a9b2-42b8-9b4c-2a1ab911ba67','RESIDES_AT','John Doe might reside at 123 Fake Street, Springfield.',NULL,NULL,NULL,NULL,0.75,'ACCEPTED',NULL,NULL,NULL,'demo_investigator',NULL,'demo_investigator',NULL,NULL,NULL,'PENDING',NULL,NULL,'ac82db22-0cfc-4d79-8492-cf6043eb2512','2026-09-06 17:33:31.610834','2026-09-06 17:37:47.953707');
INSERT INTO "extracted_relationships" VALUES(NULL,'16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','8361f10f-b192-470e-8f91-ebe3aa6c691b','16e0197c-0f8c-4dd1-9cc6-a5c1bc86c83f','KNOWS','A rumor suggested John knows Jane.',NULL,NULL,NULL,NULL,0.4,'REJECTED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'1b86bc3a-64b5-4903-9435-6a44e51a93a5','2026-09-06 17:33:31.611340','2026-09-06 17:33:31.611340');
INSERT INTO "extracted_relationships" VALUES(NULL,'16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','9bc307d2-2cbf-417d-b83c-af57e0e8e2e7','8f80bdfd-b1fb-4f15-974b-730d663b65e7','EMPLOYED_BY','Mike Johnson works at Frontway Logistics.',NULL,NULL,NULL,NULL,0.79,'ACCEPTED',NULL,NULL,NULL,'demo_investigator',NULL,'demo_investigator',NULL,NULL,NULL,'PENDING',NULL,NULL,'8da9e043-1a9d-47f8-ae1b-83c527eb1ca8','2026-09-06 17:33:31.611340','2026-09-06 17:37:52.042787');
INSERT INTO "extracted_relationships" VALUES(NULL,'16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','9bc307d2-2cbf-417d-b83c-af57e0e8e2e7','0713c8a8-8e6a-4f89-8f43-78cef3439728','DRIVES','Mike Johnson was seen driving a Black SUV.',NULL,NULL,NULL,NULL,0.82,'REJECTED',NULL,NULL,NULL,'demo_investigator',NULL,'demo_investigator',NULL,NULL,NULL,'PENDING',NULL,NULL,'e45b8160-7661-498c-a303-bfbe4f7e4bcc','2026-09-06 17:33:31.611340','2026-09-06 17:38:17.710950');
INSERT INTO "extracted_relationships" VALUES(NULL,'16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','9bc307d2-2cbf-417d-b83c-af57e0e8e2e7','c51aa53a-5c4a-4942-96e8-bfc2a85ddc02','VISITED','Mike Johnson frequently visits Warehouse 4.',NULL,NULL,NULL,NULL,0.75,'ACCEPTED',NULL,NULL,NULL,'demo_investigator',NULL,'demo_investigator',NULL,NULL,NULL,'PENDING',NULL,NULL,'c909a91c-60b5-4af9-85ee-5dd6479f521d','2026-09-06 17:33:31.611340','2026-09-06 17:38:18.984919');
INSERT INTO "extracted_relationships" VALUES(NULL,'16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','8f80bdfd-b1fb-4f15-974b-730d663b65e7','a3e35dc4-66be-46e1-9ea9-365cee7fa6e5','HAS_ACCOUNT','Funds were wired to ACCT-9988 belonging to Frontway.',NULL,NULL,NULL,NULL,0.85,'UNREVIEWED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'d28108b6-f97f-4e37-8e3a-e301cd450854','2026-09-06 17:33:31.611340','2026-09-06 17:33:31.611340');
INSERT INTO "extracted_relationships" VALUES(NULL,'16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','6f53958b-e4eb-486a-af2a-d56e2208056b','3bd1aa60-4712-4d9b-8dd7-d086cc0bf183','ASSOCIATED_WITH','Aditya Malhotra is associated with Apex Traders.',NULL,NULL,NULL,NULL,0.93,'ACCEPTED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'d6eed0a8-b4c8-4aea-81c3-7aac0b0c2ee8','2026-09-06 17:33:31.611340','2026-09-06 17:33:31.611340');
INSERT INTO "extracted_relationships" VALUES(NULL,'16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','doc-1','819dc88f-3cf9-4e4d-a405-33f20336e36f','e8d4cbc2-5be4-4cfc-87b1-f803be8a55a7','COMMUNICATED_WITH','Priya Sharma communicated via +91 98765 43210.',NULL,NULL,NULL,NULL,0.94,'ACCEPTED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'c5f569bd-9363-4542-b5d2-325427714f83','2026-09-06 17:33:31.611340','2026-09-06 17:33:31.611340');
INSERT INTO "extracted_relationships" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','422bd32a-75b2-4d72-b898-ecbbf04d982b','4d4545c1-1e52-425e-af91-e1aa8d4c60d7','EMPLOYED_BY','On 18 February 2024, at approximately 16:45 hours, subject Sameer Khan was observed arriving at the registered office of Zenith Bullion Logistics in Andheri East, Mumbai',NULL,NULL,NULL,NULL,0.8,'UNREVIEWED','hybrid_nlp_engine',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'4dd1a508-ab29-4d1c-bb81-19f82c192360','2026-09-08 15:01:13.471085','2026-09-08 15:01:13.471085');
INSERT INTO "extracted_relationships" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','435dbf8f-ab74-4468-bf04-2996e948c081','4d4545c1-1e52-425e-af91-e1aa8d4c60d7','EMPLOYED_BY','On 18 February 2024, at approximately 16:45 hours, subject Sameer Khan was observed arriving at the registered office of Zenith Bullion Logistics in Andheri East, Mumbai',NULL,NULL,NULL,NULL,0.8,'UNREVIEWED','hybrid_nlp_engine',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'5e4b3dc0-f12e-4b15-b8ac-4aa44c6cab2d','2026-09-08 15:01:13.471085','2026-09-08 15:01:13.471085');
INSERT INTO "extracted_relationships" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','b3176c2b-656c-4e5a-a912-277876ab7c2f','4d4545c1-1e52-425e-af91-e1aa8d4c60d7','EMPLOYED_BY','On 18 February 2024, at approximately 16:45 hours, subject Sameer Khan was observed arriving at the registered office of Zenith Bullion Logistics in Andheri East, Mumbai',NULL,NULL,NULL,NULL,0.8,'UNREVIEWED','hybrid_nlp_engine',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'77d2f32d-e442-4ab7-8ce8-7397b003466c','2026-09-08 15:01:13.471085','2026-09-08 15:01:13.471085');
INSERT INTO "extracted_relationships" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','422bd32a-75b2-4d72-b898-ecbbf04d982b','bd8a2012-47d7-43d7-8c8e-688c67f2f774','EMPLOYED_BY','On 18 February 2024, at approximately 16:45 hours, subject Sameer Khan was observed arriving at the registered office of Zenith Bullion Logistics in Andheri East, Mumbai',NULL,NULL,NULL,NULL,0.8,'UNREVIEWED','hybrid_nlp_engine',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'a15c3736-2b29-4248-ab29-755b078753ff','2026-09-08 15:01:13.471085','2026-09-08 15:01:13.471085');
INSERT INTO "extracted_relationships" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','435dbf8f-ab74-4468-bf04-2996e948c081','bd8a2012-47d7-43d7-8c8e-688c67f2f774','EMPLOYED_BY','On 18 February 2024, at approximately 16:45 hours, subject Sameer Khan was observed arriving at the registered office of Zenith Bullion Logistics in Andheri East, Mumbai',NULL,NULL,NULL,NULL,0.8,'UNREVIEWED','hybrid_nlp_engine',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'c671db89-3898-41ae-a51f-f845dbd3bf52','2026-09-08 15:01:13.471085','2026-09-08 15:01:13.471085');
INSERT INTO "extracted_relationships" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','b3176c2b-656c-4e5a-a912-277876ab7c2f','bd8a2012-47d7-43d7-8c8e-688c67f2f774','EMPLOYED_BY','On 18 February 2024, at approximately 16:45 hours, subject Sameer Khan was observed arriving at the registered office of Zenith Bullion Logistics in Andheri East, Mumbai',NULL,NULL,NULL,NULL,0.8,'UNREVIEWED','hybrid_nlp_engine',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'f09eba10-23bc-4b55-8000-fb29c940a7fb','2026-09-08 15:01:13.471085','2026-09-08 15:01:13.471085');
INSERT INTO "extracted_relationships" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','422bd32a-75b2-4d72-b898-ecbbf04d982b','3af48ca3-1e20-4875-bc3d-0f8f93a54e36','COMMUNICATED_WITH','Following the meeting, Sameer Khan authorized an RTGS electronic transfer of INR 12,50,000 from Zenith Bullion Logistics corporate account (ACCT-5566778899) to an account held by associate Tariq Sheikh (ACCT-1122334455) at Indus National Bank',NULL,NULL,NULL,NULL,0.8,'UNREVIEWED','hybrid_nlp_engine',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'1cdd2715-8a13-4742-bf69-af28b3f5fc73','2026-09-08 15:01:13.471085','2026-09-08 15:01:13.471085');
INSERT INTO "extracted_relationships" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','b3176c2b-656c-4e5a-a912-277876ab7c2f','3af48ca3-1e20-4875-bc3d-0f8f93a54e36','COMMUNICATED_WITH','Following the meeting, Sameer Khan authorized an RTGS electronic transfer of INR 12,50,000 from Zenith Bullion Logistics corporate account (ACCT-5566778899) to an account held by associate Tariq Sheikh (ACCT-1122334455) at Indus National Bank',NULL,NULL,NULL,NULL,0.8,'UNREVIEWED','hybrid_nlp_engine',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'a869d7f0-7a80-4dd0-a093-18f155e8daf2','2026-09-08 15:01:13.471085','2026-09-08 15:01:13.471085');
INSERT INTO "extracted_relationships" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','b074d4c8-c960-43e0-8a27-68c81b81eba2','3af48ca3-1e20-4875-bc3d-0f8f93a54e36','COMMUNICATED_WITH','Following the meeting, Sameer Khan authorized an RTGS electronic transfer of INR 12,50,000 from Zenith Bullion Logistics corporate account (ACCT-5566778899) to an account held by associate Tariq Sheikh (ACCT-1122334455) at Indus National Bank',NULL,NULL,NULL,NULL,0.8,'UNREVIEWED','hybrid_nlp_engine',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'1e42f07a-577f-440a-821e-320f6769ef63','2026-09-08 15:01:13.471085','2026-09-08 15:01:13.471085');
INSERT INTO "extracted_relationships" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','b074d4c8-c960-43e0-8a27-68c81b81eba2','a27aeddb-d1a0-45f3-8173-9fd5ff3d0642','COMMUNICATED_WITH','Following the meeting, Sameer Khan authorized an RTGS electronic transfer of INR 12,50,000 from Zenith Bullion Logistics corporate account (ACCT-5566778899) to an account held by associate Tariq Sheikh (ACCT-1122334455) at Indus National Bank',NULL,NULL,NULL,NULL,0.8,'UNREVIEWED','hybrid_nlp_engine',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'d5a9e4c4-442c-4542-ac84-90ab8266fb9e','2026-09-08 15:01:13.471085','2026-09-08 15:01:13.471085');
INSERT INTO "extracted_relationships" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','d68cd1f4-c0d8-46f6-af86-6387c66b5026','a27aeddb-d1a0-45f3-8173-9fd5ff3d0642','COMMUNICATED_WITH','Following the meeting, Sameer Khan authorized an RTGS electronic transfer of INR 12,50,000 from Zenith Bullion Logistics corporate account (ACCT-5566778899) to an account held by associate Tariq Sheikh (ACCT-1122334455) at Indus National Bank',NULL,NULL,NULL,NULL,0.8,'UNREVIEWED','hybrid_nlp_engine',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'4856333c-2c6b-4aaa-b28a-66ff9d37d9b5','2026-09-08 15:01:13.471085','2026-09-08 15:01:13.471085');
INSERT INTO "extracted_relationships" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','ffab1862-c317-4c7d-9a0f-e568c9671e2a','a27aeddb-d1a0-45f3-8173-9fd5ff3d0642','COMMUNICATED_WITH','Following the meeting, Sameer Khan authorized an RTGS electronic transfer of INR 12,50,000 from Zenith Bullion Logistics corporate account (ACCT-5566778899) to an account held by associate Tariq Sheikh (ACCT-1122334455) at Indus National Bank',NULL,NULL,NULL,NULL,0.8,'UNREVIEWED','hybrid_nlp_engine',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'d02da030-9f44-443d-b781-dbad0e9217fa','2026-09-08 15:01:13.471085','2026-09-08 15:01:13.471085');
INSERT INTO "extracted_relationships" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','b074d4c8-c960-43e0-8a27-68c81b81eba2','12ea7a6f-c4b7-433a-8813-bd4480b18ad4','EMPLOYED_BY','Following the meeting, Sameer Khan authorized an RTGS electronic transfer of INR 12,50,000 from Zenith Bullion Logistics corporate account (ACCT-5566778899) to an account held by associate Tariq Sheikh (ACCT-1122334455) at Indus National Bank',NULL,NULL,NULL,NULL,0.8,'UNREVIEWED','hybrid_nlp_engine',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'3a376c86-ea34-4d9e-8efc-87422da19580','2026-09-08 15:01:13.471085','2026-09-08 15:01:13.471085');
INSERT INTO "extracted_relationships" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','d68cd1f4-c0d8-46f6-af86-6387c66b5026','12ea7a6f-c4b7-433a-8813-bd4480b18ad4','EMPLOYED_BY','Following the meeting, Sameer Khan authorized an RTGS electronic transfer of INR 12,50,000 from Zenith Bullion Logistics corporate account (ACCT-5566778899) to an account held by associate Tariq Sheikh (ACCT-1122334455) at Indus National Bank',NULL,NULL,NULL,NULL,0.8,'UNREVIEWED','hybrid_nlp_engine',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'9b76b495-e7a4-48dd-80d0-244d4c6101f0','2026-09-08 15:01:13.471085','2026-09-08 15:01:13.471085');
INSERT INTO "extracted_relationships" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','ffab1862-c317-4c7d-9a0f-e568c9671e2a','12ea7a6f-c4b7-433a-8813-bd4480b18ad4','EMPLOYED_BY','Following the meeting, Sameer Khan authorized an RTGS electronic transfer of INR 12,50,000 from Zenith Bullion Logistics corporate account (ACCT-5566778899) to an account held by associate Tariq Sheikh (ACCT-1122334455) at Indus National Bank',NULL,NULL,NULL,NULL,0.8,'UNREVIEWED','hybrid_nlp_engine',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'dea7dc63-4219-4065-a13f-b47600c64e18','2026-09-08 15:01:13.471085','2026-09-08 15:01:13.471085');
INSERT INTO "extracted_relationships" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','ffab1862-c317-4c7d-9a0f-e568c9671e2a','cab73cc2-8393-4e5e-8eb5-ffd0fc509cde','DRIVES','At 18:20 hours, Sameer Khan departed the premises driving a silver Mahindra Scorpio with registration number MH-02-CD-4567 towards Bandra Kurla Complex',NULL,NULL,NULL,NULL,0.8,'UNREVIEWED','hybrid_nlp_engine',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'ff684f23-4fb2-4fa2-a380-9bf98e2b50a4','2026-09-08 15:01:13.471085','2026-09-08 15:01:13.471085');
INSERT INTO "extracted_relationships" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','f685119a-a696-4ecb-b825-4ba7bf185158','cab73cc2-8393-4e5e-8eb5-ffd0fc509cde','DRIVES','At 18:20 hours, Sameer Khan departed the premises driving a silver Mahindra Scorpio with registration number MH-02-CD-4567 towards Bandra Kurla Complex',NULL,NULL,NULL,NULL,0.8,'UNREVIEWED','hybrid_nlp_engine',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'38da71b6-375f-441b-a4e6-db3c7f7ac6fa','2026-09-08 15:01:13.471085','2026-09-08 15:01:13.471085');
INSERT INTO "extracted_relationships" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','d88febd7-d396-4885-ba2a-a21b61915ba0','aaca2601-1434-4bec-b4d8-e0375396357d','27e36fc2-97e3-415d-870f-eaab22bd5bc1','cab73cc2-8393-4e5e-8eb5-ffd0fc509cde','DRIVES','At 18:20 hours, Sameer Khan departed the premises driving a silver Mahindra Scorpio with registration number MH-02-CD-4567 towards Bandra Kurla Complex',NULL,NULL,NULL,NULL,0.8,'UNREVIEWED','hybrid_nlp_engine',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'PENDING',NULL,NULL,'2ecdd245-2874-476c-a627-1ae2998523d4','2026-09-08 15:01:13.471085','2026-09-08 15:01:13.471085');
CREATE TABLE extraction_models (
	model_id VARCHAR(100) NOT NULL, 
	provider VARCHAR(50) NOT NULL, 
	model_type VARCHAR(50) NOT NULL, 
	model_version VARCHAR(100) NOT NULL, 
	dataset_version VARCHAR(100) NOT NULL, 
	extraction_version VARCHAR(50) NOT NULL, 
	label_schema_version VARCHAR(50) NOT NULL, 
	artifact_storage_key VARCHAR(500), 
	artifact_filename VARCHAR(255), 
	sha256_checksum VARCHAR(64), 
	python_version VARCHAR(50), 
	spacy_version VARCHAR(50), 
	training_config JSON, 
	train_document_ids JSON, 
	validation_document_ids JSON, 
	test_document_ids JSON, 
	label_distribution JSON, 
	training_metrics JSON, 
	test_metrics JSON, 
	status VARCHAR(50) NOT NULL, 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id)
);
CREATE TABLE extraction_runs (
	extraction_run_id VARCHAR(64) NOT NULL, 
	document_id VARCHAR(36) NOT NULL, 
	case_id VARCHAR(36) NOT NULL, 
	provider VARCHAR(100) NOT NULL, 
	provider_version VARCHAR(50) NOT NULL, 
	model_version VARCHAR(50) NOT NULL, 
	extraction_version VARCHAR(50) NOT NULL, 
	post_processing_version VARCHAR(50) NOT NULL, 
	relationship_rule_version VARCHAR(50) NOT NULL, 
	dataset_version VARCHAR(50), 
	status VARCHAR(50) NOT NULL, 
	entity_candidate_count INTEGER NOT NULL, 
	relationship_candidate_count INTEGER NOT NULL, 
	accepted_candidate_count INTEGER NOT NULL, 
	rejected_candidate_count INTEGER NOT NULL, 
	warning_count INTEGER NOT NULL, 
	warnings TEXT, 
	started_at DATETIME, 
	completed_at DATETIME, 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_extraction_run_identity UNIQUE (document_id, provider, provider_version, model_version, extraction_version, post_processing_version, relationship_rule_version), 
	FOREIGN KEY(document_id) REFERENCES documents (id) ON DELETE CASCADE, 
	FOREIGN KEY(case_id) REFERENCES cases (id) ON DELETE CASCADE
);
INSERT INTO "extraction_runs" VALUES('6101006ff74b11f71071e2416a7ef68d3c6707335c748bf4f02efb28aac28f7b','doc-1','16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','MOCK_EXTRACTOR','1.0.0','1.0.0','1.0.0','1.0.0','1.0.0',NULL,'COMPLETED',4,0,0,0,0,NULL,'2026-09-06 17:37:56.180779','2026-09-06 17:37:56.187458','73089f29-b05e-4731-b57f-86b0c8ec714f','2026-09-06 17:37:56.181796','2026-09-06 17:37:56.187458');
INSERT INTO "extraction_runs" VALUES('c03f13004920dc8ee1aced287a9dfbb42cc1ad031a992126100632c2de667dd8','aaca2601-1434-4bec-b4d8-e0375396357d','d88febd7-d396-4885-ba2a-a21b61915ba0','MOCK_EXTRACTOR','1.0.0','1.0.0','1.0.0','1.0.0','1.0.0',NULL,'COMPLETED',21,18,0,0,0,NULL,'2026-09-08 15:01:12.418893','2026-09-08 15:01:13.468548','5a409e3b-3b08-4390-9c7b-16ec58477cc1','2026-09-08 15:01:12.419900','2026-09-08 15:01:13.470053');
CREATE TABLE investigator_feedback (
	user_id VARCHAR(36) NOT NULL, 
	target_type VARCHAR(50) NOT NULL, 
	target_id VARCHAR(36) NOT NULL, 
	action VARCHAR(50) NOT NULL, 
	rationale TEXT NOT NULL, 
	correction_data TEXT, 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
CREATE TABLE model_artifacts (
	artifact_id VARCHAR(100) NOT NULL, 
	model_type VARCHAR(50) NOT NULL, 
	model_version VARCHAR(100) NOT NULL, 
	dataset_version VARCHAR(100) NOT NULL, 
	feature_version VARCHAR(100) NOT NULL, 
	artifact_filename VARCHAR(255) NOT NULL, 
	storage_key VARCHAR(255) NOT NULL, 
	sha256_checksum VARCHAR(64) NOT NULL, 
	scikit_learn_version VARCHAR(50) NOT NULL, 
	python_version VARCHAR(50) NOT NULL, 
	feature_names JSON, 
	training_case_ids JSON, 
	hyperparameters JSON, 
	metrics JSON, 
	status VARCHAR(50) NOT NULL, 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (storage_key)
);
CREATE TABLE model_predictions (
	case_id VARCHAR(36), 
	entity_id VARCHAR(100), 
	prediction_type VARCHAR(50) NOT NULL, 
	prediction VARCHAR(100) NOT NULL, 
	score FLOAT, 
	explanation TEXT NOT NULL, 
	top_features JSON, 
	model_version VARCHAR(100) NOT NULL, 
	dataset_version VARCHAR(100) NOT NULL, 
	feature_version VARCHAR(50) NOT NULL, 
	analysis_run_id VARCHAR(100) NOT NULL, 
	status VARCHAR(50) NOT NULL, 
	requires_human_verification BOOLEAN NOT NULL, 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id) ON DELETE CASCADE
);
INSERT INTO "model_predictions" VALUES('16d5cee3-d1c4-4ff8-b9a2-bfd31932453f',NULL,'ANOMALY','ANOMALOUS',0.82,'Anomalous sub-graph detected around Frontway Logistics.',NULL,'baseline_anomaly_v1','v1','v1','run-001','OPEN',1,'721bf9c2-cfb8-4554-a25a-5f97bc9a4762','2026-09-06 17:33:31.613043','2026-09-06 17:33:31.613043');
INSERT INTO "model_predictions" VALUES('16d5cee3-d1c4-4ff8-b9a2-bfd31932453f',NULL,'ANOMALY','ANOMALOUS',0.82,'Anomalous sub-graph detected around Frontway Logistics.',NULL,'baseline_anomaly_v1','v1','v1','run-001','OPEN',1,'27fd311c-afb1-4412-a247-d16d8d3fb259','2026-09-07 16:43:43.188149','2026-09-07 16:43:43.188149');
INSERT INTO "model_predictions" VALUES('16d5cee3-d1c4-4ff8-b9a2-bfd31932453f',NULL,'ANOMALY','ANOMALOUS',0.82,'Anomalous sub-graph detected around Frontway Logistics.',NULL,'baseline_anomaly_v1','v1','v1','run-001','OPEN',1,'a7100459-df24-44b0-943c-0a638445a439','2026-09-08 14:23:59.886781','2026-09-08 14:23:59.886781');
INSERT INTO "model_predictions" VALUES('16d5cee3-d1c4-4ff8-b9a2-bfd31932453f',NULL,'ANOMALY','ANOMALOUS',0.82,'Anomalous sub-graph detected around Frontway Logistics.',NULL,'baseline_anomaly_v1','v1','v1','run-001','OPEN',1,'b1cd07e2-57ca-4acd-a0db-6e24ddbd96ee','2026-09-08 14:26:29.643928','2026-09-08 14:26:29.643928');
CREATE TABLE processing_jobs (
	case_id VARCHAR(36) NOT NULL, 
	document_id VARCHAR(36), 
	job_type VARCHAR(100) NOT NULL, 
	status VARCHAR(50) NOT NULL, 
	total_rows INTEGER NOT NULL, 
	processed_rows INTEGER NOT NULL, 
	rejected_rows INTEGER NOT NULL, 
	error_summary TEXT, 
	error_message TEXT, 
	started_at DATETIME, 
	completed_at DATETIME, 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id) ON DELETE CASCADE, 
	FOREIGN KEY(document_id) REFERENCES documents (id) ON DELETE SET NULL
);
CREATE TABLE similarity_results (
	current_case_id VARCHAR(36) NOT NULL, 
	similar_case_id VARCHAR(36) NOT NULL, 
	similarity_score FLOAT NOT NULL, 
	matched_features JSON, 
	differing_features JSON, 
	explanation TEXT NOT NULL, 
	feature_version VARCHAR(50) NOT NULL, 
	analysis_run_id VARCHAR(100) NOT NULL, 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(current_case_id) REFERENCES cases (id) ON DELETE CASCADE, 
	FOREIGN KEY(similar_case_id) REFERENCES cases (id) ON DELETE CASCADE
);
INSERT INTO "similarity_results" VALUES('16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','16d5cee3-d1c4-4ff8-b9a2-bfd31932453f',1.0,NULL,NULL,'Self-similarity baseline check.','v1','run-001','85c20b10-a247-42a7-9857-3fe7f62a371b','2026-09-06 17:33:31.613552','2026-09-06 17:33:31.613552');
INSERT INTO "similarity_results" VALUES('16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','16d5cee3-d1c4-4ff8-b9a2-bfd31932453f',1.0,NULL,NULL,'Self-similarity baseline check.','v1','run-001','04faf0c2-94ef-4cca-b6a3-c2a405b9a379','2026-09-07 16:43:43.188656','2026-09-07 16:43:43.188656');
INSERT INTO "similarity_results" VALUES('16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','16d5cee3-d1c4-4ff8-b9a2-bfd31932453f',1.0,NULL,NULL,'Self-similarity baseline check.','v1','run-001','6d172276-f090-47d8-a229-ee487c845401','2026-09-08 14:23:59.887286','2026-09-08 14:23:59.887286');
INSERT INTO "similarity_results" VALUES('16d5cee3-d1c4-4ff8-b9a2-bfd31932453f','16d5cee3-d1c4-4ff8-b9a2-bfd31932453f',1.0,NULL,NULL,'Self-similarity baseline check.','v1','run-001','376dd77d-0320-453f-9323-163dbb9c887d','2026-09-08 14:26:29.644437','2026-09-08 14:26:29.644437');
CREATE TABLE users (
	username VARCHAR(100) NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	password_hash VARCHAR(255) NOT NULL, 
	role VARCHAR(50) NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	id VARCHAR(36) NOT NULL, 
	created_at DATETIME NOT NULL, 
	updated_at DATETIME NOT NULL, 
	PRIMARY KEY (id), 
	UNIQUE (username), 
	UNIQUE (email)
);
INSERT INTO "users" VALUES('demo_admin','admin@sih.internal','$2b$12$MVsLQlApUx1fATHywzVpGeoCTiP9o1EESi15ov/xEJTVDN7oP7zMO','ADMINISTRATOR',1,'290afe3c-9ba0-4cb5-a92a-b252536a308f','2026-09-06 17:33:31.597798','2026-09-08 14:26:29.630917');
INSERT INTO "users" VALUES('demo_investigator','investigator@sih.internal','$2b$12$MVsLQlApUx1fATHywzVpGeoCTiP9o1EESi15ov/xEJTVDN7oP7zMO','INVESTIGATOR',1,'51ff496f-8926-4cf1-a7ba-8eefbec78682','2026-09-06 17:33:31.598801','2026-09-08 14:26:29.629916');
INSERT INTO "users" VALUES('demo_analyst','analyst@sih.internal','$2b$12$MVsLQlApUx1fATHywzVpGeoCTiP9o1EESi15ov/xEJTVDN7oP7zMO','ANALYST',1,'102bded1-cbb2-48c1-a8d5-03559afa5ffa','2026-09-06 17:33:31.599804','2026-09-08 14:26:29.630917');
INSERT INTO "users" VALUES('demo_reviewer','reviewer@sih.internal','$2b$12$MVsLQlApUx1fATHywzVpGeoCTiP9o1EESi15ov/xEJTVDN7oP7zMO','REVIEWER',1,'ec148f44-2f1a-4f64-89cd-049de6c842db','2026-09-06 17:33:31.599804','2026-09-08 14:26:29.632080');
CREATE INDEX ix_users_username ON users (username);
CREATE INDEX ix_users_email ON users (email);
CREATE INDEX ix_users_role ON users (role);
CREATE INDEX ix_model_artifacts_versions ON model_artifacts (model_version, dataset_version);
CREATE INDEX ix_model_artifacts_status ON model_artifacts (status);
CREATE UNIQUE INDEX ix_model_artifacts_artifact_id ON model_artifacts (artifact_id);
CREATE INDEX ix_extraction_models_provider ON extraction_models (provider);
CREATE UNIQUE INDEX ix_extraction_models_model_id ON extraction_models (model_id);
CREATE INDEX ix_extraction_models_status ON extraction_models (status);
CREATE INDEX ix_audit_logs_target_type ON audit_logs (target_type);
CREATE INDEX ix_audit_logs_action ON audit_logs (action);
CREATE INDEX ix_audit_logs_target_id ON audit_logs (target_id);
CREATE INDEX ix_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX ix_audit_logs_created_at ON audit_logs (created_at);
CREATE INDEX ix_cases_created_at ON cases (created_at);
CREATE INDEX ix_cases_status ON cases (status);
CREATE INDEX ix_cases_case_number ON cases (case_number);
CREATE INDEX ix_cases_created_by ON cases (created_by);
CREATE INDEX ix_investigator_feedback_user_id ON investigator_feedback (user_id);
CREATE INDEX ix_investigator_feedback_action ON investigator_feedback (action);
CREATE INDEX ix_investigator_feedback_target_id ON investigator_feedback (target_id);
CREATE INDEX ix_alerts_created_at ON alerts (created_at);
CREATE INDEX ix_alerts_case_id ON alerts (case_id);
CREATE INDEX ix_alerts_analysis_run_id ON alerts (analysis_run_id);
CREATE INDEX ix_alerts_status ON alerts (status);
CREATE INDEX ix_alerts_alert_type ON alerts (alert_type);
CREATE INDEX ix_alerts_severity ON alerts (severity);
CREATE INDEX ix_documents_case_id ON documents (case_id);
CREATE INDEX ix_documents_created_at ON documents (created_at);
CREATE INDEX ix_documents_file_type ON documents (file_type);
CREATE INDEX ix_documents_status ON documents (status);
CREATE INDEX ix_egf_case_id ON entity_graph_features (case_id);
CREATE INDEX ix_egf_created_at ON entity_graph_features (created_at);
CREATE INDEX ix_egf_entity_id ON entity_graph_features (entity_id);
CREATE INDEX ix_egf_analysis_run_id ON entity_graph_features (analysis_run_id);
CREATE INDEX ix_cga_created_at ON case_graph_analytics (created_at);
CREATE INDEX ix_cga_case_id ON case_graph_analytics (case_id);
CREATE INDEX ix_cga_analysis_run_id ON case_graph_analytics (analysis_run_id);
CREATE INDEX ix_cfv_created_at ON case_feature_vectors (created_at);
CREATE INDEX ix_cfv_case_id ON case_feature_vectors (case_id);
CREATE INDEX ix_cfv_analysis_run_id ON case_feature_vectors (analysis_run_id);
CREATE INDEX ix_cfv_feature_version ON case_feature_vectors (feature_version);
CREATE INDEX ix_mp_entity_id ON model_predictions (entity_id);
CREATE INDEX ix_mp_case_id ON model_predictions (case_id);
CREATE INDEX ix_mp_created_at ON model_predictions (created_at);
CREATE INDEX ix_mp_model_version ON model_predictions (model_version);
CREATE INDEX ix_mp_prediction_type ON model_predictions (prediction_type);
CREATE INDEX ix_sr_created_at ON similarity_results (created_at);
CREATE INDEX ix_sr_current_case_id ON similarity_results (current_case_id);
CREATE INDEX ix_sr_analysis_run_id ON similarity_results (analysis_run_id);
CREATE INDEX ix_sr_similar_case_id ON similarity_results (similar_case_id);
CREATE INDEX ix_case_access_is_active ON case_access (is_active);
CREATE INDEX ix_case_access_user_id ON case_access (user_id);
CREATE INDEX ix_case_access_case_id ON case_access (case_id);
CREATE INDEX ix_extraction_runs_document_id ON extraction_runs (document_id);
CREATE INDEX ix_extraction_runs_case_id ON extraction_runs (case_id);
CREATE INDEX ix_extraction_runs_provider ON extraction_runs (provider);
CREATE INDEX ix_extraction_runs_status ON extraction_runs (status);
CREATE UNIQUE INDEX ix_extraction_runs_extraction_run_id ON extraction_runs (extraction_run_id);
CREATE INDEX ix_processing_jobs_case_id ON processing_jobs (case_id);
CREATE INDEX ix_processing_jobs_created_at ON processing_jobs (created_at);
CREATE INDEX ix_processing_jobs_status ON processing_jobs (status);
CREATE INDEX ix_extracted_entities_entity_type ON extracted_entities (entity_type);
CREATE INDEX ix_extracted_entities_graph_sync ON extracted_entities (graph_sync_status);
CREATE INDEX ix_extracted_entities_verification_status ON extracted_entities (verification_status);
CREATE INDEX ix_extracted_entities_case_id ON extracted_entities (case_id);
CREATE INDEX ix_extracted_entities_source ON extracted_entities (source_record_type, source_record_id);
CREATE INDEX ix_extracted_rel_source ON extracted_relationships (source_record_type, source_record_id);
CREATE INDEX ix_extracted_relationships_relation_type ON extracted_relationships (relation_type);
CREATE INDEX ix_extracted_relationships_target_entity_id ON extracted_relationships (target_entity_id);
CREATE INDEX ix_extracted_relationships_case_id ON extracted_relationships (case_id);
CREATE INDEX ix_extracted_relationships_verification_status ON extracted_relationships (verification_status);
CREATE INDEX ix_extracted_relationships_source_entity_id ON extracted_relationships (source_entity_id);
CREATE INDEX ix_extracted_rel_graph_sync ON extracted_relationships (graph_sync_status);
COMMIT;
