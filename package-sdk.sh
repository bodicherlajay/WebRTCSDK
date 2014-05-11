#!/bin/bash

# checks out the latest commit for the branch ($2) from repo ($1)
function checkout_branch {
  START_DIR=$(pwd)
  REPO_DIR=$1
  BRANCH_NAME=$2
  cd $REPO_DIR
  echo "Checking out branch $BRANCH_NAME ... at $REPO_DIR"
  if git branch --list "$BRANCH_NAME";
  then
    git checkout $BRANCH_NAME
  else
    git checkout -b $BRANCH_NAME --track  origin/$BRANCH_NAME
  fi

  # Update submodules
  git submodule update --init --recursive

  # Remove untracked files
  git clean -f
  # Include Git revision in a textfile
  echo "Adding git_hash file at $REPO_DIR/git_hash ..."
  git rev-parse HEAD > git_hash

  # return to original dir
  echo "Finished checkout... moving to $START_DIR"
  cd $START_DIR
}

# pull the latest changes from repo $1 for branch ($2)
function git_latest {
  START_DIR=$(pwd)
  REPO_DIR=$1
  BRANCH_NAME=$2
  echo "Getting the latest from branch: $BRANCH_NAME at $REPO_DIR..."
  cd $REPO_DIR
  # Clean dir before anything else
  git reset --hard HEAD
  if git branch --list "$BRANCH_NAME";
  then
    git checkout $BRANCH_NAME
  else
    git checkout -b $BRANCH_NAME --track  origin/$BRANCH_NAME
  fi

  git pull origin $BRANCH_NAME
  git submodule update --recursive
  # Remove untracked files
  git clean -f
  # Include Git revision in a textfile
  echo "Adding git_hash file at $REPO_DIR ..."
  git rev-parse --short HEAD > git_hash
  cd $START_DIR
}

function gen_jsdoc {
  START_DIR=$(pwd)
  SRC_DIR=$1
  OUT_DIR=$2
  cd $SRC_DIR
  # install NPM dependencies to generate JSDocs
  npm install 
  grunt jsdoc
  cp -Rf doc $OUT_DIR/html-docs
  cd $START_DIR
}

###################################
#### Main Program Starts Here #####
###################################

# We have to pass at least the name of the branch to check out
if [ "$#" -ne 1 ]; then
    echo "Illegal number of parameters. Pass the name of the branch to use."
    exit 1 # End the execution
fi

# Name of the branch to use for generating the package
BRANCH_NAME=$1

# Create dist dir if it doesn't exist
DIST_DIR=$(pwd)/dist
mkdir -p $DIST_DIR

echo "Starting packaging at... $DIST_DIR ... using branch $BRANCH_NAME"
DHS_DIR_NAME=webrtc-dhs
SAMPLE_DIR_NAME=webrtc-sample-apps
SDK_DIR_NAME=webrtc-sdk
SDKKIT_DIR=$DIST_DIR/webrtc-sdk-kit
SAMPLE_DIR=$SDKKIT_DIR/$SAMPLE_DIR_NAME
SDK_DIR=$SAMPLE_DIR/sdk-sample-apps/webrtc-sdk
DHS_DIR=$SDKKIT_DIR/$DHS_DIR_NAME
SDK_SAMPLE_APPS_DIR=$SAMPLE_DIR/sdk-sample-apps

# Github base URL
GITHUB_ROOT=git@github.com:attdevsupport

# Clear previous package & an create ouput dir
echo "Cleaning WebRTC SDK Kit dir at $SDKKIT_DIR"
if [[ -d $SDKKIT_DIR ]]; then
  # if the repos already exist, just update to the latest commit
  if [[ -d $DHS_DIR ]]; then
    git_latest $DHS_DIR $BRANCH_NAME
  fi
  if [[ -d $SAMPLE_DIR ]]; then
    git_latest $SAMPLE_DIR $BRANCH_NAME
  fi
else # Create the directories

  echo "Creating dir $SDKKIT_DIR..."
  rm -rf $SDKKIT_DIR
  mkdir -p $SDKKIT_DIR

  # Download DHS component
  echo "Getting sources for the DHS..."
  git clone $GITHUB_ROOT/$DHS_DIR_NAME.git $DHS_DIR --recursive
  # checkout branch
  checkout_branch $DHS_DIR $BRANCH_NAME

  # Download the Sample Application
  echo "Getting sources for the Sample App+SDK..."
  git clone $GITHUB_ROOT/$SAMPLE_DIR_NAME.git $SAMPLE_DIR --recursive
  # checkout develop branch
  checkout_branch $SAMPLE_DIR $BRANCH_NAME

fi

# Generate JSDocs from the SDK and place them at the root level of the SDK Kit dir.
gen_jsdoc $SDK_DIR $SDKKIT_DIR

# Place Initial Setup Readme in at the root
README=$SAMPLE_DIR/README-0.md
if [[ -f $README ]]; then
  echo "Moving $README  to... $SDKKIT_DIR/README.md"
  mv $README $SDKKIT_DIR/README.md
fi

# Zip package
cd $DIST_DIR
# Clear old packages
find . -name "*.zip" -exec rm -rf {} \;

# Ignore: .git, OSX tmp files, node_modules, tests
echo "Generating Zip package..."
zip -r webrtc-sdk-kit_$(date +%s).zip webrtc-sdk-kit -x *.git* *.DS_Store* *node_modules* *test*
cd $START_DIR

