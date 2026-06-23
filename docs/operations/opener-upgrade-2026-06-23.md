# Opener upgrade + "remove the dashes" (2026-06-23)

Applied the cold-email research (Kevin O'Leary brevity, Sam McKenna "show me you know me" +
objection/challenge framing, Hormozi plain-text/no-dash style) to the place the model actually
reads instructions, and fixed the dash stripper that was leaving dashes behind.

## What changed
1. **Personalization system prompt v4 (live).** `prompt_versions` (agent `personalization_agent`)
   now serves **version 4** (v3 kept, inactive, for rollback). New v4 encodes:
   - "Show me you know me": the subject/opener must be specific enough to look odd to a stranger.
   - **State the challenge the signal creates, not features** (the research's core lever): the
     bridge first explains *why the signal matters* (operational consequence), then connects to
     outbound/deliverability/reply rates.
   - The **100-people specificity test**: if the line could go to 100 others, rewrite it.
   - **Hard no-dash rule** (no em-dashes, en-dashes, or " - ").
   - Lengths aligned to the code validator (opener < 35, bridge < 30, combo < 65) so good
     variants stop dead-lettering on a 1-word overage.
   - Repo copy: `RunDossier/sql/seeds/personalization_prompt_v4.sql` (idempotent; includes rollback).
   - **Rollback:** `UPDATE prompt_versions SET active_bool=(version=3) WHERE agent_name='personalization_agent';`

2. **Dash stripper actually removes dashes now.** `src/utils/strip-emdash.ts` previously turned
   `—` into `" - "` (still a dash). It now replaces em/en dashes and spaced hyphens with a comma,
   while preserving in-word hyphens (`data-driven`, `co-founder`). Applied to subject/opener/bridge
   in `personalize.agent.ts`, so output is dash-free even if a model slips one in.
   New tests: `src/utils/strip-emdash.test.ts` (6 cases; logic verified 6/6 in sandbox).

3. **In-code prompt reinforced.** `personalize.agent.ts` `buildPersonalizationUserMessage()` now
   tells the model to state why the signal matters, apply the specificity test, and use no dashes
   (and the instructions themselves no longer contain em-dashes).

## Note on the earlier "length dead-letters"
The historical `bridge: 27 words (max 25)` failures were from the **old** limits; the validator was
already relaxed to 35/30/65. v4 aligns the prompt to those numbers, further reducing dead-letters.
JSON parsing is already robust (`parse-json.ts` handles fences/prose/trailing commas).

## Status of the five "top remaining actions"
1. **CI / build / test** — repo is `github.com/AraGhah/RunDossier` with CI (`ci.yml`: build + test +
   coverage + audit). The OneDrive-mounted sandbox can't run the toolchain (truncated reads), so
   **confirm the latest Actions run is green**, or run `npm run build && npm test` in `RunDossier`.
2. **Email provider** — code reviewed (`send-delivery-email.ts`: resend → gmail fallback, admin copy,
   safe skip when unconfigured). Live DB shows a real delivery with `status='email_sent'` + a
   `provider_message_id`, so the provider has worked. To re-confirm in prod: `npx tsx scripts/test-delivery-email.ts`.
3. **pg-boss retention** — NOT applied: only `maintenanceIntervalSeconds` was confirmable in the
   installed v12.18.3; the archive/delete option names couldn't be verified here, and a wrong option
   on the queue constructor risks a boot error. Verify the exact v12 names in the pg-boss docs, then
   add to `new PgBoss({...})` in `src/queue.ts` (target: archive completed after ~1h, delete after ~3d).
4. **Personalization length/JSON** — addressed (validator already relaxed; v4 prompt aligned; parser robust).
5. **Commit hygiene** — `.git/index.lock` removed; `.gitattributes` (`* text=auto eol=lf`) added so the
   CRLF drift stops. Stage only the real changes (not the ~221 CRLF-only files):
   `git add .gitattributes RunDossier/src RunDossier/sql RunDossier/scripts RunDossier/package.json docs/operations`

## Verified vs not
- Verified (sandbox): dash stripper logic 6/6; v4 prompt is the single active row (DB).
- NOT runnable here: full `tsc`/`npm test` (OneDrive truncation) and live opener generation (needs
  AI keys). Confirm in CI / by running a small batch after deploy. The v4 change is reversible.
