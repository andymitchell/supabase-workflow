source _shared_functions.sh

# Change to the directory to where the script is located
cd "$(dirname "${BASH_SOURCE[0]}")"



branch_name=$(git branch --show-current)
verify_branch_is_not_reserved "$branch_name"

git push origin "$branch_name"

git checkout develop
git pull origin develop

git checkout "$branch_name"
git merge develop

git push origin "$branch_name"

echo "What's your pull request title?"
read pr_title

echo "What's the pull request's description?"
read pr_body

gh pr create --title "$pr_title" --body "$pr_body" --base develop

echo "If a Pull Request fails because of Git Actions, just update, commit, and push to 'origin $branch_name' like normal, then go to GitHub.com, open Pull Requests, and you should see it start to re-run Git Actions automatically."