# Claude Behavior Rules — VaagaTypePanalam

This file defines how Claude (and other AI agents) must behave in this project. These rules apply to **every session**.

---

## 1. Documentation — Read, Understand, and Keep Updated

- Before starting any task, **read all relevant documentation files in full**. Do not skim or glance. Understand the purpose, structure, and context of the project.
- If documentation files (e.g., `README.md`, `ARCHITECTURE.md`, `API.md`, or any `docs/` files) **do not exist**, create them with sensible content based on the current project state.
- After **every change** that affects behavior, structure, APIs, configs, or logic — **update the relevant documentation immediately**. Do not leave docs stale.
- If a change is too small to warrant a doc update, explicitly confirm that no update is needed and briefly explain why.

---

## 2. Expensive or Repeated Commands — Warn Before Running

- If a command is likely to be **computationally expensive** (e.g., large builds, training loops, dependency installs, database migrations, recursive file operations) or if the same command has **already been attempted and failed more than once**, do NOT silently retry.
- Instead, **stop and notify the user**. Explain:
  - What the command does
  - Why it is expensive or keep failing
  - What the user should consider before proceeding
- Suggest the user run it manually in their terminal if appropriate, and provide the exact command to copy-paste.

---

## 3. Unclear Instructions — Always Ask, Never Assume

- If a task or instruction is **ambiguous, incomplete, or unclear in any way**, stop immediately and ask the user for clarification.
- **Do not assume** what the user means and proceed silently. Do not guess intent and fill in blanks without permission.
- Ask a specific, targeted question — do not ask vague follow-ups.

---

## 4. Illogical or Suspicious Code — Report Before Touching

- While reading or modifying code, if you encounter **logic that appears broken, contradictory, redundant, or potentially harmful**, **do not silently ignore it**.
- Report the issue clearly to the user and ask for instructions.

---

## 5. Deletions — Always Confirm First

- **Never delete any file, folder, function, class, variable, config entry, or any other piece of content** without explicit confirmation from the user first.

---

## 6. Code Modifications — Explain First, Then Modify

- Before modifying any existing code, **pause and explain to the user**:
  - What the current code does
  - What the problem or mistake is
  - What change you plan to make and why
- Wait for the user to acknowledge or approve before making the change.

---

## 7. Staying in Scope — Do Not Over-Reach

- Only do what was asked. Do not fix other things you notice along the way unless you first mention them and get permission.
- If you notice something unrelated but worth fixing, **flag it separately** as a suggestion.

---

## 8. Before Starting Any Task — Run This Checklist

Ask yourself:
- [ ] Have I read all relevant docs fully?
- [ ] Is the task clear enough to proceed?
- [ ] Will this involve deleting anything? → Ask first.
- [ ] Will this modify existing code? → Explain first, then modify.
- [ ] Does the code I'm reading have anything illogical? → Report it.
- [ ] Will any command be expensive or has it failed before? → Warn the user.
- [ ] Will my changes require a documentation update? → Do it.
