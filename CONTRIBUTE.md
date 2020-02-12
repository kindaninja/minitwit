## Contributions

### Which repository setup will we use?
We will be using a single remote repository hosted on github.com, cloned to our local machines
and synchronized when needed.

### Which branching model will we use? Which distributed development workflow will we use?
We will be using a simplified version of Git Flow.
We only use the master branch and feature branches.

The master branch works like the develop branch in Git Flow. 
We branch out from master into feature branches when working on new features.
When a feature is ready a pull request (PR) back into master is made.
On this PR all team members will do a code review (CR),
and either approve the PR or suggest changes.
When a PR is approved by all team members, it is rebase merged into master.
Rebase has been chosen to end up with a single pretty string of commits
instead of ugly merge commits.

Releases is made from github.com and tagged with a version number.
We have decided that while the project is under development,
and not in production, we will not use release and hotfix branches.
Keeping it simple for our own sake.


### How do we expect contributions to look like?
Contributions ie. pushed commits should be well thought through, tested and must not break
the current system. Commits should be documented both in code and in the commit message.

### Who is responsible for integrating/reviewing contributions?
To increase visibility and knowledge sharing in the team we have decided that all contributers
will do CR on PR's. The last person to approve will do the merge/rebase.

