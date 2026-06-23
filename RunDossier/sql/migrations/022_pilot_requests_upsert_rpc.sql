-- 022: Idempotent upsert RPC for the warm-pilot loader (scripts/warm-pilot).
-- One jsonb payload -> INSERT ... ON CONFLICT (lower(email)) DO UPDATE, with COALESCE
-- so blank inputs never overwrite existing values. EXECUTE restricted to service_role.
-- APPLIED to production 2026-06-22 (Supabase migration: pilot_requests_upsert_rpc).

CREATE OR REPLACE FUNCTION upsert_pilot_contact(p jsonb)
RETURNS pilot_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec pilot_requests;
  v_email text := lower(nullif(trim(p->>'email'), ''));
BEGIN
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'email is required' USING errcode = '22023';
  END IF;
  IF nullif(trim(p->>'name'), '') IS NULL THEN
    RAISE EXCEPTION 'name is required' USING errcode = '22023';
  END IF;

  INSERT INTO pilot_requests AS pr (
    name, email, company, sequencer, profile_url, status,
    relationship, persona, channel, warmth, message_variant, owner, mutual,
    contacted_at, first_reply_at, reply_sentiment, follow_up_1_at, follow_up_2_at,
    pilot_sent_at, outcome, notes
  )
  VALUES (
    trim(p->>'name'), v_email,
    coalesce(nullif(trim(p->>'company'), ''), 'unknown'),
    nullif(trim(p->>'sequencer'), ''), nullif(trim(p->>'profile_url'), ''),
    coalesce(nullif(trim(p->>'status'), ''), 'new'),
    nullif(trim(p->>'relationship'), ''), nullif(trim(p->>'persona'), ''),
    nullif(trim(p->>'channel'), ''), nullif(p->>'warmth', '')::smallint,
    nullif(trim(p->>'message_variant'), ''), nullif(trim(p->>'owner'), ''),
    nullif(trim(p->>'mutual'), ''),
    nullif(p->>'contacted_at', '')::timestamptz, nullif(p->>'first_reply_at', '')::timestamptz,
    nullif(trim(p->>'reply_sentiment'), ''),
    nullif(p->>'follow_up_1_at', '')::timestamptz, nullif(p->>'follow_up_2_at', '')::timestamptz,
    nullif(p->>'pilot_sent_at', '')::timestamptz, nullif(trim(p->>'outcome'), ''),
    nullif(trim(p->>'notes'), '')
  )
  ON CONFLICT (lower(email)) DO UPDATE SET
    name=coalesce(nullif(trim(EXCLUDED.name),''),pr.name),
    company=coalesce(nullif(EXCLUDED.company,'unknown'),pr.company),
    sequencer=coalesce(EXCLUDED.sequencer,pr.sequencer),
    profile_url=coalesce(EXCLUDED.profile_url,pr.profile_url),
    status=coalesce(EXCLUDED.status,pr.status),
    relationship=coalesce(EXCLUDED.relationship,pr.relationship),
    persona=coalesce(EXCLUDED.persona,pr.persona),
    channel=coalesce(EXCLUDED.channel,pr.channel),
    warmth=coalesce(EXCLUDED.warmth,pr.warmth),
    message_variant=coalesce(EXCLUDED.message_variant,pr.message_variant),
    owner=coalesce(EXCLUDED.owner,pr.owner),
    mutual=coalesce(EXCLUDED.mutual,pr.mutual),
    contacted_at=coalesce(EXCLUDED.contacted_at,pr.contacted_at),
    first_reply_at=coalesce(EXCLUDED.first_reply_at,pr.first_reply_at),
    reply_sentiment=coalesce(EXCLUDED.reply_sentiment,pr.reply_sentiment),
    follow_up_1_at=coalesce(EXCLUDED.follow_up_1_at,pr.follow_up_1_at),
    follow_up_2_at=coalesce(EXCLUDED.follow_up_2_at,pr.follow_up_2_at),
    pilot_sent_at=coalesce(EXCLUDED.pilot_sent_at,pr.pilot_sent_at),
    outcome=coalesce(EXCLUDED.outcome,pr.outcome),
    notes=coalesce(EXCLUDED.notes,pr.notes)
  RETURNING * INTO rec;
  RETURN rec;
END;
$$;

REVOKE ALL ON FUNCTION upsert_pilot_contact(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION upsert_pilot_contact(jsonb) TO service_role;
