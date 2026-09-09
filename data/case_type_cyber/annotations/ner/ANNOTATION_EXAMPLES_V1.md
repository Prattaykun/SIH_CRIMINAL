# NER Annotation Examples v1

These are generic safe examples to guide manual annotation.

**Example 1:**
“Anita Rao stated that she was Director of Nova Trade Solutions Pvt Ltd.”
- Anita Rao → PERSON
- Director → ROLE
- Nova Trade Solutions Pvt Ltd → ORGANIZATION

**Example 2:**
“The office was located at Office No. 12, Galaxy Towers, Central Avenue, Pune – 411001.”
- Office No. 12, Galaxy Towers, Central Avenue, Pune – 411001 → ADDRESS

**Example 3:**
“The meeting took place near Bandra Kurla Complex, Mumbai.”
- Bandra Kurla Complex, Mumbai → LOCATION

**Example 4:**
“Inspector Meera Nair recorded the witness statement.”
- Meera Nair → PERSON
- Inspector → ROLE only if the annotation guide requires the title to be captured separately.
- Do not include “Inspector” in the PERSON span.

**Example 5:**
“The caller requested payment to ACCT-1234567890 through samplepay@upi.”
- No NER v1 labels should be applied to the account or UPI identifier.

**Example 6:**
“An unknown person claiming to be a manager contacted the complainant.”
- Do not label “unknown person.”
- manager can be ROLE only if it is treated as an explicit case-relevant designation under the guide.
