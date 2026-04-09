# Phase 5: Guest List — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 05-guest-list
**Areas discussed:** Side/relationship values, Page layout

---

## Side/Relationship Values

### Side values

| Option | Description | Selected |
|--------|-------------|----------|
| Predefined: Bride / Groom / Both | Dropdown with 3 fixed options — consistent values make GUES-03 breakdowns reliable | ✓ |
| Freeform text | Free input field — flexible but risks inconsistent values that break summary counts | |
| Predefined + custom | Dropdown with common options plus an 'Other / custom' entry | |

**User's choice:** Predefined: Bride / Groom / Both
**Notes:** Consistency required for summary grouping in GUES-03.

---

### Relationship values

| Option | Description | Selected |
|--------|-------------|----------|
| Predefined list: Family / Friend / Colleague / Plus One | 4 clean categories covering most wedding guests | ✓ |
| Freeform text | Free input — flexible but breaks GUES-03 grouping | |
| Predefined + custom | Fixed options + 'Other' — 'Other' becomes a catch-all bucket in summary | |

**User's choice:** Predefined: Family / Friend / Colleague / Plus One

---

## Page Layout

### Display format

| Option | Description | Selected |
|--------|-------------|----------|
| Table | Rows with columns: Name \| Side \| Relationship \| Invited \| Actions | ✓ |
| Card/row list | Each guest as a card block, like the decision queue | |

**User's choice:** Table

---

### Add guest UX

| Option | Description | Selected |
|--------|-------------|----------|
| Inline form row at top of table | '+ Add Guest' button reveals an editable row — consistent with Budget/Decisions pattern | ✓ |
| Form above the table | Persistent or togglable form section above the table | |
| You decide | Follow established inline expansion pattern | |

**User's choice:** Inline form row at top of table

---

### Edit guest UX

| Option | Description | Selected |
|--------|-------------|----------|
| Inline row edit | Edit turns the row into editable fields in-place — consistent with budget edit pattern | ✓ |
| You decide | Follow whatever pattern fits the table layout best | |

**User's choice:** Inline row edit

---

## Claude's Discretion

- Summary section placement and visual style
- Invited toggle UX (quick in-row toggle vs. edit form only)
- Empty state when no guests exist
- Delete confirmation behavior
