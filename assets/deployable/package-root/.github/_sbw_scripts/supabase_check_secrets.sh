#!/usr/bin/env bash

# DO NOT EDIT THE INSTALLED VERSION. Part of Supabase Workflow.

# GOAL: Check that the supabase projects have the minimum expected keys defined, and warn if the key values are different across environments. (See #ENV_ENVIRONMENTS)

source _shared.sh
verify_minimum_bash_version


# Move to current so that relative paths work
cd "$(dirname "${BASH_SOURCE[0]}")"


# Read in the desired supabase projects to check (e.g. staging and production) as CSV, e.g. "ylublyitpa,ccilgcxigoubf". 
if [ -z "$SUPABASE_PROJECT_IDS_TO_CHECK_SECRETS" ]; then
    echo "SUPABASE_PROJECT_IDS_TO_CHECK_SECRETS required"
    # If you're testing, use this in the terminal: (export SUPABASE_PROJECT_IDS_TO_CHECK_SECRETS="ylublyitpaqfhpepvltz,ccilgcxigoubffvudwog"; ./supabase_check_secrets.sh)
    # In GitHub Actions yaml, you can define it like so... SUPABASE_PROJECT_IDS_TO_CHECK_SECRETS: ${{ secrets.STAGING_PROJECT_ID }},${{ secrets.PRODUCTION_PROJECT_ID }}
    exit 1
fi


# Read keys from env_keys.txt
LOCAL_ENV_KEYS_FILE_RELATIVE_TO_DOTGH="${LOCAL_ENV_KEYS_FILE_RELATIVE_TO_DOTGH:-$LOCAL_ENV_KEYS_FILE_RELATIVE_TO_DOTGH_DEFAULT}" # can be set as environment variables.
declare -a EXPECTED_SECRET_KEYS;
while IFS= read -r line; do
    if [ -n "$line" ]; then
        EXPECTED_SECRET_KEYS+=("$line")
    fi
done <<< "$(grep -v '^[#--//]' ../$LOCAL_ENV_KEYS_FILE_RELATIVE_TO_DOTGH)" # it takes  out comment lines

# Read in Project IDs from env variable 
# Convert comma-separated SUPABASE_PROJECT_IDS_TO_CHECK_SECRETS to an array
IFS=',' read -r -a project_ids <<< "$SUPABASE_PROJECT_IDS_TO_CHECK_SECRETS"

# Declare an associative array in the global scope
declare -A secrets_array

# Function to fetch Supabase secrets for a given project ID
function fetch_supabase_secrets() {
    local project_id=$1
    local header_passed=false

    # Verify the keys are the same across projects 
    local first_project=true
    if [[ ${#secrets_array[@]} -gt 0 ]]; then
        first_project=false
    fi
    
    # Fetch and parse secrets
    while IFS='│' read -r name digest; do
        # Trim leading and trailing whitespace
        name=$(echo -e "${name}" | tr -d '[:space:]')
        name=$(echo "$name" | sed 's/\x1b\[[0-9;]*m//g') # Gets rid of hidden ansi characters
        digest=$(echo -e "${digest}" | tr -d '[:space:]')
        digest=$(echo "$digest" | sed 's/\x1b\[[0-9;]*m//g') # Gets rid of hidden ansi characters

        # Process only if we are past the header
        if [ "$header_passed" = true ]; then

            # Test it's not empty, and the length is greater than 4 - because reading from the terminal, it appears to have invisible characters
            if [ -n "$name" ] && [ ${#name} -gt 4 ]; then
                
                # Test if the value of the digest for this key differs from other projects (e.g. between staging and production), which might be the cause of issues (but might also be ok - just warning)
                if [[ first_project = false ]]; then
                    # Check if ${secrets_array["$name"]} is not empty
                    if [[ -n ${secrets_array["$name"]} ]]; then
                        # Check if $name does not begin with SUPABASE_
                        if [[ $name != SUPABASE_* ]]; then
                            if [[ "$digest" != "${secrets_array["$name"]}" ]]; then
                                echo "::warning:: Digest for key '$key' varies across projects (possibly fine... but check its intentional as you typically want staging and production to match)"
                            fi
                        fi
                    fi
                fi

                secrets_array["$name"]=$digest
            fi
        fi

        # Check if we've passed the header (it's deceptive unicode: ────────────────────────────┼────────── )
        if [[ $name =~ "┼" ]]; then
            header_passed=true
            continue
        fi
    done < <(npx supabase secrets list --project-ref "$project_id")


    
    
    # Verify that the expected secret keys exist:
    for key in "${EXPECTED_SECRET_KEYS[@]}"; do
        if [ -z "${secrets_array[$key]}" ]; then
            echo "Key '$key' not found in project: ${project_id:0:3}, but is declared in the local .env of the committer (suggesting it's required). Update the Supabase projects (e.g. production and staging) with that key, or remove it from the local .env (e.g. .env.local - as defined in include_local_env_keys_in_commit.sh) and try again."
            exit 1
        fi
    done
}

for id in "${project_ids[@]}"; do
    fetch_supabase_secrets "$id"
done