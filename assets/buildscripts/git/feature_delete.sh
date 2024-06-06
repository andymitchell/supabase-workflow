source _shared_functions.sh

# Change to the directory to where the script is located
cd "$(dirname "${BASH_SOURCE[0]}")"


branch_name=$(git branch --show-current)
if [[ "$branch_name" = "develop" || "$branch_name" = "main" ]]; then
    echo "Enter feature name to delete:"
    read name
    branch_name="feat/$name"
fi
verify_branch_is_not_reserved "$branch_name"

read -p "Are you sure you want to delete the branch '$branch_name'? (Y/n): " confirm

# Check if the user confirmed the deletion
if [[ "$confirm" == [Y] ]]; then
    git checkout develop

    git push -d origin "$branch_name"
    git branch -d "$branch_name"
    echo "Branch '$branch_name' has been deleted."
else
    # Don't delete the branch
    echo "Branch '$branch_name' was not deleted."
fi



