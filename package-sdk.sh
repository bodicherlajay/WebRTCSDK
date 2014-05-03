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
  git rev-parse --short HEAD > git_hash

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

###################################
#### Main Program Starts Here #####
###################################


# Create dist dir if it doesn't exist
DIST_DIR=$(pwd)/dist
mkdir -p $DIST_DIR

echo "Starting packaging at... $DIST_DIR ..."
DHS_DIR=webrtc-dhs
SAMPLE_DIR=webrtc-sample-apps
SDKKIT_DIR=$DIST_DIR/webrtc-sdk-kit
# Github base URL
GITHUB_ROOT=git@github.com:attdevsupport

# Clear previous package & an create ouput dir
echo "Cleaning WebRTC SDK Kit dir at $SDKKIT_DIR"
if [[ -d $SDKKIT_DIR ]]; then
  # if the repos already exist, just update to the latest commit
  # on the develop branch
  if [[ -d $SDKKIT_DIR/$DHS_DIR ]]; then
    git_latest $SDKKIT_DIR/$DHS_DIR develop
  fi
  if [[ -d $SDKKIT_DIR/$SAMPLE_DIR ]]; then
    git_latest $SDKKIT_DIR/$SAMPLE_DIR develop
  fi
else # Create the directories

  echo "Creating dir $SDKKIT_DIR..."
  rm -rf $SDKKIT_DIR
  mkdir -p $SDKKIT_DIR

  # Download DHS component
  echo "Getting sources for the DHS..."
  git clone $GITHUB_ROOT/$DHS_DIR.git $SDKKIT_DIR/$DHS_DIR --recursive
  # checkout develop branch
  checkout_branch $SDKKIT_DIR/$DHS_DIR develop

  # Download the Sample Application
  echo "Getting sources for the Sample App+SDK..."
  git clone $GITHUB_ROOT/$SAMPLE_DIR.git $SDKKIT_DIR/$SAMPLE_DIR --recursive
  # checkout develop branch
  checkout_branch $SDKKIT_DIR/$SAMPLE_DIR develop

fi

# Place Initial Setup Readme in at the root
README=$SDKKIT_DIR/$SAMPLE_DIR/README-0.md
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

