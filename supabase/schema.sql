create table if not exists service_requests (
  id text primary key,
  request jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists business_leads (
  id text primary key,
  request_id text not null references service_requests(id) on delete cascade,
  business jsonb not null
);

create index if not exists business_leads_request_id_idx on business_leads(request_id);

create table if not exists call_attempts (
  id text primary key,
  request_id text not null references service_requests(id) on delete cascade,
  business_id text not null references business_leads(id) on delete cascade,
  conversation_id text,
  call_sid text,
  call jsonb not null
);

create index if not exists call_attempts_request_id_idx on call_attempts(request_id);
create index if not exists call_attempts_conversation_id_idx on call_attempts(conversation_id);
create index if not exists call_attempts_call_sid_idx on call_attempts(call_sid);

create table if not exists call_summaries (
  id text primary key,
  request_id text not null references service_requests(id) on delete cascade,
  business_id text not null references business_leads(id) on delete cascade,
  call_attempt_id text not null references call_attempts(id) on delete cascade,
  summary jsonb not null
);

create index if not exists call_summaries_request_id_idx on call_summaries(request_id);

create table if not exists negotiation_instructions (
  id text primary key,
  request_id text not null references service_requests(id) on delete cascade,
  negotiation jsonb not null
);

create index if not exists negotiation_instructions_request_id_idx
  on negotiation_instructions(request_id);

create table if not exists recommendations (
  request_id text primary key references service_requests(id) on delete cascade,
  recommendation jsonb not null
);
