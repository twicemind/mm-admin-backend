# Branch Protection Setup Guide

This document describes the recommended branch protection rules for this repository.

## 🛡️ Branch Protection Rules for `main`

To ensure code quality and prevent direct pushes to the main branch, configure the following settings in GitHub:

### How to Configure

1. Go to **Settings** → **Branches** → **Add rule** (or edit existing rule)
2. Branch name pattern: `main`

### Recommended Settings

#### ✅ Protect matching branches

- [x] **Require a pull request before merging**
  - [x] Require approvals: **1** (or more for critical projects)
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require review from Code Owners (if CODEOWNERS is configured)

- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - Required status checks:
    - `lint-pr-title` (Conventional Commits validation)
    - Add any other CI checks (tests, linting, etc.) when available

- [x] **Require conversation resolution before merging**
  - Ensures all PR comments are resolved

- [x] **Require signed commits** *(optional but recommended)*
  - Adds extra security by requiring GPG signed commits

- [x] **Require linear history** *(optional)*
  - Prevents merge commits, enforces rebase or squash merging

- [x] **Include administrators**
  - Apply rules even to repository administrators

- [ ] **Allow force pushes** → Leave **unchecked**
  - Prevents force pushes to main branch

- [ ] **Allow deletions** → Leave **unchecked**
  - Prevents accidental deletion of main branch

#### 📋 Rules applied to everyone including administrators

- [x] **Restrict who can push to matching branches** *(optional)*
  - If needed, specify which users/teams can push directly

## 🔄 Workflow

With these rules in place:

1. **Development** happens on the `develop` branch
2. **Pull Requests** are created from `develop` → `main`
3. **Reviews** are required before merging
4. **Automatic Release** is triggered when PR is merged to main

## 📝 Additional Notes

- The `develop` branch can remain unprotected for easier development
- Consider adding the same protections to `develop` if multiple team members contribute
- Status checks will automatically run via GitHub Actions when PRs are created

## 🔗 GitHub Documentation

For more details, see: [GitHub Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
