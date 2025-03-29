# done

Got it running locally. Sync seems to mostly be working.
Decided not to test on firefox cause no one uses it.

- in the last 30 days, there was only 1 session started on firefox. too bad so sad
- in the last 30 days, 11/3,585 page views were firefox.
- plus we say it's only chrome and safari we fully support
  On develop, did a bunch of sync testing with chrome, safari, and ios open. Lots of edits plus logging in and out. Seems to work.
  Made it possible to build server locally without weirdness
  ~~MAYBE make client into a separate package~~ started trying it and it was too much work
  Made it possible to run the full backend locally: hasura, api, nlp, and postgres.
  Updated instructions accordingly.

## What routes changed?

### Code block I added on both develop and main to print routes

```
// Function to list all routes
function listRoutes() {
  const mainRoutes = app._router.stack
    .filter((r: any) => r.route)
    .map((r: any) => ({
      method: Object.keys(r.route.methods)[0].toUpperCase(),
      path: r.route.path
    }));

  const routers = app._router.stack
    .filter((r: any) => r.name === 'router' && r.handle.name === 'router')
    .map((r: any) => r.handle);

  // assert there's only one router
  if (routers.length !== 1) {
    throw new Error("Expected only one router");
  }

  const v1Router = routers[0];

  const v1Routes = v1Router?.stack
    .filter((r: any) => r.route)
    .map((r: any) => ({
      method: Object.keys(r.route.methods)[0].toUpperCase(),
      path: `/v1${r.route.path}`
    })) || [];

  return [...mainRoutes, ...v1Routes];
}

// Print routes
console.log(listRoutes());
```

### diff I got from comparing them

diff --git a/routes-on-main.txt b/routes-on-develop.txt
index 7046a50e7..40f06a76f 100644
--- a/routes-on-main.txt
+++ b/routes-on-develop.txt
@@ -1,28 +1,33 @@

- { method: 'GET', path: '/health' },
- { method: 'POST', path: '/unfurl/' },
  { method: 'POST', path: '/upload' },
  { method: 'GET', path: '/images/:filename' },
  { method: 'POST', path: '/process-transcript/' },
- { method: 'POST', path: '/process-transcript-async/' },
- { method: 'POST', path: '/process-transcript-chunk-async/' },
- { method: 'POST', path: '/extract-entities' },
  { method: 'POST', path: '/user-public-notes' },
  { method: 'POST', path: '/public-note' },
- { method: 'POST', path: '/subscribe-user' },
- { method: 'POST', path: '/delete-user' },
- { method: 'POST', path: '/ocr' },
  { method: 'GET', path: '/v1/health' },

* { method: 'GET', path: '/v1/delta' },
  { method: 'POST', path: '/v1/notes/export-media' },
  { method: 'GET', path: '/v1/versions' },
  { method: 'POST', path: '/v1/links/unfurl' },

- { method: 'GET', path: '/v1/users/:id' },
- { method: 'DELETE', path: '/v1/users/:id' },
- { method: 'PATCH', path: '/v1/users/:id' },

* { method: 'GET', path: '/v1/user' },
* { method: 'DELETE', path: '/v1/user' },
* { method: 'PATCH', path: '/v1/user' },
* { method: 'POST', path: '/v1/users' },
* { method: 'GET', path: '/v1/users/:id/public-notes' },
* { method: 'POST', path: '/v1/user/initialize' },
* { method: 'PATCH', path: '/v1/user/settings' },
* { method: 'PATCH', path: '/v1/user/handle' },
* { method: 'POST', path: '/v1/entities/extract' },
* { method: 'POST', path: '/v1/folders' },
* { method: 'PATCH', path: '/v1/notes/:id/publish' },
  { method: 'GET', path: '/v1/notes/stats' },
* { method: 'POST', path: '/v1/notes' },
* { method: 'GET', path: '/v1/public-notes/:noteId' },
* { method: 'POST', path: '/v1/transcripts' },
  { method: 'GET', path: '/v1/transcripts/:requestId' },
  { method: 'POST', path: '/v1/files' },
  { method: 'GET', path: '/v1/files/:fileName' },
  { method: 'GET', path: '/v1/files/:fileName/metadata' },
* { method: 'POST', path: '/v1/ocr' },
  { method: 'GET', path: '/v1/simon/health' },
  { method: 'POST', path: '/v1/simon/add-note' },
  { method: 'POST', path: '/v1/simon/update-note' },

### summary of changes

Removed most routes outside of /v1

- { method: 'GET', path: '/health' },
- { method: 'POST', path: '/unfurl/' },
- { method: 'POST', path: '/process-transcript-async/' },
- { method: 'POST', path: '/process-transcript-chunk-async/' },
- { method: 'POST', path: '/extract-entities' },
- { method: 'POST', path: '/subscribe-user' },
- { method: 'POST', path: '/delete-user' },
- { method: 'POST', path: '/ocr' },
  Removed /:id from user routes
  { method: 'GET', path: '/v1/users/:id' }, -> { method: 'GET', path: '/v1/user' },
  { method: 'DELETE', path: '/v1/users/:id' }, -> { method: 'DELETE', path: '/v1/user' },
  { method: 'PATCH', path: '/v1/users/:id' }, -> { method: 'PATCH', path: '/v1/user/settings' }
  Added new routes:
  { method: 'PATCH', path: '/v1/user' },
  { method: 'POST', path: '/v1/users' },
  { method: 'GET', path: '/v1/users/:id/public-notes' },
  { method: 'POST', path: '/v1/user/initialize' },
  { method: 'PATCH', path: '/v1/user/handle' },
  { method: 'POST', path: '/v1/entities/extract' },
  { method: 'POST', path: '/v1/folders' },
  { method: 'PATCH', path: '/v1/notes/:id/publish' },
  { method: 'POST', path: '/v1/notes' },
  { method: 'GET', path: '/v1/public-notes/:noteId' },
  { method: 'POST', path: '/v1/transcripts' },
  { method: 'POST', path: '/v1/ocr' },

### How far back should we support?

Looks like the vast majority of our users are on the latest release (v0.11.100). So as long as that version worked with the new backend, I'm happy.
We don't have good stats on this in posthog unfortunately, but you can look at sentry and see that almost everything in the last 30D came from the latest release: https://ideaflow.sentry.io/releases/?environment=production&healthStatsPeriod=auto&project=5462697&sort=sessions&statsPeriod=30d&utc=true

### Added back routes needed to support v1.11.100 clients

ok to remove
{ method: 'GET', path: '/health' } Never used by the client
{ method: 'POST', path: '/process-transcript-chunk-async/' } Not used by the client
{ method: 'POST', path: '/unfurl/' } v1.11.100 uses the api client, which hits /v1/link/unfurl for this

Required - used by hasura actions
DONE { method: 'POST', path: '/extract-entities' } v1.11.100 uses extractEntities hasura action which uses /extract-entities
DONE { method: 'POST', path: '/ocr' } v1.11.100 uses ocrImageFile hasura action which uses /ocr
DONE { method: 'POST', path: '/process-transcript-async/' }, v1.11.100 uses transcribeAudioAsync hasura action which uses /process-transcript-async
{ method: 'POST', path: '/subscribe-user' } (I assume this failed but didn't test)
DONE { method: 'POST', path: '/delete-user' } v1.11.100 uses deleteUser hasura action which uses /delete-user

Required - path used by v1.11.100 no longer support
DONE { method: 'GET', path: '/v1/users/:id' }, -> { method: 'GET', path: '/v1/user' },
DONE { method: 'DELETE', path: '/v1/users/:id' }, -> { method: 'DELETE', path: '/v1/user' },
DONE { method: 'PATCH', path: '/v1/users/:id' }, -> { method: 'PATCH', path: '/v1/user/settings' }

### remove unsed imports

import "./modules/files";

- /upload (it was unsed)
- /images/:filename (unsued)
  These are both unused in the v0.11.100 build. Removed

import "./modules/transcript";

- /process-transcript/
  Unused in the v0.11.100 build. Removed

import "./modules/public-note";
used by getPublicNote which is used in v0.11.100. Keeping. Moved to legacy routes.

import "./modules/user-public-notes";
same as /public-note

### test

- deploy new backend to preview
- run v0.11.100 locally, pointed at the new backend
- confirm tests work
- confirm legacy routes require a hasura password
- confirm user routes still work on latest app
- test public notes. one and many

## What v1 user routes w/ id in it do we need?

User handle update uses a mutation w/o a hasura action, so doesn't need any routes supporting it

User password change uses UserApiResource.update which does a
PATCH v1/users/:id request
{ id: string, body: { password: string } }

User delete uses DeleteUser action, which users the /delete-user route we've already added
(this is kinda sketch tbh. maybe should remove)

User info uses UserApiResource.get which does a
GET v1/users/:id request

## Fix user stuff

Added back route for GET /v1/users/:id

Seeing and updating user handles works now

Public notes works now too (needed to remove the middleware)

Does /v1/users/:id/public-notes still work now that I introduced /v1/users/:id ?
YES

## testing the large account failure

### sql scripts to upload data

```
CREATE TABLE public.user (
    id text PRIMARY KEY,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    handle text UNIQUE,
    settings jsonb DEFAULT '{}'
);

CREATE TABLE public.thoughtstream (
    id text PRIMARY KEY,
    author_id text NOT NULL,
    namespace text NOT NULL,
    name text NOT NULL
);

CREATE TABLE public.note (
    id text PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    tokens jsonb NOT NULL,
    position text NOT NULL,
    author_id text NOT NULL,
    thoughtstream_id text NOT NULL,
    deleted_at timestamptz,
    inserted_at char(8),
    position_in_pinned text,
    folder_id text,
    import_source text,
    import_batch text,
    import_foreign_id text,
    read_all boolean,
    server_update_timestamp timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expansion_setting text,
    direct_url_only boolean NOT NULL DEFAULT TRUE,
    is_shared_privately boolean NOT NULL DEFAULT FALSE,
    simon_hash text,
    simon_updated_at timestamptz
);

CREATE TABLE public.folder (
    id text PRIMARY KEY,
    name text NOT NULL,
    parent_id text,
    author_id text NOT NULL,
    position text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    thoughtstream_id text NOT NULL,
    server_update_timestamp timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.entity (
    id text PRIMARY KEY,
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    thoughtstream_id text NOT NULL,
    has_migrated boolean NOT NULL DEFAULT false
);

CREATE TABLE public.hashtag (
    id text PRIMARY KEY,
    content text NOT NULL,
    first_used_at text NOT NULL,
    thoughtstream_id text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
```

```
DELETE FROM public.note WHERE author_id = 'auth0|66cf7dc8e6340115a4adda23';
DELETE FROM public.folder WHERE author_id = 'auth0|66cf7dc8e6340115a4adda23';


```

```
-- Function to generate a random 10-character string for IDs
CREATE OR REPLACE FUNCTION random_string(length integer) RETURNS text AS $$
DECLARE
  chars text[] := '{0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z}';
  result text := '';
  i integer := 0;
BEGIN
  IF length < 0 THEN
    RAISE EXCEPTION 'Given length cannot be less than 0';
  END IF;
  FOR i IN 1..length LOOP
    result := result || chars[1+random()*(array_length(chars, 1)-1)];
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Insert 10,000 notes
DO $$
DECLARE
  user_id text := 'auth0|66cf7dc8e6340115a4adda23'; -- Replace with the actual user ID
  note_content jsonb := '[{"type": "paragraph","tokenId": "ER-VH3mhLj","content": [{"type": "text","marks": [],"content": "Hello world!"}],"depth": 0}]'::jsonb;
  current_timestamp timestamptz := now();
BEGIN
  FOR i IN 1..10 LOOP
    note_content := format('[{"type": "paragraph","tokenId": "ER-VH3mhLj","content": [{"type": "text","marks": [],"content": "Hello world! (index: %s, timestamp: %s)"}],"depth": 0}]',
                           i,
                           to_char(current_timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'))::jsonb;
    INSERT INTO public.note (
      id,
      created_at,
      updated_at,
      tokens,
      position,
      author_id,
      thoughtstream_id,
      inserted_at
    ) VALUES (
      random_string(10),
      current_timestamp,
      current_timestamp,
      note_content,
      'a' || i::text,
      user_id,
      user_id,
      to_char(current_date, 'YYYYMMDD')
    );
  END LOOP;
END $$;

-- Clean up the temporary functions
DROP FUNCTION random_string(integer);
```

# now

### ts scripts to export/upload data

see taylor/test-scripts

### scaled up api

wendell on staging
auth0|5fa047ea4a31900068f1c75d
ideaflow.test.1@gmail (auth0) on local
auth0|66cf7dc8e6340115a4adda23
ideaflow.test.1@gmail (auth0) on staging
auth0|66cf7dc8e6340115a4adda23

Updated api to return git commit so I can be sure what version is running
I exported wendell's mega account and scaled it down to ~50MB. If the app can load that, that's good enough for me.
I imported it to my account on staging, and it failed to load. Looking at aws, the cpu and memory were maxing out.
Scaled everything up 4x and my account with ~50MB of data loads fine now.
