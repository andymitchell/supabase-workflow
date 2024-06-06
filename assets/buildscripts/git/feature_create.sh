source _shared_functions.sh

# Change to the directory to where the script is located
cd "$(dirname "${BASH_SOURCE[0]}")"


echo "Enter feature name:"
read name

if ! [[ "$name" =~ ^[a-zA-Z0-9][a-zA-Z0-9._-]*$ ]]; then
    echo "Invalid feature name"
    exit 1
fi

branch_name="feat/$name"

git checkout develop

git checkout -b "$branch_name"

git push --set-upstream origin "$branch_name"

echo "Complete! When the feature is finished, run ./feature_pr_into_develop.sh"
