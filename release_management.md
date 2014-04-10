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
We have three options for this scenario:

### Fix in `master`, Test in `master`

1. Create a Github issue on the repo that corresponds to the code, e.g.,
	* Bugs found in `js-shared` should be created in the `js-shared` repo.
2. Identify the commit that introduced the bug.
3. Branch from the commit in the `master` branch in which the bug was found.
4. Create a `hot-fix` branch under `/hotfix/<Github Issue No.>/`
5. Fix the bug.
6. Add the line: **Fixes #_\<Issue No.\>_** in your commit message alongside with your comments. That way you'll get a nice link to your Github Issue, e.g. 

```bash

	Commit: 0d19655a141dbcb2aa16d5cd65c65df145e9c920 [0d19655]
	Parents: 57aeefacd6
	Author: Pablo Padilla <pgpb.padilla@gmail.com>
	Date: March 11, 2014 9:50:07 AM PDT
	
	Fixes #33: Don't use the `from` field to create the conversation ID.
```

5. Run all necessary tests before closing the Github Issue and never close an Issue you have opened. Ask somebody else to test it and then close it only if the fix is working.
6. Merge the fix into `develop`

### Fix in maintenance branch
Use this if you want to fix a specifig bug without affecting the work that is currently going on in `develop` (the main integration branch).

### Fix in `develop`
