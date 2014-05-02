#!/bin/sh

function checkout_branch {
  START_DIR=$(pwd)
  REPO_DIR=$1
  BRANCH_NAME=$2
  echo "Checking out branch $BRANCH_NAME ..."
  cd $REPO_DIR
  if [ `git branch --list $BRANCH_NAME`]
  then
    git checkout $BRANCH_NAME
  else
    git checkout -b $BRANCH_NAME
  fi

  # Include Git revision in a textfile
  git rev-parse --short HEAD > git_hash

  # return to original dir
  cd $START_DIR
}

# Save a reference to the current directory
START_DIR=$(pwd)

# Create dist dir
DIST_DIR=./dist
echo "Creating dist/ dir at $DIST_DIR"
mkdir -p $DIST_DIR
SDKKIT_DIR=$DIST_DIR/webrtc-sdk-kit

# Clear previous package & an create ouput dir
echo "Cleaning WebRTC SDK Kit dir at $SDKKIT_DIR"
rm -rf $SDKKIT_DIR
mkdir -p $SDKKIT_DIR

# Github base URL
GITHUB_ROOT=git@github.com:attdevsupport

# Download DHS component
DHS_DIR=webrtc-dhs
echo "Getting sources for the DHS..."
git clone $GITHUB_ROOT/$DHS_DIR.git $SDKKIT_DIR/$DHS_DIR --recursive
# checkout develop branch
checkout_branch $SDKKIT_DIR/$DHS_DIR develop

# Download the Sample Application
SAMPLE_DIR=webrtc-sample-apps
echo "Getting sources for the Sample App+SDK..."
git clone $GITHUB_ROOT/$SAMPLE_DIR.git $SDKKIT_DIR/$SAMPLE_DIR --recursive
checkout_branch $SDKKIT_DIR/$SAMPLE_DIR develop

# Zip package
# Ignore: .git, OSX tmp files, node_modules, tests
zip -r webrtc-sdk-kit_$(date +%s).zip webrtc-sdk-kit -x *.git* *.DS_Store* *node_modules* *test*

