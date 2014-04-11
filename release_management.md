# Release Management

## Branching Workflow

The basic branching strategy we're using for the WebRTC project is described in [A Continuous delivery Git branching model](http://nxvl.blogspot.com/2012/07/a-continous-delivery-git-branching-model.html).

Our Jenkins jobs already have adopted this model. 

## End of Sprint
1. Tag the version that was demoed
2. Do your demo.

## Change Requests & Features

### Normal Change Requests
1. Treat as a new user story.
2. Work on it normally as part of the Next sprint. 
3. Integrate with the `develop` branch.
4. Automatically will merge to `master` (production branch).

### Mid-sprint Change Request
1. Make an irrefutable argument against making it part of the current Sprint, then treat it as a normal change request.
2. If step 1 fails, then add this to your current Sprint.
3. Work on it integrating it with the `develop` branch.
4. It will automatically be integrated to the `master` branch by Jenkins.

## Normal fixes
1. Make the fix in `develop` 
2. It will be integrated to the `master` automatically by Jenkins.

## Hot-fixes

Hot fixes are bugs found in the `master` branch. This means this is code that has already
been released/demoed to the product owners.

There are at least three ways of handling these:

### Always do this first

* Create a Github issue on the repo that corresponds to the code, e.g.,
	* Bugs found in `js-shared` should be created in the `js-shared` repo.

### Fix in `master`, merge into `master`, merge into `develop` (recommended)

1. Identify the release in the `master` branch that introduced the bug and do a `git checkout`
2. Branch from the commit in the `master` branch in which the bug was found.
3. Create a `hot-fix` branch under `/hotfix/<Github Issue No.>/`
4. Fix the bug.
5. Run integration tests on the hotfix branch before closing the Github Issue and never close an Issue you have opened. Ask somebody else to test it and then close it only if the fix is working.
6. Merge into `master`.
6. Merge the fix into `develop`. Jenkins will take over from here.

### Fix in maintenance branch, don't merge

Use this if you want to fix a specifig bug without affecting the work that is currently going on in `develop` (the main integration branch). You can apply the same fix to the integration branch but it has to be via a patch file instead of a merge operation.

1. Look up the tag that corresponds to the release that you want to fix and do a `git checkout`
2. Create a branch under `maint/<release name>`.
3. This will be a maintenance branch for that release. 
4. Fix the bug.
5. Changes in this branch **will not** be merged into the main integration branch `develop`
6. This branch will keep being updated with fixes for that specific release only.
7. Run integration tests before closing the Github Issue and never close an Issue you have opened. Ask somebody else to test it and then close it only if the fix is working.

