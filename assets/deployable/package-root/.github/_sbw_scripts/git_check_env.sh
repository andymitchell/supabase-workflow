#!/usr/bin/env bash

# DO NOT EDIT THE INSTALLED VERSION. Part of Supabase Workflow.
# Check the GitHub Actions environment has been set up with the minimum keys 

source _shared.sh
verify_minimum_bash_version

# Declare the associative array
declare -A key_value_pairs


# Add key-value pairs to the array, matching the ones in the workflow yaml
key_value_pairs["SUPABASE_ACCESS_TOKEN"]="$SUPABASE_ACCESS_TOKEN"
key_value_pairs["SUPABASE_DB_PASSWORD"]="$SUPABASE_DB_PASSWORD"
key_value_pairs["SUPABASE_PROJECT_ID"]="$SUPABASE_PROJECT_ID"
key_value_pairs["SUPABASE_PROJECT_IDS_TO_CHECK_SECRETS"]="$SUPABASE_PROJECT_IDS_TO_CHECK_SECRETS"

# Function to check for missing values
check_missing_values() {
    for key in "${!key_value_pairs[@]}"; do
        value=${key_value_pairs[$key]}
        if [ -z "$value" ]; then
            echo "Warning: Value for key '$key' is missing in GitHub repo (go to settings > secrets and variables, and add the ones found in the yaml files). See <root>/.github/README_DEPLOYMENT.MD for more."
            exit 1
        fi
    done
}

# Run the check
check_missing_values