// pilot_requests.types.ts
// Standalone, compilable types for the extended public.pilot_requests table.
// The full database.types.ts was regenerated post-migration; to refresh the
// whole repo file run:
//   supabase gen types typescript --project-id ogsvhgsdfmcbzgwovcpy > src/database.types.ts
// (or `npx supabase gen types typescript --linked > src/database.types.ts`)

export type PilotRequestStatus =
  | 'new' | 'contacted' | 'in_progress' | 'delivered' | 'closed';

export type PilotChannel = 'linkedin' | 'email' | 'both';

export type PilotReplySentiment =
  | 'positive' | 'neutral' | 'negative' | 'no_reply';

export type PilotOutcome =
  | 'pending' | 'no_response' | 'replied' | 'call_booked' | 'pilot_accepted'
  | 'pilot_delivered' | 'case_study' | 'referral' | 'declined';

/** A row as stored in public.pilot_requests. */
export interface PilotRequestRow {
  id: string;
  name: string;
  email: string;
  company: string;
  sequencer: string | null;
  profile_url: string | null;
  status: PilotRequestStatus;
  created_at: string;
  updated_at: string;

  // Outbound warm-DM tracking (added 2026-06-22)
  relationship: string | null;     // friend_of_friend | warm_intro | community | second_degree | past_colleague
  persona: string | null;          // ICP persona bucket
  channel: PilotChannel | null;
  warmth: number | null;           // 1..5
  message_variant: string | null;  // which template variant (A..J)
  owner: string | null;            // who sent it
  mutual: string | null;           // mutual connection / how warm
  contacted_at: string | null;
  first_reply_at: string | null;
  reply_sentiment: PilotReplySentiment | null;
  follow_up_1_at: string | null;
  follow_up_2_at: string | null;
  pilot_sent_at: string | null;
  outcome: PilotOutcome | null;
  notes: string | null;
}

export type PilotRequestInsert =
  Omit<PilotRequestRow, 'id' | 'created_at' | 'updated_at' | 'status'>
  & { id?: string; created_at?: string; updated_at?: string; status?: PilotRequestStatus };

export type PilotRequestUpdate = Partial<PilotRequestRow>;

/** Payload accepted by the public.upsert_pilot_contact(p jsonb) RPC. */
export interface UpsertPilotContactArgs {
  p: Partial<PilotRequestInsert> & { name: string; email: string };
}
