---
name: Project overview
description: MIG Export cardamom P&L app - replaces Excel template, Supabase + Next.js 15
type: project
---

MIG Export is a cardamom (NOT coffee) export P&L application replacing an Excel template (Verdes.xlsx).

**Supabase project:** https://ilektlmqjaujxuaomzld.supabase.co

**Key decisions:**
- Both input modes supported: kilos and percentage toggle
- Anexo 1 (purchase costs) can be non-zero — user has been lucky but costs may arise
- Admin fixed cost: $500/month default, full CRUD for past shipments, management modal for future defaults
- Container sizes: mostly 20ft, rare 40ft — both supported
- "Verdes" is just the Excel sheet name, not a product designation

**Why:** Jorge's mission is to simplify an overly complicated income statement into the best possible UX.
**How to apply:** Prioritize simplicity and user-friendliness over feature density. Accept all Claude online's design recommendations from scaffold.
