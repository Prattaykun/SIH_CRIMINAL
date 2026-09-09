# NER Label Guide v1

## Purpose and Scope
This guide provides instructions for manual annotators to create a candidate entity extraction dataset for the SIH 26189 AI-Assisted Criminal Network Analysis System. This corpus is synthetic/de-identified, and labels do not establish truth, identity, ownership, intent, guilt, or legal responsibility.

## Labels and Definitions

### 1. PERSON
A named, identifiable individual.
- **Include**: named complainants, witnesses, officers, staff, named callers, named representatives, drivers, and persons appearing in case material.
- **Exclude**: pronouns, generic descriptions such as “the caller,” “the officer,” “two men,” or “unknown person,” unless a name is explicitly written.

### 2. ORGANIZATION
A named company, bank, police unit, court, government/project body, vendor, agency, business, provider, or named institutional entity.
- **Include**: named businesses, payment institutions, police stations, courts, telecom providers, vendors, and project organizations.
- **Exclude**: generic terms such as “company,” “bank,” “police,” “office,” or “authorities” when not a proper name.

### 3. ADDRESS
A specific postal, office, flat, shop, unit, or premises address.
- **Include**: addresses containing premises/unit/flat/house/shop/plot number, building name, street, locality, city, and/or PIN code.
- **Exclude**: broad places without a specific deliverable/premises element.

### 4. LOCATION
A city, locality, neighborhood, broad area, road, landmark, site, facility, station-area, approximate CDR location, warehouse, or general premises reference that is not a full ADDRESS.
- **Include**: examples such as “Bandra Kurla Complex, Mumbai,” “Baner, Pune,” “Uppal municipal storage yard,” and “Crescent Co-Work Hub, Madhapur.”
- **Exclude**: full postal/office addresses; label those as ADDRESS.

### 5. ROLE
A case-relevant role, designation, office title, or relationship role.
- **Include**: examples such as “Director,” “Complainant,” “Witness,” “Investigating Officer,” “Loan Processing Manager,” “Senior HR Partner,” “Chief Financial Officer,” “Driver,” “Registered Owner,” “Project Quality Consultant,” and “Procurement Liaison.”
- **Exclude**: generic incidental occupation text unless it is relevant to the case role.

*(Note: Do not label structured identifiers like CASE_ID, PHONE, AMOUNT, DATE, etc. These are handled by deterministic regex extractors.)*

## Boundary Rules
- Include a person’s full displayed name.
- Do not include titles such as “Mr.”, “Ms.”, “Dr.”, “PSI”, “ACP”, “Inspector”, or “DySP” as part of PERSON unless the title is inseparable in the source; represent titles as ROLE only when they are relevant.
- Keep organization legal suffixes such as Pvt Ltd, LLP, GmbH, Ltd, and Services when present in the entity name.
- For ADDRESS, include the full contiguous address when possible.
- For LOCATION, include the complete meaningful place expression but exclude commas/trailing punctuation unless required inside the name.
- Avoid overlapping spans. If an organization appears inside a longer address, use ADDRESS for the full address in this NER v1 dataset and do not overlap it with ORGANIZATION.

## Ambiguity Rules
- Named office/building/site without a detailed postal address is LOCATION.
- Premises references including unit/flat/house/shop/plot/office number are ADDRESS.
- A claimed name or unverified identity can still be PERSON if it is explicitly named; evidence status is handled later, not by this NER label.
- Do not label “unknown person,” “unknown associates,” generic pronouns, or purely descriptive references as PERSON.

## Annotator Review Checklist
- [ ] Have you verified the exact boundaries of each span to avoid trailing punctuation?
- [ ] Did you properly distinguish between ADDRESS and LOCATION?
- [ ] Are all included titles labeled as ROLE instead of PERSON?
- [ ] Did you avoid overlapping spans?
