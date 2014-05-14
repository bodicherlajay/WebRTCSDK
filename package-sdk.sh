#!/bin/bash

# checks out the latest commit for the branch ($2) from repo ($1)
function checkout_version {
  START_DIR=$(pwd)
  REPO_DIR=$1
  GIT_HASH=$2
  cd $REPO_DIR
  echo "Checking out branch $GIT_HASH ... at $REPO_DIR"
  git checkout -b package-$(git rev-parse --short HEAD) --track  $GIT_HASH

  # Remove untracked files
  git clean -f
  # Include Git revision in a textfile
  echo "Adding git_hash file at $REPO_DIR/git_hash ..."
  git rev-parse HEAD > git_hash

  # return to original dir
  echo "Finished checkout... moving to $START_DIR"
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
SDK_DIR=$DHS_DIR/SAMPLE_APP_DIR_NAME/lib/webrtc-sdk
DHS_DIR=$SDKKIT_DIR/$DHS_DIR_NAME

# Github base URL
GITHUB_ROOT=git@github.com:attdevsupport

# Clear previous package & an create ouput dir
echo "Creating dir $SDKKIT_DIR..."
rm -rf $SDKKIT_DIR
mkdir -p $SDKKIT_DIR

# Download DHS component
echo "Getting sources for the DHS..."
git clone $GITHUB_ROOT/$DHS_DIR_NAME.git $DHS_DIR

# checkout the given hash
checkout_version $DHS_DIR $HASH

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
