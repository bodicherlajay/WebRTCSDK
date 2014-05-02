#!/bin/sh

# checks out the latest commit for the branch ($2) from repo ($1)
function checkout_branch {
  START_DIR=$(pwd)
  REPO_DIR=$1
  BRANCH_NAME=$2
  cd $REPO_DIR
  echo "Checking out branch $BRANCH_NAME ... at $REPO_DIR"
  if [ `git branch --list $BRANCH_NAME` ]
  then
    git checkout $BRANCH_NAME
  else
    git checkout -b $BRANCH_NAME
  fi

  # Include Git revision in a textfile
  git rev-parse --short HEAD > git_hash

  # return to original dir
  echo "Finished checkout... moving to $START_DIR"
  cd $START_DIR
}

# pull the latest changes from repo $1 for branch ($2)
# assumes we're already in a git repo
function git_latest {
  START_DIR=$(pwd)
  REPO_DIR=$1
  BRANCH_NAME=$2
  echo "Getting the latest from branch: $BRANCH_NAME at $REPO_DIR..."
  cd $REPO_DIR
  git reset --hard $BRANCH_NAME
  git pull origin $BRANCH_NAME
  git submodule update --recursive
  cd $START_DIR
}

###################################
#### Main Program Starts Here #####
###################################

DIST_DIR=./dist
DHS_DIR=webrtc-dhs
SAMPLE_DIR=webrtc-sample-apps
SDKKIT_DIR=$DIST_DIR/webrtc-sdk-kit
# Github base URL
GITHUB_ROOT=git@github.com:attdevsupport

# Create dist dir
echo "Creating dist/ dir at $DIST_DIR"
mkdir -p $DIST_DIR

# Clear previous package & an create ouput dir
echo "Cleaning WebRTC SDK Kit dir at $SDKKIT_DIR"
if [[ -d $SDKKIT_DIR ]]; then
  # if the repos already exist, just update to the latest commit
  # on the develop branch
  if [[ -d $SDKKIT_DIR/$DHS_DIR ]]; then
    git_latest $SDKKIT_DIR/$DHS_DIR develop
  fi
  if [[ -d $SDKKIT_DIR/$SAMPLE_DIR ]]; then
    git_latest $SDKKIT_DIR/$DHS_DIR develop
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
  checkout_branch $SDKKIT_DIR/$SAMPLE_DIR develop

fi

# Place Initial Setup Readme in at the root
README=$SDKKIT_DIR/$SAMPLE_DIR/sdk-sample-apps/README-0.md
mv $README $SDKKIT_DIR/README.md

# Zip package
cd $DIST_DIR
# Ignore: .git, OSX tmp files, node_modules, tests
zip -r webrtc-sdk-kit_$(date +%s).zip webrtc-sdk-kit -x *.git* *.DS_Store* *node_modules* *test*
cd $START_DIR

