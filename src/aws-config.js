function getAWS() {
  const AWS = require('aws-sdk');
  AWS.config.apiVersions = {
    cognitoidentityserviceprovider: process.env.COGNITO_IDENTITY_SERVICE_PROVIDER,
  };
  if (typeof Promise === 'undefined') {
    AWS.config.setPromisesDependency(require('bluebird'));
  }
  return AWS;
}

export default getAWS();
