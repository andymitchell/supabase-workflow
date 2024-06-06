function supabase_login {
    # Login to Supabase
    will_fail_if_logged_out=$( { npx supabase projects list; } 2>&1 ) 
    if grep -qF "Unauthorized" <<< "${will_fail_if_logged_out}"; then
        echo "Logging in"
        npx supabase login
    else 
        echo "Logged in"
    fi
}