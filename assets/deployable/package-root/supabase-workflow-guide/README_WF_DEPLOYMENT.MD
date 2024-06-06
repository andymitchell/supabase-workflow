# Auto Deploy the Local Environment - Migrations, Edge Functions - to Staging/Production  (part of #Supabase-WorkFlow)

## What it'll do
- Every commit to Git branches 'develop' or 'main' will deploy to the Supabase projects you set up for 'staging' and 'production' 
- Pre-deployment checks will make sure the expected .env.local keys are present on the staging/production Supabase projects

## Quick Start 

- Create 2 new projects in Supabase for staging / production
- Update the GitHub repository's Secrets (via Settings > Secrets and Variables), as per `staging.yaml`/`production.yaml`
    - State each Supabase project's ID, database password 
    - The Supabase access token is available from the Dashboard, in your account 
- Run `deploy.sh` in the root, or do it manually: 
    - Copy the following directories into your Git repository root:
        - .github
    - Set up a Git Hooks `pre-commit` (add file `./git/pre-commit`) to run `./_scripts/include_local_env_keys_in_commit.sh`

### Other customisations
- You're expected to store env variables in `<root>/supabase/.env.local`. To customise: 
    - Update LOCAL_ENV_FILE_RELATIVE_TO_DOTGH_DEFAULT in `./_scripts/shared.sh` (relative to repository's .github folder)
- You're expected to let it copy the keys used in .env.local into the publicly commitable `<root>/supabase/env_expected_keys.txt`. To customise:
    - Update LOCAL_ENV_KEYS_FILE_RELATIVE_TO_DOTGH_DEFAULT in `./_scripts/shared.sh` (relative to repository's .github folder)

## How to use it

### Triggers

- Commit to `develop` branch, and it deploys it to staging
- Commit to `main` branch, and it deploys it to production 

(This is managed by the GitHub Actions staging.yaml and production.yaml)

_Recommendation: use feature branches for individual features, and pull-request/merge them back into develop. See ../build/git/README_

### Pre-Deployment Checks

- Ensure that staging/production have the same environment variables as the local .env [supabase_check_secrets.sh]
    - It prevents deployment if missing (a common cause of non-obvious bugs)
    - If warns if the values differ between staging/production (you mostly want them aligned)

### Fully Reset Staging (including database)

- In the Supabase dashboard:
    - Drop the existing Supabase project
    - Create a new Supabase project
- Set it up as you did the first time (by updating the GitHub Secrets to point to the new project id / db)

## How It Works (background information)

GitHub Actions just require certain .github workflow files to be in your repository: that's sufficient to set them up. 

The GitHub Actions run the supabase CLI commands to link your local repo and push it to a Supabase project/server. 

Git Hooks run automatically when they find a trigger-named file in .git/hooks (e.g. pre-commit). 

We need a pre-commit hook because .env.local can't be committed to Git, but the Pre-Deployment Checks need to know what keys to check the Supabase projects/servers for... so the pre-commit extracts the keys and puts them into a commitable file. 

## Future Improvements

- There are repeated instructions between staging/production, that could be put into a shared shell script in src/.github/_scripts