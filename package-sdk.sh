#!/bin/bash

# checks out the latest commit for the branch ($2) from repo ($1)
function checkout_version {
  START_DIR=$(pwd)
  REPO_DIR=$1
  GIT_HASH=$2
  echo "Enter $REPO_DIR ..."
  cd $REPO_DIR

  # Clean dir before anything else
  git reset --hard HEAD

  echo "Checking out branch $GIT_HASH ... at $REPO_DIR"
  git checkout $GIT_HASH

  # Remove untracked files
  git clean -f
  # Include Git revision in a textfile
  echo "Adding git_hash file at $REPO_DIR/git_hash ..."
  git rev-parse HEAD > git_hash

  # return to original dir
  echo "Finished checkout... moving to $START_DIR"
  echo "Exit $REPO_DIR ..."
  cd $START_DIR
}

# pull the latest changes from repo $1 for branch ($2)
function git_latest {
  START_DIR=$(pwd)
  REPO_DIR=$1
  GIT_HASH=$2
  echo "Enter $REPO_DIR ..."
  cd $REPO_DIR

  # Clean dir before anything else
  git reset --hard HEAD

  # fetch the latest from origin remote
  echo "Fetching the latest from $REPO_DIR"
  git fetch origin
  echo "Exit $REPO_DIR ..."
  cd $START_DIR
}


function gen_jsdoc {
  START_DIR=$(pwd)
  SRC_DIR=$1
  OUT_DIR=$2
  echo "Enter $SRC_DIR ..."
  cd $SRC_DIR
  # install NPM dependencies to generate JSDocs
  npm install
  echo "Generating JSDoc API documentation ..."
  grunt jsdoc
  cp -Rf doc $OUT_DIR/html-docs
  echo "Exit $REPO_DIR ..."
  cd $START_DIR
}

###################################
#### Main Program Starts Here #####
###################################

# We have to pass at least the name of the branch to check out
if [ "$#" -ne 1 ]; then
    echo "Illegal number of parameters. Pass the Git Hash to use."
    exit 1 # End the execution
fi

# Git Hash to use for generating the package
GIT_HASH=$1

# Create dist dir if it doesn't exist
DIST_DIR=$(pwd)/dist
mkdir -p $DIST_DIR

echo "Starting packaging at... $DIST_DIR ... using branch $BRANCH_NAME"
DHS_DIR_NAME=webrtc-dhs
SDK_DIR_NAME=webrtc-sdk
SAMPLE_APP_DIR_NAME=sample-app

SDKKIT_DIR=$DIST_DIR/webrtc-sdk-kit
DHS_DIR=$SDKKIT_DIR/$DHS_DIR_NAME
SDK_DIR=$DHS_DIR/$SAMPLE_APP_DIR_NAME/lib/webrtc-sdk

echo "**************************"
echo "SDKKIT_DIR = $SDKKIT_DIR"
echo "DHS_DIR = $DHS_DIR"
echo "SDK_DIR = $SDK_DIR"
echo "**************************"

# Github base URL
GITHUB_ROOT=git@github.com:attdevsupport

if [[ -d $SDKKIT_DIR && -d $DHS_DIR ]]; then
  
  # if the repos already exist, just update to the latest commit
  echo "DHS Repo exist, fetch latest ..."
  # fetch the latest, then update to the given revision
  git_latest $DHS_DIR $GIT_HASH

else # Repo doesn't exist, create the directories

  echo "Cleaning WebRTC SDK Kit dir: $SDKKIT_DIR"
  echo "Creating dir $SDKKIT_DIR..."
  mkdir -p $SDKKIT_DIR

  # Download DHS component
  echo "Getting sources for the DHS..."
  git clone $GITHUB_ROOT/$DHS_DIR_NAME.git $DHS_DIR

fi

# checkout the given hash of the DHS
echo "Checking out $GIT_HASH for the DHS: $DHS_DIR ..."
checkout_version $DHS_DIR $GIT_HASH

# Generate JSDocs from the SDK and place them at the root level of the SDK Kit dir.
gen_jsdoc $SDK_DIR $SDKKIT_DIR

# Place README-0.md in at the root
README=$SDK_DIR/README-0.md
if [[ -f $README ]]; then
  echo "Moving $README  to... $SDKKIT_DIR/README.md"
  mv $README $SDKKIT_DIR/README.md
fi
# Place Release Notes at root level of the package
RELEASE_FILE=$SDK_DIR/RELEASE.md
if [[ -f $RELEASE_FILE ]]; then
  echo "Moving $RELEASE_FILE  to... $SDKKIT_DIR/RELEASE.md"
  mv $RELEASE_FILE $SDKKIT_DIR/RELEASE.md
fi

# Zip package
cd $DIST_DIR
# Clear old packages
find . -name "*.zip" -exec rm -rf {} \;

# Ignore: .git, OSX tmp files, node_modules, tests
echo "Generating Zip package..."
zip -r webrtc-sdk-kit_$(date +%s).zip webrtc-sdk-kit -x *.git* *.DS_Store* *node_modules* *test*
cd $START_DIR
