# Workflow (part of #Supabase-WorkFlow)

## Creating a database migration / Edge Function (or updating them)

1. Switch to the `develop` branch 
2. Checkout a new `feat/NAME` branch by running `./feature_create.sh`
3. Optionally create a migration with `touch supabase/migrations/<timestamp>_<description>.sql`

### Environment Variables

- Put them in .env.local (Supabase auto uses it, + it's used by testing and deployment scripts)

### Testing
- Use `<rootdir>/buildscripts/supabase/test_functions.sh` for Edge Functions tests in `<rootdir>/supabase/tests/functions`
- Use `<rootdir>/buildscripts/supabase/test_db.sh` for db tests in `<rootdir>/supabase/tests/database`
    - If your changes need seed data to experiment with, edit `<rootdir>/supabase/seed.sql`

### Deployment to Staging
1. Commit to the feature branch
2. Create a Pull Request back to `develop`, which will verify it in Staging, by running `./feature_pr_into_develop.sh` 
3. Go into GitHub to accept the Pull Request, and verify it's successfully migrated in `develop` branch. 
    - This will auto-deploy to the Supabase Staging project/server

### Deployment to Production
1. Create a PR from `develop` to `main` and merge it to deploy to the production project. 
2. Go into GitHub to accept the Pull Request, and verify it's successfully migrated in `main` branch. 
    - This will auto-deploy to the Supabase Production project/server

### Further reading
- How auto-deployment from branches works (and the pre checks that keep it safe) in [./.github/README_WF_DEPLOYMENT.MD]
- Guide on testing in [./README_WF_TESTING.MD] + copy at [<rootdir>/supabase/tests]

# What's #Supabase-WorkFlow?

It's a GitHub package of best practice buildscripts/config for Supabase projects, to enable feature branching, testing, staging/production auto-deployment and safety checks... peace of mind, basically. 

If you've just cloned this repo, and are wondering how to update it with Supabase-Workflow: 
- Clone andymitchell/supabase-workflow to an adjacent directory to this repo. 
- Run `./deploy.sh` in that directory, which will (safely) update various files/config in this repo. 
    - It explains what it's doing as it goes, so you have control. 

# TODO

- Explain EndPoint-Schemas and how they're updated on clients 

# Useful Knowledge 

_This is general Supabase / environmental knowledge from the Web_

- Database updates are done as migrations in `./supabase/migrations`
    - They are applied by either 
        - resetting the database: `<rootdir>/buildscripts/supabase/local_db_reset.sh`
        - migrating `supabase migration up --local` `<rootdir>/buildscripts/supabase/local_db_migrate.sh`


# Troubleshooting

## Deno won't cache in VS Code? 
e.g. error "missing field 'uri'"

Try reloading the VS Code window: 
- Cmd Shift P
- Reload Window

Try upgrading Deno
- Check current: `deno --version`
- Open Terminal 
- `brew upgrade deno`
- Reload VSCode Window (as above)

## TypeScript stops showing errors or importing in VS Code? 

It's unlikely to be settings, unless you changed something. 

- Try restarting VS Code
- Try closing all files, especially unsaved ones (this worked, weirdly)
- Try cmd+shift+p and Reload Window, Deno: Restart Language Server, Restart TS Server
- Load the Terminal pane, and switch to Problems and Output tabs for more clues (in Output, you can switch the server to view, e.g. Deno, TypeScript)

## Local Edge functions giving 503? 

Don't run a VPN. 
Try restarting Supabase.

## Cannot load local files (e.g. with Deno.readTextFile/readFile)

In Edge Functions (and Deno Deploy) there's no file system, and no --allow-read. Use imports instead.

## Any issues with it connecting to the local edge function / accessing Docker

First, check if it's just a simple user error
- Are functions running locally `./build/supabase_local_functions.sh`
- Are they presenting any errors in Terminal? 

Examples of real errors:
- Error response from daemon: driver failed programming external connectivity on endpoint supabase_db_jra. failed: port is already allocated

If not that, it's generally a good idea to: 
1. Restart Docker
2. Run `./build/supabase_restart.sh`
3. Run `npx supabase status` and make sure the URL is what you give to the Supabase Client (or is used in any direct http request)

If that's still failing, make sure both your Supabase CLI and Supabase Client packages are up to date (then maybe repeat the above). 

## Supabase won't start due to "database is not healthy"

It might take a really aggressive clean out of docker.

- Stop processes `docker kill $(docker ps -q)`
- Double check `npx supabase stop`
- Clear out the volume `docker volume prune --force --filter "label=com.supabase.cli.project=jra"`
    - The super aggressive form of this is: `docker volume prune -af`
- Run `npx supabase start`