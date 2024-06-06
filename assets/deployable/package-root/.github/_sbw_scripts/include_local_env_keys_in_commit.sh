#!/bin/sh

# DO NOT EDIT THE INSTALLED VERSION. Part of Supabase Workflow.

# Extracts the keys from .env.local (which isn't in the git repo) into a commitable text file, so GitHub Actions can use it for pre-deployment checks (e.g. making sure the servers have matching keys)
#
# INSTALLATION
# - Go to .git/hooks
# - If pre-commit doesn't exist, create it and run `chmod +x pre-commit`
# - Update pre-commit by adding a line that calls this file, e.g. `source .github/_scripts/include_local_env_keys_in_commit.sh`

# Move to current so that relative paths work
cd "$(dirname "${BASH_SOURCE[0]}")"

source _shared.sh

# Define the branches you want run this on
COMMIT_LOCAL_ENV_ALLOWED_BRANCHES="develop main"

# Get the name of the current branch
CURRENT_BRANCH=$(git symbolic-ref --short HEAD)

if echo "$COMMIT_LOCAL_ENV_ALLOWED_BRANCHES" | grep -qw "$CURRENT_BRANCH"; then

    if [ ! -f "../$LOCAL_ENV_FILE_RELATIVE_TO_DOTGH_DEFAULT" ]; then
        echo "Could not find local env file ($LOCAL_ENV_FILE_RELATIVE_TO_DOTGH_DEFAULT). Please check the variable in ./shared.sh"
        exit 1
    fi 

    # Read .env file, get keys (words before '=') where lines are not empty nor comments
    grep -v '^#\|^$' "../$LOCAL_ENV_FILE_RELATIVE_TO_DOTGH_DEFAULT" | cut -d= -f1 > "../$LOCAL_ENV_KEYS_FILE_RELATIVE_TO_DOTGH_DEFAULT" || exit 1

    # Add env_keys.txt to git commit
    git add "../$LOCAL_ENV_KEYS_FILE_RELATIVE_TO_DOTGH_DEFAULT"
    echo "Extracted local env keys into $LOCAL_ENV_KEYS_FILE_RELATIVE_TO_DOTGH_DEFAULT, and included in the commit"
else 
    echo "Skipping Commit Local Env Keys as this is not a develop/main branch"
fi