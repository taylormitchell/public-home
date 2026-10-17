Introduction
This guide walks you through the steps required to build a complete Replicache app, including the backend, from scratch.



You can follow the steps exactly to end up with a simple chat app, or use them as guide to build your own Replicache-enabled app.

Prerequisites
You need Node.js, version 16.20.1 or higher to get started.

You should also already understand How Replicache Works at a high level.

Setup
Replicache is framework agnostic, and you can use most any libraries and frameworks you like.

In this guide, we're going to use Express/Vite/React. To start, clone the BYOB starter repo:

git clone git@github.com:rocicorp/byob-starter.git
cd byob-starter
npm install

This project is a monorepo web app with three workspaces: client, server, and shared. The client workspace contains the client-side UI, developed with Vite and React. The server workspace contains the server-side logic, implemented using Express. And the shared workspace contains types and classes that are shared between client and server.

Client View
An easy way to start a Replicache project is to design your Client View schema and start serving it. That's because the Client View is the interface between the client and server — the data that the UI renders, and that the server must provide.

The Client View is a map from string keys to JSON-compatible values. Since we're trying to build a chat app, a simple list of messages is a decent starting point for our schema:

{
  "messages/l2WXAsRlA2Rg47sfGMdAK": {
    "from": "Jane",
    "order": 1,
    "content": "Hey, what's up for lunch?"
  },
  "messages/g0Y8yLKobt0BpXwUrVJCK": {
    "from": "Fred",
    "order": 2,
    "content": "Taaaacos"
  }
}

(A real app would likely separate out the user entities, but this is good enough for our purposes.)

A quick word on IDs
Unlike with classic client/server apps, Replicache apps can't rely on the server to assign unique IDs. That's because the client is going to be working with data long before it reaches the server, and the client and server need a consistent way to refer to items.

Therefore, Replicache requires that clients assign IDs. Our sample apps typically use nanoid for this purpose, but any random ID will work.

Serving the Client View
Now that we know what our schema will look like, let's serve it. Initially, we'll just serve static data, but later we'll build it dynamically from data in the database.

Create a file in the project at server/src/pull.ts with the following contents:

import type {Request, Response, NextFunction} from 'express';

export async function handlePull(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.json({
      // We will discuss these two fields in later steps.
      lastMutationIDChanges: {},
      cookie: 42,
      patch: [
        {op: 'clear'},
        {
          op: 'put',
          key: 'message/qpdgkvpb9ao',
          value: {
            from: 'Jane',
            content: "Hey, what's for lunch?",
            order: 1,
          },
        },
        {
          op: 'put',
          key: 'message/5ahljadc408',
          value: {
            from: 'Fred',
            content: 'tacos?',
            order: 2,
          },
        },
      ],
    });
  } catch (e) {
    next(e);
  }
}

Add the handler to Express modifying the file server/src/main.ts with the app.post route:

import { handlePull } from './pull';
//...
app.use(express.urlencoded({extended: true}), express.json(), errorHandler);

app.post('/api/replicache/pull', handlePull);

if (process.env.NODE_ENV === 'production') {
//...

You'll notice the JSON we're serving is a little different than our idealized schema above.

The response from replicache/pull is actually a patch — a series of changes to be applied to the map the client currently has, as a result of changes that have happened on the server. Replicache applies the patch operations one-by-one, in-order, to its existing map. See Pull Endpoint for more details.

Early in development, it's easiest to just return a patch that replaces the entire state with new values, which is what we've done here. Later in this tutorial we will improve this to return only what has changed.

info
Replicache forks and versions the cache internally, much like Git. You don't have to worry about changes made by the app to the client's map between pulls being clobbered by remote changes via patch. Replicache has a mechanism ensuring that local pending (unpushed) changes are always applied on top of server-provided changes (see Local Mutations).

Also, Replicache is a transactional key/value store. So although the changes are applied one-by-one, they are revealed to your app (and thus to the user) all at once because they're applied within a single transaction.

Start your client and server with cd client && npm run watch, and curl the pull endpoint to ensure it's working:

curl -X POST http://localhost:8080/api/replicache/pull

Render UI
The next step is to use the data in the Client View to render your UI.

First, let's define a few simple types. Replicache supports strongly-typed mutators – we'll use these types later to ensure our UI passes the correct data. Modify the types.ts at shared/src/types.ts

export type Message = {
  from: string;
  content: string;
  order: number;
};

export type MessageWithID = Message & {id: string};

Now we'll build the UI. The model is that the view is a pure function of the data in Replicache. Whenever the data in Replicache changes — either due to local mutations or syncing with the server — subscriptions will fire, and your UI components re-render. Easy.

To create a subscription, use the useSubscribe() React hook. You can do multiple reads and compute a result. Your React component only re-renders when the returned result changes.

Let's use a subscription to implement our chat UI. Replace index.tsx with the below code:

/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {useEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom/client';
import {Replicache, TEST_LICENSE_KEY, WriteTransaction} from 'replicache';
import {Message, MessageWithID} from 'shared';
import {useSubscribe} from 'replicache-react';
import Pusher from 'pusher-js';
import {nanoid} from 'nanoid';

async function init() {
  const licenseKey =
    import.meta.env.VITE_REPLICACHE_LICENSE_KEY || TEST_LICENSE_KEY;
  if (!licenseKey) {
    throw new Error('Missing VITE_REPLICACHE_LICENSE_KEY');
  }

  function Root() {
    const [r, setR] = useState<Replicache<any> | null>(null);

    useEffect(() => {
      console.log('updating replicache');
      const r = new Replicache({
        name: 'chat-user-id',
        licenseKey,
        pushURL: `/api/replicache/push`,
        pullURL: `/api/replicache/pull`,
        logLevel: 'debug',
      });
      setR(r);
      listen(r);
      return () => {
        void r.close();
      };
    }, []);

    const messages = useSubscribe(
      r,
      async tx => {
        const list = await tx
          .scan<Message>({prefix: 'message/'})
          .entries()
          .toArray();
        list.sort(([, {order: a}], [, {order: b}]) => a - b);
        return list;
      },
      {default: []},
    );

    const usernameRef = useRef<HTMLInputElement>(null);
    const contentRef = useRef<HTMLInputElement>(null);

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      // TODO: Create Message
    };

    return (
      <div>
        <form onSubmit={onSubmit}>
          <input ref={usernameRef} required /> says:
          <input ref={contentRef} required /> <input type="submit" />
        </form>
        {messages.map(([k, v]) => (
          <div key={k}>
            <b>{v.from}: </b>
            {v.content}
          </div>
        ))}
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <Root />
    </React.StrictMode>,
  );
}

function listen(rep: Replicache) {
  // TODO: Listen for changes on server
}

await init();

Navigate to http://localhost:5173/. You should see that we're rendering data from Replicache!

This might not seem that exciting yet, but notice that if you change replicache/pull temporarily to return 500 (or remove it, or cause any other error, or just make it really slow), the page still renders instantly.

That's because we're rendering the data from the local cache on startup, not waiting for the server! Woo.

Local Mutations
With Replicache, you implement mutations once on the client-side (sometimes called speculative or optimistic mutations), and then again on the server (called authoritative mutations).

info
The two implementations need not match exactly. Replicache replaces the result of a speculative change completely with the result of the corresponding authoritative change, once it's known. This is useful because it means the speculative implementation can frequently be pretty simple, not taking into account security, complex business logic edge cases, etc.

First, let's register a mutator that speculatively creates a message. In index.tsx, expand the options passed to the Replicache constructor with:

//...
const r = new Replicache({
  name: 'chat-user-id',
  licenseKey,
  mutators: {
    async createMessage(
      tx: WriteTransaction,
      {id, from, content, order}: MessageWithID,
    ) {
      await tx.set(`message/${id}`, {
        from,
        content,
        order,
      });
    },
  },
  pushURL: `/api/replicache/push`,
  pullURL: `/api/replicache/pull`,
  logLevel: 'debug',
});
//...

When invoked, the implementation is run within a transaction (tx) and it puts the new message into the local map.

Now let's invoke the mutator when the user types a message. Replace the content of onSubmit so that it invokes the mutator:

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      let last: Message | null = null;
      if (messages.length) {
        const lastMessageTuple = messages[messages.length - 1];
        last = lastMessageTuple[1];
      }
      const order = (last?.order ?? 0) + 1;
      const username = usernameRef.current?.value ?? '';
      const content = contentRef.current?.value ?? '';

      await r?.mutate.createMessage({
        id: nanoid(),
        from: username,
        content,
        order,
      });

      if (contentRef.current) {
        contentRef.current.value = '';
      }
    };

Previously we mentioned that Replicache has a mechanism that ensures that local, speculative changes are always applied on top of changes from the server. The way this works is that when Replicache pulls and applies changes from the server, any mutator invocations that have not yet been confirmed by the server are replayed on top of the new server state. This is much like a git rebase, and the effects of the patch-and-replay are revealed atomically to your app.

An important consequence of this is that unique IDs should often be passed into mutators as parameters, and not generated inside the mutator. This may be counter-intuitive at first, but it makes sense when you remember that Replicache is going to replay this transaction during sync, and we don't want the ID to change!

info
Careful readers may be wondering what happens with the order field during sync. Can multiple messages end up with the same order? Yes! But in this case, what the user likely wants is for their message to stay roughly at the same position in the stream, and using the client-specified order and sorting by that roughly achieves the desired result. If we wanted better control over this, we could use fractional indexing but that's not necessary in this case.

Restart the server and you should now be able to make changes. Note that changes are already propagating between tabs, even though we haven't done anything on the server yet. And this works even if you kill the server. This is because Replicache stores data locally that is shared between all tabs in a browser profile.

Dynamic Pull
Even though in the previous step we're making persistent changes in the database, we still aren't serving that data in the pull endpoint – it's still static 🤣. Let's fix that now.

The implementation of pull will depend on the backend strategy you are using. For the Global Version strategy we're using, the basics steps are:

Open a transaction
Read the latest global version from the database
Build the response patch:
If the request cookie is null, this patch contains a `put` for each entity in the database that isn't deleted
Otherwise, this patch contains only entries that have been changed since the request cookie
Build a map of changes to client `lastMutationID` values:
If the request cookie is null, this map contains an entry for every client in the requesting `clientGroup`
Otherwise, it contains only entries for clients that have changed since the request cookie
Return the patch, the current global `version`, and the `lastMutationID` changes as a `PullResponse` struct
Implement Pull
Replace the contents of server/src/pull.ts with this code:

import {serverID, tx, type Transaction} from './db';
import type {PatchOperation, PullResponse} from 'replicache';
import type {Request, Response, NextFunction} from 'express';

export async function handlePull(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const resp = await pull(req, res);
    res.json(resp);
  } catch (e) {
    next(e);
  }
}

async function pull(req: Request, res: Response) {
  const pull = req.body;
  console.log(`Processing pull`, JSON.stringify(pull));
  const {clientGroupID} = pull;
  const fromVersion = pull.cookie ?? 0;
  const t0 = Date.now();

  try {
    // Read all data in a single transaction so it's consistent.
    await tx(async t => {
      // Get current version.
      const {version: currentVersion} = await t.one<{version: number}>(
        'select version from replicache_server where id = $1',
        serverID,
      );

      if (fromVersion > currentVersion) {
        throw new Error(
          `fromVersion ${fromVersion} is from the future - aborting. This can happen in development if the server restarts. In that case, clear appliation data in browser and refresh.`,
        );
      }

      // Get lmids for requesting client groups.
      const lastMutationIDChanges = await getLastMutationIDChanges(
        t,
        clientGroupID,
        fromVersion,
      );

      // Get changed domain objects since requested version.
      const changed = await t.manyOrNone<{
        id: string;
        sender: string;
        content: string;
        ord: number;
        version: number;
        deleted: boolean;
      }>(
        'select id, sender, content, ord, version, deleted from message where version > $1',
        fromVersion,
      );

      // Build and return response.
      const patch: PatchOperation[] = [];
      for (const row of changed) {
        const {id, sender, content, ord, version: rowVersion, deleted} = row;
        if (deleted) {
          if (rowVersion > fromVersion) {
            patch.push({
              op: 'del',
              key: `message/${id}`,
            });
          }
        } else {
          patch.push({
            op: 'put',
            key: `message/${id}`,
            value: {
              from: sender,
              content,
              order: ord,
            },
          });
        }
      }

      const body: PullResponse = {
        lastMutationIDChanges: lastMutationIDChanges ?? {},
        cookie: currentVersion,
        patch,
      };
      res.json(body);
      res.end();
    });
  } catch (e) {
    console.error(e);
    res.status(500).send(e);
  } finally {
    console.log('Processed pull in', Date.now() - t0);
  }
}

async function getLastMutationIDChanges(
  t: Transaction,
  clientGroupID: string,
  fromVersion: number,
) {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const rows = await t.manyOrNone<{id: string; last_mutation_id: number}>(
    `select id, last_mutation_id
    from replicache_client
    where client_group_id = $1 and version > $2`,
    [clientGroupID, fromVersion],
  );
  return Object.fromEntries(rows.map(r => [r.id, r.last_mutation_id]));
}


Because the previous pull response was hard-coded and not really reading from the database, you'll now have to clear your browser's application data to see consistent results. On Chrome/OSX for example: cmd+opt+j → Application tab -> Storage -> Clear site data.

Once you do that, you can make a change in one browser and then refresh a different browser and see them round-trip:

Also notice that if we go offline for awhile, make some changes, then come back online, the mutations get sent when possible.

We don't have any conflicts in this simple data model, but Replicache makes it easy to reason about most conflicts. See the How Replicache Works for more details.

The only thing left is to make it live — we obviously don't want the user to have to manually refresh to get new data 🙄.



Remote Database

Replicache is also backend-agnostic. You can use most backend languages and frameworks, and any backend datastore that supports at least Snapshot Isolation.

Some examples of suitable datastores are: MySQL, Postgres, CockroachDB, CosmosDB, and Firebase Cloud Firestore. Some examples of non-suitable datastores are: DynamoDB and Firebase RealtimeDB.

info
Snapshot isolation is required for correct operation of Replicache. See Database Isolation Level for more information.

Database Setup
For this demo, we'll use pg-mem — an in-memory implementation of Postgres. This is a nice easy way to play locally, but you can easily adapt this sample to use a remote Postgres implementation like Render or Supabase.

Create a new file server/src/db.ts with this code:

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {newDb} from 'pg-mem';
import pgp, {IDatabase, ITask} from 'pg-promise';

const {isolationLevel} = pgp.txMode;

export const serverID = 1;

async function initDB() {
  console.log('initializing database...');
  const db = newDb().adapters.createPgPromise();
  return db;
}

function getDB() {
  // Cache the database in the Node global so that it survives HMR.
  if (!global.__db) {
    global.__db = initDB();
  }
  // eslint-disable-next-line @typescript-eslint/ban-types
  return global.__db as IDatabase<{}>;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type Transaction = ITask<{}>;
type TransactionCallback<R> = (t: Transaction) => Promise<R>;

// In Postgres, snapshot isolation is known as "repeatable read".
export async function tx<R>(f: TransactionCallback<R>, dbp = getDB()) {
  const db = await dbp;
  return await db.tx(
    {
      mode: new pgp.txMode.TransactionMode({
        tiLevel: isolationLevel.repeatableRead,
      }),
    },
    f,
  );
}

Remote Schema
There are a number of ways to implement Replicache backends.

The Replicache client doesn't actually care how your backend works internally — it only cares that you provide correctly implemented push and pull endpoints.

This walkthrough implements the Global Version backend strategy, which is a simple strategy that we usually recommend users start with. See Backend Strategies for information on other commonly used strategies.

Define the Schema
Let's define our Postgres schema. As suggested in the Global Version Strategy doc, we'll track:

Global Version: The version the backend database is currently at.
Clients: Clients that have connected to the server, and the last mutationID processed from each. This is used during push to ensure mutations are processed only once, and in the order they happened on the client. We also store each client's clientGroupID, which is needed to correctly implement pull.
Domain Data: The user data the application stores to do its job. Each stored item has a few extra Replicache-specific attributes:
version: The version of the containing space that this item was last updated at. Used to calculate a diff during pull.
deleted: A soft delete used to communicate to clients during pull that a item was logically deleted.
Modify db.ts so that initDb looks like:

async function initDB() {
  console.log('initializing database...');
  const db = newDb().adapters.createPgPromise();
  await tx(async t => {
    // A single global version number for the entire database.
    await t.none(
      `create table replicache_server (id integer primary key not null, version integer)`,
    );
    await t.none(
      `insert into replicache_server (id, version) values ($1, 1)`,
      serverID,
    );

    // Stores chat messages.
    await t.none(`create table message (
        id text primary key not null,
        sender varchar(255) not null,
        content text not null,
        ord integer not null,
        deleted boolean not null,
        version integer not null)`);

    // Stores last mutationID processed for each Replicache client.
    await t.none(`create table replicache_client (
        id varchar(36) primary key not null,
        client_group_id varchar(36) not null,
        last_mutation_id integer not null,
        version integer not null)`);

    // TODO: indexes
  }, db);
  return db;
}

Remote Mutations
Replicache will periodically invoke your push endpoint sending a list of mutations that need to be applied.

The implementation of push will depend on the backend strategy you are using. For the Global Version strategy we're using, the basics steps are:

Open a transaction.
Read the current global version and compute the next one.
Create a client record for the requesting client if the client is new.
Validate that the received mutation is the next expected one. If the received mutation has already been processed (by a previous push), skip it. If the received mutation is not expected, then error.
Run the received mutation by making the requested changes to the backend database. For any modified domain data objects, update their version to the new global version.
Update the stored version and lastMutationID for the pushing client, so that pull can later report the last-processed mutationID.
Store the new global version.
At minimum, all of these changes must happen atomically in a single transaction for each mutation in a push. However, putting multiple mutations together in a single wider transaction is also acceptable.

Implement Push
Create a file in the project at server/src/push.ts and copy the below code into it.

This looks like a lot of code, but it's just implementing the description above. See the inline comments for additional details.

import {serverID, tx, type Transaction} from './db';
import type {MessageWithID} from 'shared';
import type {MutationV1, PushRequestV1} from 'replicache';
import type {Request, Response, NextFunction} from 'express';

export async function handlePush(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await push(req, res);
  } catch (e) {
    next(e);
  }
}

async function push(req: Request, res: Response) {
  const push: PushRequestV1 = req.body;
  console.log('Processing push', JSON.stringify(push));

  const t0 = Date.now();
  try {
    // Iterate each mutation in the push.
    for (const mutation of push.mutations) {
      const t1 = Date.now();

      try {
        await tx(t => processMutation(t, push.clientGroupID, mutation));
      } catch (e) {
        console.error('Caught error from mutation', mutation, e);

        // Handle errors inside mutations by skipping and moving on. This is
        // convenient in development but you may want to reconsider as your app
        // gets close to production:
        // https://doc.replicache.dev/reference/server-push#error-handling
        await tx(t =>
          processMutation(t, push.clientGroupID, mutation, e as string),
        );
      }

      console.log('Processed mutation in', Date.now() - t1);
    }

    res.send('{}');

    await sendPoke();
  } catch (e) {
    console.error(e);
    res.status(500).send(e);
  } finally {
    console.log('Processed push in', Date.now() - t0);
  }
}

async function processMutation(
  t: Transaction,
  clientGroupID: string,
  mutation: MutationV1,
  error?: string | undefined,
) {
  const {clientID} = mutation;

  // Get the previous version and calculate the next one.
  const {version: prevVersion} = await t.one(
    'select version from replicache_server where id = $1 for update',
    serverID,
  );
  const nextVersion = prevVersion + 1;

  const lastMutationID = await getLastMutationID(t, clientID);
  const nextMutationID = lastMutationID + 1;

  console.log('nextVersion', nextVersion, 'nextMutationID', nextMutationID);

  // It's common due to connectivity issues for clients to send a
  // mutation which has already been processed. Skip these.
  if (mutation.id < nextMutationID) {
    console.log(
      `Mutation ${mutation.id} has already been processed - skipping`,
    );
    return;
  }

  // If the Replicache client is working correctly, this can never
  // happen. If it does there is nothing to do but return an error to
  // client and report a bug to Replicache.
  if (mutation.id > nextMutationID) {
    throw new Error(
      `Mutation ${mutation.id} is from the future - aborting. This can happen in development if the server restarts. In that case, clear appliation data in browser and refresh.`,
    );
  }

  if (error === undefined) {
    console.log('Processing mutation:', JSON.stringify(mutation));

    // For each possible mutation, run the server-side logic to apply the
    // mutation.
    switch (mutation.name) {
      case 'createMessage':
        await createMessage(t, mutation.args as MessageWithID, nextVersion);
        break;
      default:
        throw new Error(`Unknown mutation: ${mutation.name}`);
    }
  } else {
    // TODO: You can store state here in the database to return to clients to
    // provide additional info about errors.
    console.log(
      'Handling error from mutation',
      JSON.stringify(mutation),
      error,
    );
  }

  console.log('setting', clientID, 'last_mutation_id to', nextMutationID);
  // Update lastMutationID for requesting client.
  await setLastMutationID(
    t,
    clientID,
    clientGroupID,
    nextMutationID,
    nextVersion,
  );

  // Update global version.
  await t.none('update replicache_server set version = $1 where id = $2', [
    nextVersion,
    serverID,
  ]);
}

export async function getLastMutationID(t: Transaction, clientID: string) {
  const clientRow = await t.oneOrNone(
    'select last_mutation_id from replicache_client where id = $1',
    clientID,
  );
  if (!clientRow) {
    return 0;
  }
  return parseInt(clientRow.last_mutation_id);
}

async function setLastMutationID(
  t: Transaction,
  clientID: string,
  clientGroupID: string,
  mutationID: number,
  version: number,
) {
  const result = await t.result(
    `update replicache_client set
      client_group_id = $2,
      last_mutation_id = $3,
      version = $4
    where id = $1`,
    [clientID, clientGroupID, mutationID, version],
  );
  if (result.rowCount === 0) {
    await t.none(
      `insert into replicache_client (
        id,
        client_group_id,
        last_mutation_id,
        version
      ) values ($1, $2, $3, $4)`,
      [clientID, clientGroupID, mutationID, version],
    );
  }
}

async function createMessage(
  t: Transaction,
  {id, from, content, order}: MessageWithID,
  version: number,
) {
  await t.none(
    `insert into message (
    id, sender, content, ord, deleted, version) values
    ($1, $2, $3, $4, false, $5)`,
    [id, from, content, order, version],
  );
}

async function sendPoke() {
  // TODO
}


Add the handler to Express modifying the file server/src/main.ts with the app.post route:

import { handlePush } from './push';
//...
app.use(express.urlencoded({extended: true}), express.json(), errorHandler);

app.post('/api/replicache/pull', handlePull);
app.post('/api/replicache/push', handlePush);

if (process.env.NODE_ENV === 'production') {
//...

info
You may be wondering if it possible to share mutator code between the client and server. It is, but constrains how you can design your backend. See Share Mutators for more information.

Restart the server, navigate to http://localhost:5173/ and make some changes. You should now see changes getting saved in the server console output.


But if we check another browser, or an incognito window, the change isn't there. What gives?


Dynamic Pull
Even though in the previous step we're making persistent changes in the database, we still aren't serving that data in the pull endpoint – it's still static 🤣. Let's fix that now.

The implementation of pull will depend on the backend strategy you are using. For the Global Version strategy we're using, the basics steps are:

Open a transaction
Read the latest global version from the database
Build the response patch:
If the request cookie is null, this patch contains a `put` for each entity in the database that isn't deleted
Otherwise, this patch contains only entries that have been changed since the request cookie
Build a map of changes to client `lastMutationID` values:
If the request cookie is null, this map contains an entry for every client in the requesting `clientGroup`
Otherwise, it contains only entries for clients that have changed since the request cookie
Return the patch, the current global `version`, and the `lastMutationID` changes as a `PullResponse` struct
Implement Pull
Replace the contents of server/src/pull.ts with this code:

import {serverID, tx, type Transaction} from './db';
import type {PatchOperation, PullResponse} from 'replicache';
import type {Request, Response, NextFunction} from 'express';

export async function handlePull(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const resp = await pull(req, res);
    res.json(resp);
  } catch (e) {
    next(e);
  }
}

async function pull(req: Request, res: Response) {
  const pull = req.body;
  console.log(`Processing pull`, JSON.stringify(pull));
  const {clientGroupID} = pull;
  const fromVersion = pull.cookie ?? 0;
  const t0 = Date.now();

  try {
    // Read all data in a single transaction so it's consistent.
    await tx(async t => {
      // Get current version.
      const {version: currentVersion} = await t.one<{version: number}>(
        'select version from replicache_server where id = $1',
        serverID,
      );

      if (fromVersion > currentVersion) {
        throw new Error(
          `fromVersion ${fromVersion} is from the future - aborting. This can happen in development if the server restarts. In that case, clear appliation data in browser and refresh.`,
        );
      }

      // Get lmids for requesting client groups.
      const lastMutationIDChanges = await getLastMutationIDChanges(
        t,
        clientGroupID,
        fromVersion,
      );

      // Get changed domain objects since requested version.
      const changed = await t.manyOrNone<{
        id: string;
        sender: string;
        content: string;
        ord: number;
        version: number;
        deleted: boolean;
      }>(
        'select id, sender, content, ord, version, deleted from message where version > $1',
        fromVersion,
      );

      // Build and return response.
      const patch: PatchOperation[] = [];
      for (const row of changed) {
        const {id, sender, content, ord, version: rowVersion, deleted} = row;
        if (deleted) {
          if (rowVersion > fromVersion) {
            patch.push({
              op: 'del',
              key: `message/${id}`,
            });
          }
        } else {
          patch.push({
            op: 'put',
            key: `message/${id}`,
            value: {
              from: sender,
              content,
              order: ord,
            },
          });
        }
      }

      const body: PullResponse = {
        lastMutationIDChanges: lastMutationIDChanges ?? {},
        cookie: currentVersion,
        patch,
      };
      res.json(body);
      res.end();
    });
  } catch (e) {
    console.error(e);
    res.status(500).send(e);
  } finally {
    console.log('Processed pull in', Date.now() - t0);
  }
}

async function getLastMutationIDChanges(
  t: Transaction,
  clientGroupID: string,
  fromVersion: number,
) {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const rows = await t.manyOrNone<{id: string; last_mutation_id: number}>(
    `select id, last_mutation_id
    from replicache_client
    where client_group_id = $1 and version > $2`,
    [clientGroupID, fromVersion],
  );
  return Object.fromEntries(rows.map(r => [r.id, r.last_mutation_id]));
}


Because the previous pull response was hard-coded and not really reading from the database, you'll now have to clear your browser's application data to see consistent results. On Chrome/OSX for example: cmd+opt+j → Application tab -> Storage -> Clear site data.

Once you do that, you can make a change in one browser and then refresh a different browser and see them round-trip:

Also notice that if we go offline for awhile, make some changes, then come back online, the mutations get sent when possible.

We don't have any conflicts in this simple data model, but Replicache makes it easy to reason about most conflicts. See the How Replicache Works for more details.

The only thing left is to make it live — we obviously don't want the user to have to manually refresh to get new data 🙄.

