# Tandem GITFLOW :sunglasses:

## 1. A feature ? Issues

If you want to implement a new feature, please check in issues if there isn't already an occcurence of this feature.
If it's not the case :

- [Open an issue](https://github.com/TandemDAO/v1-core/issues/new)
- Describe what you want to build
- Add labels to your issue, cf [labels list](https://github.com/TandemDAO/v1-core/labels)
  - I you want to add labels, contact an admin.
- Choose a deadline for your issue, **do not drop your issues**

## 2. An issue ? A branch

Each issue need to have a corresponding own branch, **with issue number**, meaning : no branch without issue.

- For a **new feature**, branch name start with `f/`
- For an **edit**, branch name start with `e/`
- For a **refactor**, branch name start with `r/`
- For a **documentation**, branch name start with `d/`
- For a **bug fix**, branch name start with `bf/`

Examples:

- For issue `1` named `Create statistics dashboard` : `f/statistics-dashboard`
- Or issue `42` named `Edit logo on landing page` : `e/change-logo-landing-page`
- For example a proper branch name: `f/init-test-architecture`

## 3. Commits

### Commit needs a reference to an issue

For each commit, you need to reference the issues.
To do this put `#` followed by the issue number in your commit message.

Example :

```
git commit -m 'feat: #2 importe Tandem logo'
```

### A clear commit message

For each commit, respect the **[commit conventions](https://www.conventionalcommits.org/en/v1.0.0/)**.

Example to ban: :angry:

```
git commit -m 'bugfix'
git commit -m 'oups'
```

Example with some class :sunglasses:

```
git commit -m 'chore: #42 add libs for CI'
```

## 4. Branches: merge requests & code reviews

NEVER commit on `main` directly.  
Once a feature is ready, create a **merge request** into `dev`.  
Once merged in dev, create a **merge request** into `main`.
This on is to be reviewed by 2 peers :angel: :angel:.

> Deletes all unused branches.
