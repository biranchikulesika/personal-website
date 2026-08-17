# AGENTS.md

## Repository Branching and Production Rules

These rules are mandatory for all development work in this repository.

### Protected Branches

The repository has two protected branches:

* `develop`
* `production`

Both branches require a Pull Request for changes.

**Direct commits and direct pushes to either protected branch are not allowed.**

All changes must go through the appropriate Pull Request workflow.

---

## Branch Structure

### `production`

`production` is the final production state of the website.

Rules:

* `production` must always remain production-ready.
* Never use `production` as a development branch.
* Never create feature branches from `production`.
* Never commit directly to `production`.
* Never push directly to `production`.
* Changes reach `production` only through a Pull Request from `develop`.
* Do not merge incomplete, experimental, or partially tested work into `production`.

Treat `production` as the final and stable state of the project.

### `develop`

`develop` is the primary development and integration branch.

All ongoing development happens around `develop`.

Rules:

* Do not commit directly to `develop`.
* Do not push directly to `develop`.
* New development branches must be created from the latest `develop`.
* Development branches must be merged back into `develop` through Pull Requests.
* Multiple independent features or fixes should use separate branches.
* Keep `develop` in a reasonably working state. Do not use it as a dumping ground for unfinished experiments.

---

## Initial Branch Migration

The repository currently uses `main` as the development branch.

The first step is to rename:

`main` → `develop`

After the rename:

* `develop` becomes the primary development branch.
* `production` remains the protected final production branch.
* All future development follows the branching workflow described in this document.
* Do not continue using `main` as the development branch after the migration.

Verify the remote repository, local tracking branches, default branch configuration, and branch protection settings after the rename.

---

## Development Workflow

The standard workflow is:

```text
production
    ↑
    │ Pull Request
    │
develop
    ↑
    │ Pull Request
    │
feature / fix / chore branch
```

### Step 1: Start from `develop`

Always start new work from the latest `develop`.

```bash
git checkout develop
git pull origin develop
```

### Step 2: Create a dedicated branch

Create a new branch for the specific task.

Examples:

```text
feature/article-editor
feature/dark-mode-fixes
fix/payment-confirmation
fix/404-pages
chore/update-dependencies
refactor/auth-flow
```

Do not combine unrelated work into the same branch.

### Step 3: Develop and test

Make the required changes on the development branch.

Before opening the Pull Request:

* Test the changes.
* Check for regressions.
* Review the changed files.
* Ensure unrelated files were not modified accidentally.
* Run the project's relevant linting, type checking, tests, and build checks.
* Confirm the implementation is actually complete.

### Step 4: Merge into `develop` via Squash and Merge

All development branches must be integrated into `develop` using **Squash and Merge**.

```text
feature/*  ──(Squash & Merge)──► develop
fix/*      ──(Squash & Merge)──► develop
chore/*    ──(Squash & Merge)──► develop
refactor/* ──(Squash & Merge)──► develop
```

#### Mandatory Squash and Merge Rules:
* **Always Squash and Merge into `develop`**: Combine all incremental development commits from the working branch into a single, cohesive, and descriptive commit.
* **Never create messy merge bubbles**: Do not pollute `develop` with multiple micro-commits, WIP saves, or merge commit nodes.
* **Keep `develop` History Linear and Clean**: Each commit on `develop` must represent a fully tested, complete feature, fix, or chore.
* Do not merge directly from a feature branch into `production`.

---

## Production Release Workflow

`production` is updated only when the development work is considered complete and ready for release.

The release flow is:

```text
feature/fix/chore branch
        ↓
      develop
        ↓
   testing / review
        ↓
Pull Request
        ↓
   production
```

### Important Rule

**Do not create a Pull Request into `production` for every individual feature.**

Individual development work goes into `develop`.

Only when the accumulated work in `develop` is complete, tested, reviewed, and ready for production should a Pull Request be opened:

```text
develop → production
```

After that Pull Request is approved and merged, `production` becomes the new final production state.

---

## Branch Creation Rule

Always branch from the branch that will receive the Pull Request.

For normal development:

```text
develop → new branch → develop
```

Do not create normal development branches from `production`.

Do not use `production` as a source branch for development work.

---

## Forbidden Actions

The following actions are not allowed:

### Never push directly to `production`

```bash
git push origin production
```

Do not bypass the Pull Request process.

### Never push directly to `develop`

```bash
git push origin develop
```

Development changes must go through a Pull Request.

### Never merge feature branches directly into `production`

Incorrect:

```text
feature/x → production
```

Correct:

```text
feature/x → develop → production
```

### Never develop directly on `production`

Do not check out `production` and start implementing features there.

### Never treat `production` as a testing branch

Testing and integration happen before production.

---

## Agent Behavior

Any coding agent working in this repository must follow these rules automatically.

Before making changes:

1. Determine the current branch.
2. Determine whether the requested work is development work, a production release, or repository maintenance.
3. For normal development, work from `develop`.
4. Create a dedicated branch from the latest `develop`.
5. Make changes only on that branch.
6. Never directly modify or push `develop`.
7. Never directly modify or push `production`.
8. Integrate into `develop` exclusively via **Squash and Merge** (`git merge --squash` / PR Squash & Merge) once approved.
9. Only create a `develop → production` Pull Request when the user explicitly indicates that the completed development state is ready for production.

If the current branch is `production`, do not begin normal feature development there.

If the current branch is `develop`, do not make direct commits unless the repository owner explicitly changes these rules.

---

## Production Safety Principle

`production` is sacred.

It represents the final state that is intended to be deployed to users.

Therefore:

> Development happens around `develop`.
> Integration happens through `develop`.
> Production releases happen from `develop` into `production`.
> `production` is never a playground.

When in doubt, preserve `production` rather than modifying it.

---

## Summary

The repository follows this model:

```text
                    ┌──────────────┐
                    │  production  │
                    │ FINAL STATE  │
                    └──────▲───────┘
                           │
                     Pull Request
                           │
                    ┌──────┴───────┐
                    │    develop    │
                    │ DEVELOPMENT  │
                    └──────▲───────┘
                           │
                    Pull Request
                           │
              ┌────────────┴────────────┐
              │                         │
        feature branch             fix branch
              │                         │
        development                development
```

### Golden Rule

**Never bypass the branch hierarchy.**

```text
New work:
develop → feature/fix branch → develop

Production release:
develop → production
```

`production` is the final state. Keep it untouched until a deliberate production release is approved.
