import jwt from 'jsonwebtoken';
import request from 'request-promise';
import jwkToPem from 'jwk-to-pem';
import AWS from '../../aws-config';
import credentials from '../../environment';


class JWTManager {
  static generatedPems;
  static iss;

  async validateToken(request, response) {
    const token = request.body.AuthParameters.TOKEN;
    this.loadISS();

    // Fail if the token is not jwt
    const decodedJwt = jwt.decode(token, {complete: true});
    if (!decodedJwt) {
      console.log('Not a valid JWT token');
      response.status(403).send({message: 'Not authorized'});
      return;
    }

    // Fail if token is not from your User Pool
    if (decodedJwt.payload.iss !== JWTManager.iss) {
      console.log('invalid issuer');
      response.status(403).send({message: 'Not authorized'});
      return;
    }

    // Reject the jwt if it's not an 'Access Token'
    if (decodedJwt.payload.token_use !== 'access') {
      console.log('Not an access token');
      response.status(403).send({message: 'Not authorized'});

      return;
    }

    // Get the kid from the token and retrieve corresponding PEM
    const kid = decodedJwt.header.kid;
    const pems = await this.generatePEMFromJSONWebKeys();
    const pem = pems[kid];
    if (!pem) {
      console.log('Invalid access token');
      response.status(403).send({message: 'Not authorized'});

      return;
    }

    // Verify the signature of the JWT token to ensure it's really coming from your User Pool

    try {
      let decoded = jwt.verify(token, pem, {issuer: JWTManager.iss});
      decoded = this.cleanTokenAttributes(decoded);
      response.status(200).send(decoded);
    } catch (error) {
      console.log('invalid access token');
      response.status(403).send({message: 'Not authorized'});
    }
  }

  loadISS() {
    if (!JWTManager.iss) {
      JWTManager.iss = process.env.ISS;
    }
  }

  async generatePEMFromJSONWebKeys() {
    try {
      if (JWTManager.generatedPems === undefined) {
        const response = await request({url: `${JWTManager.iss}/.well-known/jwks.json`, json: true});
        this.generatePemFile(response.keys);
      }
      return JWTManager.generatedPems;
    } catch (error) {
      throw error;
    }
  }

  generatePemFile(keys) {
    for (let i = 0; i < keys.length; i++) {
      const key_id = keys[i].kid;
      const modulus = keys[i].n;
      const exponent = keys[i].e;
      const key_type = keys[i].kty;
      const jwk = {kty: key_type, n: modulus, e: exponent};
      JWTManager.generatedPems = {};
      JWTManager.generatedPems[key_id] = jwkToPem(jwk);
    }
  }

  cleanTokenAttributes(decodedToken) {
    delete decodedToken.token_use;
    delete decodedToken.scope;
    delete decodedToken.iss;
    delete decodedToken.iat;
    delete decodedToken.jti;
    delete decodedToken.client_id;
    return decodedToken;
  }

  /**
   * @swagger
   * /user/refresh-token:
   *   post:
   *     summary: Provides a new JWT Token.
   *     description: You have to use this when the JWT token is about to expire or it did expired already.
   *     tags:
   *       - User
   *     parameters:
   *     - name: refreshTokenDetails
   *       in: body
   *       required: true
   *       schema:
   *         type: object
   *         required: ["AuthParameters"]
   *         properties:
   *           AuthParameters:
   *             type: object
   *             description: Refresh token.
   *             properties:
   *               REFRESH_TOKEN:
   *                 type: string
   *             example: { REFRESH_TOKEN: "fdb8fdbecf1d03ce5e6125c067733c0d51de209c" }
   *     responses:
   *       200:
   *         description: The new access token was generated successfully
   *         schema:
   *           type: object
   *           $ref: '#/definitions/loginResponse'
   *       400:
   *         description: The user must complete a reset password flow or the user is not confirmed successfully.
   *         schema:
   *           type: object
   *           $ref: '#/definitions/error'
   *       401:
   *         description: Not authorized.
   *         schema:
   *           type: object
   *           $ref: '#/definitions/error'
   *       404:
   *         description: User not found.
   *         schema:
   *           type: object
   *           $ref: '#/definitions/error'
   *       429:
   *         description: Too many requests.
   *         schema:
   *           type: object
   *           $ref: '#/definitions/error'
   *       500:
   *         description: Something went wrong in the server.
   *         schema:
   *           type: object
   *           $ref: '#/definitions/error'
   */
  async refreshToken(request, response) {
    const refreshTokenDetails = request.body;
    refreshTokenDetails.AuthFlow = 'REFRESH_TOKEN_AUTH';
    refreshTokenDetails.ClientId = credentials.CLIENT_ID;
    refreshTokenDetails.UserPoolId = credentials.USER_POOL_ID;
    const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
    try {
      const data = await cognitoIdentityServiceProvider.adminInitiateAuth(refreshTokenDetails).promise();
      response.status(200).send({data});
    } catch (error) {
      console.log(error, error.stack);
    }
  }
}

export default JWTManager;
