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
DHS_DIR_NAME=webrtc-dhs
SAMPLE_DIR_NAME=webrtc-sample-apps
SDKKIT_DIR=$DIST_DIR/webrtc-sdk-kit
SAMPLE_DIR=$SDKKIT_DIR/$SAMPLE_DIR_NAME
DHS_DIR=$SDKKIT_DIR/$DHS_DIR_NAME
SDK_SAMPLE_APPS_DIR=$SAMPLE_DIR/sdk-sample-apps

# Github base URL
GITHUB_ROOT=git@github.com:attdevsupport

# Clear previous package & an create ouput dir
echo "Cleaning WebRTC SDK Kit dir at $SDKKIT_DIR"
if [[ -d $SDKKIT_DIR ]]; then
  # if the repos already exist, just update to the latest commit
  # on the develop branch
  if [[ -d $DHS_DIR ]]; then
    git_latest $DHS_DIR develop
  fi
  if [[ -d $SAMPLE_DIR ]]; then
    git_latest $SAMPLE_DIR develop
  fi
else # Create the directories

  echo "Creating dir $SDKKIT_DIR..."
  rm -rf $SDKKIT_DIR
  mkdir -p $SDKKIT_DIR

  # Download DHS component
  echo "Getting sources for the DHS..."
  git clone $GITHUB_ROOT/$DHS_DIR_NAME.git $DHS_DIR --recursive
  # checkout develop branch
  checkout_branch $DHS_DIR develop

  # Download the Sample Application
  echo "Getting sources for the Sample App+SDK..."
  git clone $GITHUB_ROOT/$SAMPLE_DIR_NAME.git $SAMPLE_DIR --recursive
  # checkout develop branch
  checkout_branch $SAMPLE_DIR develop

fi

# run npm install in appropriate in dhs & sample apps
echo "Installing NPM packages at $DHS_DIR"
cd $DHS_DIR
sudo npm install

echo "Installing NPM packages at $SDK_SAMPLE_APPS_DIR"
cd $SDK_SAMPLE_APPS_DIR
sudo npm install

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

