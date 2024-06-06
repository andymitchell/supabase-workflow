## Supabase Workflow

A utility for Supabase projects
- One command to remember: `npx sbw`, which guides you to
    - The most common Supabase functions (start local functions, reset local db, run tests)
    - A practical feature-branch workflow for Git 
- One time setup that gives you
    - GitHub Workflows that automatically send 'develop' pushes to staging, and 'main' pushes to production
        - With safety steps to make sure
            - Environment variables used locally in .env have also been set on the servers 
    - Deno readiness
        - VSCode config for Deno
        - Set up Import Maps for Deno that work in both VSCode and Supabase
- A guide of best practices / troubleshooting for Supabase, built up over several months
    - How to update the local db, run tests, deploy
    - Common errors and their resolutions

## How to use it

1. `npm install -D @andyrmitchell/supabase-workflow` 
2. `npx sbw` (or `npx supabase-workflow`)