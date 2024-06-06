# Testing (part of #Supabase-WorkFlow)

# Testing Pg 

- Create pgtap tests in `<rootdir>/supabase/tests/database` 
- Run them with `<rootdir>/buildscripts/supabase/test_db.sh`

# Testing Edge Functions

It uses Deno's core testing (i.e. the fact it might be a Edge/Deploy function is irrevelant... it can do that with a fetch, but it's agnostic).

Unlike Edge/Deploy functions, a lot of things aren't managed for you. Namely: 
- Environment variables aren't loaded (see below for a solution)
- You must be responsible for cleaning up things like Postgres Pools at the end of the test (see Troubleshooting about dangling/leaking).
    - You're also responsible for making sure no async code runs beyond the end of the test. I.e. be rigorous with 'await'. 

## Using .env
Make a .env in the same directory as the tests are run from (`deno test`), and in every test file, make sure you have `import "https://deno.land/x/dotenv@v3.2.2/load.ts"` as the head to load it. 

The build script `./build/supabase_test_functions.sh` helpfully compiles your .env.local _and_ the inbuilt "SUPABASE_" keys (normally automatically provided by Supabase Edge Functions) into your testing .env file. 


## Logging
- `console.log` in your tests go straight to the `deno test` output
- `console.log` in your Edge/Deploy functions are output from `./build/supabase_local_functions.sh` (specifically: `npx supabase functions serve`)
- Postgres notifications (e.g. RAISE) are output from `./build/supabase_local_functions.sh` (specifically: `npx supabase functions serve`)
    - Also look at pgAudit 

## Postgres rollback

### It is possible 

The Postgres helper code has a function setGlobalTestingTransaction, which can be passed a postgres.Transaction object that the test set up. 
When the test finishes, call transaction.rollback() to remove all changes. 

Note it's not _quite_ the same test, as bugs may be hidden/caused by everything using the same transaction (e.g. race conditions fighting for the pool to release a new connection all disappear in a single uber transaction). 

I'm not sure it's better than doing a database reset every time, but that's very slow. 

### But recommended: write your tests to not care how many millions of previous rows might exist 

E.g. don't rely on asserting "there are now 2 rows in the database", instead assert "there are 2 _more_ rows" or even better, know what you added and check values specifically on the rows. 

## Debugging

So far, Logging isn't quite capturing everything - especially if it's a problem deeper inside Deno (e.g. the 'dangling/leaking' errors). 
The classic naive techniques work best: 
- add console logs to try to follow the flow 
- comment all the code out in the rough problem area until it runs, then slowly reintroduce it 

So far, the most common gotchas: 
- Sloppy missing awaits (so async code runs beyond the test / things run in parallel)
- Race conditions getting Postgres.Pool to release a connection (e.g. a transaction runs, but before it can finish it needs to do a query using another connection, but Postgres.Pool is at capacity, so the transaction can never complete, further tying up connections forever). Solution: try to never make a transaction commiting rely on another separate connection. 


## Troubleshooting: Testing

## Complaints of 'Bad resource ID' or 'dangling promise, event/timeout handler or top-level code' 

Check every async function has an *await*.
This is typically caused by the test ending while code is still trying to run. 
E.g. the test ends but an async function is trying to read the database. 

## Complaints of 'leaking resources' or 'A TCP connection was opened/accepted during the test, but not closed during the test' or mention of 'tcpConn.close()'

You must close the Postgres Pool at the end of the test (in Deno Deploy/Supabase, this is handled for you / no one cares). 
- `createTestingTransaction` in use? Are you using createTestingTransaction? Make sure you call *await* testingTransaction.end();
    - Be aware that if you don't `AWAIT createTestingTransaction` or `AWAIT testingTransaction.reset`, you introduce a point where the code might unexpectedly invoke `getGlobalPostgresPool`
- `getGlobalPostgresPool` in use (possibly unexpectedly by some code)? You must call *await* endGlobalPostgresPool()


Alternatively it could be caused by the 'await' problem above. 

## Complaints of 'AddrInUse: Address already in use' (maybe on 'Deno.listen')

If you import a Edge Function file - specifically that calls 'serve' immediately - it'll crash. 
Don't import Edge Function files!

## Complaints of 'name resolution failed'

Restart the Docker container
`./build/supabase_restart.sh`

## Reach the maximum deployed functions, but have fewer than 10? 

10 is the limit on the free plan. 

If you delete functions locally, you still need to delete them manually from the Supabase dashboard to bring the count down. 