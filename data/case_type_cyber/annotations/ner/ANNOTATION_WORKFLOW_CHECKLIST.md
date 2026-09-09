# Annotation Workflow Checklist

## A. Before annotation
- [ ] Confirm the current Doccano project is Sequence Labeling.
- [ ] Confirm exactly five labels exist: PERSON, ORGANIZATION, ADDRESS, LOCATION, ROLE.
- [ ] Confirm no structured identifier labels were added.
- [ ] Confirm the imported dataset has 106 page-level records.
- [ ] Confirm duplicate case files are excluded.
- [ ] Confirm the annotator has read `NER_LABEL_GUIDE_V1.md`.

## B. Annotation rules
- [ ] Label only explicit named entities and explicit roles.
- [ ] Preserve the exact source span as written.
- [ ] Do not infer names, identities, ownership, intent, guilt, or relationships.
- [ ] Do not label phone numbers, accounts, UPI IDs, dates, amounts, IDs, vehicle plates, or similar structured identifiers.
- [ ] Avoid overlapping annotations.
- [ ] Include full legal suffixes in organization names where present, such as Pvt Ltd, LLP, Ltd, GmbH, Services.
- [ ] Use ADDRESS only for detailed premises/postal addresses.
- [ ] Use LOCATION for a broad area, city, road, landmark, facility, or site without a detailed address.
- [ ] A claimed or unverified name may still be PERSON if explicitly written; it is not verified identity.
- [ ] Do not label generic references such as “the caller,” “unknown person,” “the company,” or “two men.”

## C. Per-page quality check
- [ ] Re-read each annotation after placing it.
- [ ] Check the label type.
- [ ] Check span boundaries.
- [ ] Check that punctuation outside the entity has not been selected.
- [ ] Confirm no entity overlaps another entity.
- [ ] Confirm a structured identifier was not mislabeled.

## D. Per-case quality check
- [ ] Review entity consistency across all pages of the same case.
- [ ] Confirm recurring organization names receive the same label.
- [ ] Confirm named officers, witnesses, complainants, and claimed representatives receive PERSON.
- [ ] Confirm titles/designations receive ROLE rather than being included inside PERSON spans, except where source formatting makes separation impossible.
- [ ] Record uncertainties in Doccano comments/notes if available; do not invent a label.

## E. Export gate
- [ ] Do not export as final training data until every page has been reviewed.
- [ ] Export a small first-case test file first.
- [ ] Validate it with `--dry-run`.
- [ ] Export final data only after all cases are annotated and checked.
- [ ] Never overwrite or create active `doccano_reviewed_export.jsonl` using scripts.
