TEST_PATTERN="$1"

clear

echo "Check if functions are served locally in another terminal tab, because you'll get more debug output (all console.logs) from there.\n\n"

# Move to the current 
cd "$(dirname "${BASH_SOURCE[0]}")"

# Move to the root
cd ..


# You can put tests anywhere (deno doesn't care, as long as its invoked in the same directory); but for convenience we expect them in this place
if [ ! -d "./supabase/tests/functions" ]; then
    echo "Error: Directory ./supabase/tests/functions does not exist!"
    exit 1
fi

# Merge contents of ./supabase/.env.local into .env
merge_local_env_into_test_env() {
    local test_env_path="./supabase/tests/functions/.env"
    
    while IFS= read -r line; do
        # Ignore comments and empty lines
        [[ "$line" =~ ^# || -z "$line" ]] && continue

        key=$(echo "$line" | awk -F= '{print $1}')
        if grep -q "^$key=" $test_env_path; then
            # The key exists, update its value
            sed -i '' "s|^$key=.*|$line|" $test_env_path
        else
            # The key doesn't exist, append it
            echo "$line" >> $test_env_path
        fi
    done < ./supabase/.env.local
}

# Tests require access to SUPABASE_ env keys, but we can't just put them in .env.local and copy them over, because the separate `npx supabase functions serve` will fail if .env.local contains SUPABASE_ keys. Therefore create anew. 
update_test_env_with_supabase_status() {
    # Get the output of 'npx supabase status'
    local status_output=$(npx supabase status)

    # Define path to .env
    local test_env_path="./supabase/tests/functions/.env"

    # Define keys and corresponding values
    keys=("SUPABASE_URL" "SUPABASE_DB_URL" "SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY")
    values=(
        $(echo "$status_output" | grep "API URL" | awk '{print $NF}')
        $(echo "$status_output" | grep "DB URL" | awk '{print $NF}')
        $(echo "$status_output" | grep "anon key" | awk '{print $NF}')
        $(echo "$status_output" | grep "service_role key" | awk '{print $NF}')
    )

    # Iterate through the keys and values
    for i in "${!keys[@]}"; do
        local key="${keys[$i]}"
        local value="${values[$i]}"

        # Check if key exists
        if grep -q "${key}=" "$test_env_path"; then
            # Update existing key
            sed -i'' -e "s|${key}=.*|${key}=${value}|g" "$test_env_path"
        else
            # Add new key
            echo "${key}=${value}" >> "$test_env_path"
        fi
    done
}





merge_local_env_into_test_env
update_test_env_with_supabase_status


# Move to the tests directory
cd ./supabase/tests/functions

# Verify that Deno will be able to find each file (must end in _test.ts)
find "./" -type f -name '*test*' | while read -r file; do
    # Check if the file ends with _test.ts or _test.js
    if ! echo "$file" | grep -E '_test\.(t|j)s$' &> /dev/null; then
        echo "Invalid file found: $file"
    fi
done


# Capture the output of the deno test command and display it to console
echo "Running tests..."
if [[ -n "$TEST_PATTERN" ]]; then
    output=$(deno test --filter "$TEST_PATTERN" --allow-all --trace-ops | tee /dev/tty)
else
    output=$(deno test --allow-all --trace-ops | tee /dev/tty)
fi

if [[ $output == *"is required"* ]]; then
    echo "\n\nThis error may be caused by your test code not using the correct .env file (the one copied to your tests directory).\nMake sure you have this at the test file head:\nimport \"https://deno.land/x/dotenv/load.ts\";"
    echo "\nYou should also check the copied .env file in your tests directory."
    echo "\n\nPress any key to continue..."
    read -n 1
fi
