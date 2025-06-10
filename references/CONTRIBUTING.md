---
title: CONTRIBUTING
---

# CONTRIBUTING

A concise, opinionated guide for working on this code-base.
Follow the rules below and keep everything simple, clean, and friendly for non-coders.

Many thanks to the following sources for help creating this file: 
https://x.com/0xDesigner/status/1915152588913422778 

---
The following is for AI and should be linked to project rules 
---


---

## 0. Core Principles  
1. **Keep it simple.** Reach for the smallest, clearest fix first.  
2. **No duplication.** Re-use existing code before writing more.  
3. **Change only what you truly understand or what the user asked for.**  
4. **One source of truth.** If you add a new approach, remove its older twin.  
5. **Stay clean and tiny.**  
   * Refactor when a file nears ~250 lines.  
   * One-off scripts belong in proper tooling or tests—not random files.  
6. **Real data only.** Mock or stub **only** inside automated tests. Never in dev or prod paths.  
7. **Env safety.** Never overwrite `.env` without explicit approval.  
8. **Human-first headers.** Every file starts with a plain-English note that tells a non-coder what the file does and why it matters.
9. **API Key & Secret Security.** Never commit API keys, secrets, or tokens to any repository.

---

## 1. Roles

| Role        | What you do                                                                                               | How you record it                                                                                                   |
|-------------|-----------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| **Planner** | Analyse the user's request, break it into bite-sized tasks, set clear success criteria.                   | Edit `.cursor/scratchpad.md` — sections **Background & Motivation**, **Key Challenges**, **High-level Task Breakdown**. |
| **Executor**| Implement one task at a time with tests, report milestones or blockers.                                   | Update **Project Status Board** and **Executor's Feedback or Assistance Requests** in `.cursor/scratchpad.md`.        |

> If the user forgets to say which mode they want, ask.

---

## 2. Document Conventions

* Keep the existing section titles in `.cursor/scratchpad.md`; append, don't mangle.  
* **Planner** owns background, analysis and task lists.  
* **Executor** owns progress notes, lessons, and the status board.  
* Use Markdown task-list check-boxes for the board.  

---

## 3. Workflow

1. **New request → Planner**  
   * Update *Background & Motivation*.  
   * Expand *Key Challenges* and write a task list with testable success points.  
2. **Executor loop**  
   * Pick the top unchecked task only.  
   * Write tests first (TDD).  
   * Code the smallest step that makes the tests pass.  
   * Commit progress; update status board and lessons.  
   * Ask the user to review before ticking off a task.  
3. **Planner checks completion**  
   * Only the Planner proclaims the project "done".  
4. **Safety stops**  
   * Before large or risky edits, Executor warns Planner in the feedback section.  
   * Run `npm audit` if the terminal hints at vulnerabilities.  
   * Ask before any `git ... --force`.

---

## 4. Coding Etiquette

* **≤ 250 lines per file.** Break apart sooner.  
* **No stray one-off scripts.** Convert them into repeatable commands or delete.  
* **Read before you write.** Know the territory.  
* **Helpful output.** Print enough context to debug quickly.  
* **Record insights.** List every reusable lesson in the **Lessons** section.

---

## 5. API Key & Secret Security

**NEVER** put API keys, secrets, tokens, or other sensitive values in any documentation files, especially:
- ❌ Build plans (build-plan.mdx)
- ❌ README files  
- ❌ Tutorial documentation
- ❌ Commit messages
- ❌ Code examples in docs

**INSTEAD:**
- ✅ Use placeholder values like `<your-api-key-here>` or `<see-environment-reference.md>`
- ✅ Store actual values in git-ignored files (like `environment-reference.md`)
- ✅ Reference the secure file location in documentation
- ✅ Always add sensitive files to `.gitignore` immediately

**Before committing:** Always scan for patterns like `sk-`, `pk_`, `_KEY=`, API keys, or other secrets.

---

## 6. Conflict Rule

When a guideline from *Core Principles* clashes with anything else, **Core Principles win**.

## 7. Multi-Project Workspace (energy-flow ↔ no-bad-parts)

The monorepo contains **two completely separate Next.js projects** that share a git repository but nothing else:

| Folder | Purpose | Default Dev Command | Primary Port |
|--------|---------|---------------------|--------------|
| `energy-flow/` | Docs site & knowledge base (Nextra – pages router) | `cd energy-flow && pnpm dev` | 3000 |
| `no-bad-parts/` | Product code (LiveKit video POC – App Router) | `cd no-bad-parts && pnpm dev` | 3000 *(falls back to 3001 if 3000 busy)* |

**Golden Rules:**
1. **Always `cd` into the correct folder before you run _any_ dev/build/lint command.** If you're unsure, run `pwd` and verify.
2. **Never place LiveKit or agent-related code under `energy-flow/`.** It belongs in `no-bad-parts/`.
3. **Never place docs/MDX content under `no-bad-parts/`.** It belongs in `energy-flow/`.
4. **When creating new files:** double-check the path _before_ saving. A 3-second check now saves an hour of debugging later.
5. **Running both projects simultaneously**:
   - Start `energy-flow` first (`pnpm dev`) → grabs port 3000.
   - Then start `no-bad-parts` with an explicit port: `pnpm dev -p 3001` (or it will auto-select 3001).
6. **Committing:** before `git add -A`, run `git status` and confirm that changed paths begin with the intended project folder.
7. **CI / automated scripts** must set `WORKING_DIR` or `PROJECT` and `cd` accordingly before `pnpm ...`.

Ignoring these rules usually leads to mysterious 404 / 500 errors. Stick to the table above and life will be good. ✨
```
