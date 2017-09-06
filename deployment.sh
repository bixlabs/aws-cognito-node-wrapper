#! /bin/sh

# IMPORTANT: This script is not setting environment variables, you will have to do that manually.
# make sure that you are using node 8.
SERVER_FOLDER="aws-cognito-node-wrapper"
SOURCE_NVM="source .nvm/nvm.sh"
TRY_TO_CREATE_SERVER_FOLDER="mkdir -p \"${SERVER_FOLDER}\""
MOVE_TO_SERVER_FOLDER="cd ${SERVER_FOLDER}"
MOVE_FILES_TO_SERVER_FOLDER="mv ~/package.json . && mv ~/dist.zip . && mv -vn ~/.env ."
NPM_INSTALL="npm install"
UNZIP_DIST="unzip -o dist.zip"
# This might be a problem if we are running this in an instance where there are multiple node processes.
# Maybe we can provide the pid as a parameter but this will force developers to enter to the instance.
KILL_NODE="sudo killall node"
NODE_RUN_PROCESS="nohup node dist/main &"
SSH_SCRIPT="${SOURCE_NVM}; ${TRY_TO_CREATE_SERVER_FOLDER}; ${MOVE_TO_SERVER_FOLDER}; ${MOVE_FILES_TO_SERVER_FOLDER}; ${NPM_INSTALL}; ${UNZIP_DIST}; ${KILL_NODE}; ${NODE_RUN_PROCESS}"

# Make sure we are in master branch and with latest changes
echo "Making sure master branch is up to date..."
git checkout master && git pull origin master

# Make sure dependencies are correct
echo "Installing node dependencies..."
npm install

# Clean the dist folder
echo "Deleting the dist folder..."
npm run clean

# Build the project into dist
echo "Creating the dist folder with latest changes..."
npm run build

# Zip de dist folder
echo "Creating the ZIP file from the dist directory.."
zip -r ./dist/dist.zip ./dist

# Copy the package.json to the AWS Instance
echo "Copying the package.json file to the AWS instance..."
scp -i $MY_AWS_PEM_KEY ./package.json $AWS_INSTANCE_URL:~/

# Copy the dist.zip to the AWS Instance
echo "Copying the dist.zip file to the AWS instance..."
scp -i $MY_AWS_PEM_KEY ./dist/dist.zip $AWS_INSTANCE_URL:~/

# Copy the .env file to the AWS Instance to use it as a placeholder only if it doesn't exist
echo "Copying the .env file to the AWS instance..."
scp -i $MY_AWS_PEM_KEY ./.env $AWS_INSTANCE_URL:~/

# Connect to AWS instance through SSH
echo "Connecting through SSH to the AWS instance..."
echo "The process will continue in the background and the output will be redirected to nohup.out file"
nohup ssh -i $MY_AWS_PEM_KEY $AWS_INSTANCE_URL "${SSH_SCRIPT}" &

# Close successfully
exit 0
