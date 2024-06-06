# Move to the current 
cd "$(dirname "${BASH_SOURCE[0]}")"

echo "Disable verifying JWT? y/n"
read answer

if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
    npx supabase functions serve --env-file ./supabase/.env.local --no-verify-jwt
else
    npx supabase functions serve --env-file ./supabase/.env.local 
fi
