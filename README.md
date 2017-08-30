# AWS Cognito Node Wrapper

Simple Node Server to use AWS Cognito, this will abstract you from some configurations and it has a quick deployment script to an AWS Instance.

## Technologies
- NodeJS
- ExpressJS
- MochaJS (doesn't have test for now, is just a wrapper so there is not much value in test for this)
- swagger-doc. Visualize document using Swagger UI.
- ES6/ES7
- ESLint [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

## Make sure to install dependencies
``$ npm install``

# To run for Development
``$ npm start``

# To build for Production
``$ npm run build``

# To run in production
``$ npm run serve``

# To run tests
``$ npm run test``

# How to deploy
``$ npm run clean``

``$ npm run build``

After this a  _dist_ folder will be created, you can use it to run this code.
Have in mind that this process doesn't append the node_modules to the dist folder
so you will have to ``npm install`` in the environment where you are going
to run this code.

Make sure that you have the correct version of node installed in the environment (the version to use is provided
in the _package.json_ file)

After you have everything setup you just have to run (_main.js_ is a file inside of the folder _dist_):

``$ node dist/main &`` or ``npm run serve``

Use ``nohup`` if you want the process to output to a file like this:

``$ nohup npm run serve &``

TODOs:
* The deployment script should install the correct node version in the server in case node is not present.
* We should be using PM2 for monitoring, maybe setup this through the deployment script.
* We should be using a dedicated HTTP Server like NGINX and it should be installed through the deployment script.

Automatic Deployment (IMPORTANT: This script is not setting environment variables, you will have to do that manually, at least for the first time, putting a .env file in the root of where the code is with the correct values should be enough):

``$ npm run deploy``

``$ sh deployment.sh $MY_AWS_PEM_KEY $AWS_INSTANCE_URL``

$MY_AWS_PEM_KEY is a key that provides access to the AWS instance.
$AWS_INSTANCE_URL is the URL of the AWS instance.

To see the API Documentation go to ``/swagger``
