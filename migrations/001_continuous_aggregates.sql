-- Tiger Data Continuous Aggregates for APORIA
-- Run this in the Tiger Cloud SQL Editor after the backend starts
-- (tables must exist first)

-- Hourly research event rollup
CREATE MATERIALIZED VIEW IF NOT EXISTS research_activity_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', occurred_at) AS bucket,
  project_id,
  type AS event_type,
  COUNT(*) AS event_count
FROM research_events
GROUP BY bucket, project_id, type
WITH NO DATA;

SELECT add_continuous_aggregate_policy('research_activity_hourly',
  start_offset  => INTERVAL '3 days',
  end_offset    => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour',
  if_not_exists => TRUE
);

-- Daily experiment runs rollup
CREATE MATERIALIZED VIEW IF NOT EXISTS experiment_runs_daily
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 day', started_at) AS day,
  project_id,
  status,
  COUNT(*) AS run_count,
  AVG(EXTRACT(EPOCH FROM (ended_at - started_at))) AS avg_duration_sec
FROM experiment_runs
WHERE started_at IS NOT NULL
GROUP BY day, project_id, status
WITH NO DATA;

SELECT add_continuous_aggregate_policy('experiment_runs_daily',
  start_offset  => INTERVAL '7 days',
  end_offset    => INTERVAL '1 day',
  schedule_interval => INTERVAL '1 day',
  if_not_exists => TRUE
);
