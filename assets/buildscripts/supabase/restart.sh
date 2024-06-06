

npx supabase stop

echo "Do you want to kill Docker processes (this is risky, as it kills all - not just Supabase)? (y/n)"
read response

if [[ "$response" =~ ^[Yy]$ ]]; then
    docker kill $(docker ps -q)
fi

npx supabase start