function verify_branch_is_not_reserved {
    local branch_name=$1

    if [[ -z "$branch_name" ]]; then
        echo "Please pass the branch_name as a parameter."
        exit 1;
    fi

    if [[ "$branch_name" = "HEAD" || "$branch_name" = "develop" || "$branch_name" = "main" ]]; then
        echo "You can't do this for a reserved branch name."
        exit 1;
    fi
}