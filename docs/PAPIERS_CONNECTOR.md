# Papiers connector

APORIA reads a researcher's saved Papiers material through the documented,
read-only Papiers CLI. Search and read results are returned with
`data_mode=live_source`; the connector does not invent papers or write back to
Papiers.

## Configuration

1. Install the Papiers CLI with Node.js 22 or newer (`npm install -g papiers`)
   and authenticate it according to the [Papiers agent
   guide](https://wiki.papiers.ai/docs/agents). Confirm `papiers auth status` works.
2. Set `PAPIERS_TOKEN` in the backend process environment. Keep it out of Git,
   browser JavaScript, logs, and demo screenshots.
3. Set a separate `APORIA_PAPIERS_ACCESS_KEY` in the backend process environment.
   This is a temporary single-user gate for the private HTTP search/read routes
   while APORIA has no account system. Do not place this key in a public
   frontend bundle. Use a private local client or a user-entered key for a demo.

Without the token or CLI, `GET /api/v1/papiers/status` reports
`connected=false`, `mode=disconnected`, and an error. It never returns the
token or private source content.

## Routes

`GET /api/v1/papiers/status` reports CLI authentication status. The private
routes require `X-Aporia-Research-Key`:

- `POST /api/v1/papiers/search` with `{"query":"3DGS view coverage","limit":10}`
- `POST /api/v1/papiers/read` with `{"source_id":"doc_..."}`

Search/read return the exact parsed CLI JSON under `result`, alongside
provider and retrieval time. The provider's JSON shape is not assumed. The
source ID is validated, search text excludes Windows command-script
metacharacters, limits are bounded, and CLI failures return generic errors
without raw stdout/stderr. A successful `auth status` check is provider
connectivity, not proof that a specific paper was retrieved. A successful
search/read response is the evidence for that specific retrieval.

This gate is not multi-user authorization. Before shared deployment, bind the
Papiers token and source reads to authenticated researcher identities and
consent scopes.
