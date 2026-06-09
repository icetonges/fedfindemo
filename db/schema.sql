create table if not exists source_documents (
  id bigserial primary key,
  source_path text not null,
  source_url text,
  source_type text not null,
  agency text,
  fiscal_year text,
  domain text not null,
  status text not null,
  bytes bigint,
  extracted_at timestamptz not null default now()
);

create table if not exists budget_accounts (
  id bigserial primary key,
  agency text not null,
  bureau text,
  account_name text not null,
  appropriation text,
  fiscal_year text not null,
  source_document_id bigint references source_documents(id)
);

create table if not exists budget_lines (
  id bigserial primary key,
  budget_account_id bigint references budget_accounts(id),
  line_label text not null,
  fiscal_year text,
  amount numeric,
  amount_type text,
  provenance jsonb not null default '{}'::jsonb
);

create table if not exists award_transactions (
  id bigserial primary key,
  award_key text,
  award_type text not null,
  tier text not null,
  agency text,
  recipient text,
  fiscal_year text,
  obligation numeric,
  award_value numeric,
  source_document_id bigint references source_documents(id),
  provenance jsonb not null default '{}'::jsonb
);

create table if not exists audit_findings (
  id bigserial primary key,
  area text not null,
  status text not null,
  risk text not null,
  finding text not null,
  control_activity text not null,
  evidence text,
  due_date text,
  provenance jsonb not null default '{}'::jsonb
);

create table if not exists control_activities (
  id bigserial primary key,
  finding_id bigint references audit_findings(id),
  control_name text not null,
  owner text,
  frequency text,
  evidence_requirement text,
  status text not null
);

create table if not exists financial_anomalies (
  id bigserial primary key,
  severity text not null,
  category text not null,
  title text not null,
  detail text,
  amount numeric,
  source_document_id bigint references source_documents(id),
  detected_at timestamptz not null default now()
);

create table if not exists intelligence_items (
  id bigserial primary key,
  title text not null,
  category text not null,
  summary text not null,
  priority text not null,
  source text,
  published_at timestamptz not null default now()
);

create table if not exists ingestion_runs (
  id bigserial primary key,
  mode text not null,
  status text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  records_loaded integer not null default 0,
  details jsonb not null default '{}'::jsonb
);
