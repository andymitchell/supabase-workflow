# DO NOT EDIT THE INSTALLED VERSION. Part of Supabase Workflow.

LOCAL_ENV_FILE_RELATIVE_TO_DOTGH_DEFAULT="../supabase/.env.local"
LOCAL_ENV_KEYS_FILE_RELATIVE_TO_DOTGH_DEFAULT="../supabase/env_expected_keys.txt"

function verify_minimum_bash_version {

    # 4 is needed for associative arrays 

    major_version=${BASH_VERSION%%.*}
    if (( major_version < 4 )); then
        echo "This requires at least Bash V4. FYI MacOS ships with 3.2, and you need to use brew to install a later version. Then at the head of the script use '#!/usr/bin/env bash' (without quotes) to tell it to use the first bash found in the env PATH - i.e. to effectively match the version of bash used in your terminal."
        exit 1;
    fi
}