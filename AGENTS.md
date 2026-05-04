# Agent Directives: Feature Development & Testing Protocol

You are an autonomous web development agent. Your primary directive is to write robust, fully tested code, prioritizing testing systemic functionality over writing tests just to hit coverage metrics. 

## 1. The Development Loop
When instructed to build a feature, you will follow this loop strictly:

Pre Step: Always start with a clean git workspace. Warn the user and make them verify that they want to proceed if there are uncommitted changes at the start of a new feature.

1. **Spec Generation:** Write out the requirements of the feature in Gherkin syntax.
2. **Test Routing:** Analyze the Gherkin specs and categorize them into:
   - **Deterministic Tests:** Can be asserted with strict code (Unit/Integration).
   - **Vibe Tests:** Subjective, visual, or fuzzy criteria requiring LLM evaluation.
3. **Implementation & Testing:** Write the code and the tests concurrently.
4. **Phase 1 Verification (Deterministic):** Run the standard test suite. You are NOT allowed to proceed if any of these tests fail. Fix regressions immediately.
5. **Phase 2 Verification (Vibes):** ONLY after Phase 1 is 100% green, you must execute the vibe runner: 
   `python tests/vibes/run_vibes.py`
   If any vibe tests fail, you must fix the underlying code/layout and restart from Phase 4.
6. **Approval:** Once BOTH test phases pass cleanly, summarize what was done and ask the user: "Ready to commit?". If the user confirms, commit the code according to the instructions below.

## 2. Testing Philosophy
Do not write brittle tests. Follow these constraints:
- **Unit Tests:** Reserve these mostly for declarative, pure functions (e.g., data transformations, complex math, localized logic algorithms). There should be few if any mocks necessary in these (however, if a function is logic-heavy and needs some minor call(s) mocked, that is acceptable). A note on design philosophy though: if a function is "logic-heavy" but also requires mocks, it might be doing too much. It might be worth "letting the testing guide your design" and consider pulling that functionality out into its own (easily testable) function. Functions should be well named and human readable and represent a logical unit of functionality.
- **Integration Tests:** This is your primary weapon. If a function requires mocking out half the application to test it, write an integration test instead. Test the happy path, common edge cases, and ensure graceful handling of explicit failure states.
- **Vibe Tests (Heuristic/LLM Tests):** For visual layouts, tone of voice, or fuzzy logic where pixel-perfect or string-exact matching is impossible. You will write these as prompts/criteria for our LLM-test-runner. Example: "Given the user dashboard, the layout should still generally reflect a 3-column structure and the primary call-to-action should be clearly visible."

**Vibe Test Protocol:**
You do NOT execute vibe tests. You only define them. 
All vibe tests live in a single ledger: `tests/vibes/vibe_specs.md`. Any associated screenshots/assets must be saved to `tests/vibes/assets/`.

When you build a feature that requires a vibe test, you must append it to `vibe_specs.md` using EXACTLY this format:

```
## [Feature Name / Test Name]
**Type:** [Visual | Tone | Logic]
**Asset:** [Relative path to asset, or "None"]
**Assertion:** [A clear, pragmatic prompt describing what the LLM judge should look for.]
```

## 3. Git Commit Protocol (The "50/7200" Rule)
We write git logs for LLM ingestion and RAG systems, not for human attention spans. When the user approves a commit, you will generate a commit message with the following strict structure:

- **Line 1 (Summary):** Maximum 50 characters. Imperative mood. (e.g., "Add user authentication routing")
- **Line 2:** BLANK.
- **Line 3 and beyond (The Novella):** Write an exhaustively detailed markdown description of the feature. There is no length limit. You must include:
  - The core problem this commit solves.
  - A detailed explanation of the architecture/logic decisions made.
  - Any edge cases encountered and how they were handled.
  - A summary of the tests added (Unit, Integration, and Vibe).
  - Any technical debt introduced or deferred.

A note: you can assume that structure for this project as well. Therefore, use `git log --online` if you need to see a general summary of the history of this porject, but be aware that you can "drill into" most commits to get a lot more context about that change. This will come in handy when fixing bugs related to specific, previously-implemented features.

## 4. Bootstrapping

If the ./tests, ./tests/vibes, /tests/vibes/assets folders do not exist, feel free to create them. If the `./test/vibes/vibe_specs.md` file does not exist, feel free to create it with an h1 header "Vibe Specs" and then your specs.

If an appropriate test harness for this project is missing entirely, feel free to create one at your discretion based on popularity of the tool used and the requirements defined in this file for testing.

## 5. Local Development Environment

This section documents the full local environment so an agent can bootstrap on a fresh machine with only this project folder.

### Prerequisites

| Tool | Purpose | Install |
|------|---------|---------|
| Node.js ≥ 20 | Test runner, static file server | `sudo apt install nodejs npm` or use nvm |
| Docker | Supabase local stack | `sudo apt install docker.io && sudo usermod -aG docker $USER` then log out/in |
| Supabase CLI | Local DB management | `npm install -g supabase` or see supabase.com/docs/guides/cli |
| Playwright browsers | Headless integration tests | `npx playwright install chromium` (run once after `npm install`) |

After installing Docker, the user must **log out and back in** (or run `newgrp docker` in the current shell) for the group change to take effect. If running inside a persistent agent shell (like Claude Code), use `sg docker -c "<command>"` to invoke Docker commands until the session is restarted.

### First-time Setup (on a new machine)

```bash
# 1. Install Node dependencies and Playwright browser
npm install
npx playwright install chromium

# 2. Start the local Supabase stack (requires Docker)
#    First run pulls Docker images — takes several minutes.
supabase start        # or: sg docker -c "supabase start"

# 3. Apply the schema and seed test data
supabase db reset     # or: sg docker -c "supabase db reset"

# 4. Verify everything is running
supabase status
```

### Running Tests

```bash
# Unit tests (pure function tests — no Docker required)
npm test

# Integration tests (headless browser + local Supabase — requires supabase start)
npm run test:integration

# Both suites
npm run test:all
```

### Local Supabase Details

| Resource | Value |
|----------|-------|
| API URL | `http://127.0.0.1:54321` |
| DB URL | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Studio UI | `http://127.0.0.1:54323` |
| Anon key | Standard local JWT — see `tests/support/world.js` |

The local anon key is the well-known Supabase development JWT (derived from `super-secret-jwt-token-with-at-least-32-characters-long`). It is the same on every machine and is safe to commit.

### How Integration Tests Work

Integration tests use **Playwright** (headless Chromium) + **Cucumber.js** (Gherkin). The test runner:

1. Starts a static file server on port 3001 serving the project root.
2. Intercepts all HTTP requests to the production Supabase host (`giwfigekjatujubjknjf.supabase.co`) using `page.route()` and proxies them to the local stack at `127.0.0.1:54321`, replacing the API key with the local anon JWT.
3. Tests run against a real database populated by `supabase/seed.sql`.

No JSON fixtures. No network access. Every Supabase query hits a real Postgres instance.

### Schema & Seed

- **Migration:** `supabase/migrations/20260101000000_initial_schema.sql` — single canonical file containing all tables, RLS policies, triggers, and indexes. Run `supabase db reset` to apply from scratch.
- **Seed:** `supabase/seed.sql` — test data only (not production data). Includes two open tournaments, a cancelled tournament, and egg orders in various states.

To reset to a clean state at any time: `supabase db reset` (re-runs migration + seed, takes ~5 seconds).

### Test File Layout

```
tests/
  features/
    unit/           ← Gherkin specs for pure function tests
    integration/    ← Gherkin specs for browser/DB integration tests
  step_definitions/
    unit/           ← Cucumber step implementations (Node.js, no browser)
    integration/    ← Cucumber step implementations (Playwright)
  support/
    world.js        ← Cucumber World: browser lifecycle + Supabase route interception
  vibes/
    vibe_specs.md   ← LLM-evaluated visual/tone test ledger
    assets/         ← Screenshots and assets for vibe tests
src/
  tee-utils.js      ← Pure utility functions (UMD — works in Node and browser)
```
