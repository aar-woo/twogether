## Phase 3: Milestone Execution Protocol

**For every milestone, follow this exact sequence:**

```
SESSION START:
1. Fresh Claude Code session
2. First message: "Read SPEC.md, TODOS.md, and CLAUDE.md
   before doing anything"
3. Then: "We're implementing Milestone [N].
   Switch to Plan Mode and show me your implementation
   plan before writing any code."
4. Review and approve the plan
5. Exit Plan Mode, let Claude implement

DURING MILESTONE:
- Git commit every meaningful chunk (not just at the end)
- git commit BEFORE any supabase db push
- If Claude goes off-track, Escape immediately and correct it

MILESTONE COMPLETION CHECKLIST:
[ ] All TODOS.md items for this milestone checked off
[ ] supabase gen types typescript run and types committed
[ ] Claude writes and runs tests (let it choose the right type)
[ ] All tests passing
[ ] git commit -m "milestone [N] complete"
[ ] Fresh session for next milestone
```

**Prompt to kick off each milestone:**

```
Read SPEC.md, TODOS.md, and CLAUDE.md.

We are implementing Milestone [N]: [name].

Before any code: enter plan mode and give me a complete
implementation plan including:
- Every file you'll create or modify
- The migration files needed and their RLS policies
- Order of operations
- What tests you'll write to confirm doneness

Wait for my approval before proceeding.
```
