import AWS from '../aws-config';
import credentials from '../environment';
import ForgotPasswordExceptionHandler from './exception-handlers/forgot-password';
import LoginExceptionHandler from './exception-handlers/login';
import CreateUserExceptionHandler from './exception-handlers/create-user';
import ConfirmLoginExceptionHandler from './exception-handlers/confirm-login';
import LogoutExceptionHandler from './exception-handlers/logout';
import UpdateUserExceptionHandler from './exception-handlers/update-user';
import GetUserExceptionHandler from './exception-handlers/get-user';
import SignUpExceptionHandler from './exception-handlers/sign-up';
import ConfirmSignUpExceptionHandler from './exception-handlers/confirm-sign-up';
import {resolveErrorAndRespond} from '../utils/helpers';

class UserService {

  /**
   * @swagger
   * /user/create:
   *   post:
   *     summary: User sign up by admin
   *     description: Registers a new user created by an admin.
   *     tags:
   *       - User
   *     parameters:
   *       - signUpDetails: Object
   *         in: body
   *         required: true
   *         description: Details to register new user
   *         schema:
   *           type: Object
   *           required: ["Username","UserAttributes"]
   *           properties:
   *             Username:
   *               type: string
   *               description: Username of the user to be created.
   *             UserAttributes:
   *               type: Array<map>
   *               description: An array of name-value pairs that contain user attributes and attribute values
   *               to be set for the user to be created.
   *               [{ Name: "email", Value: },{ Name: "phone_number", Value: }, ...]
   *     responses:
   *       200:
   *         description: User created successfully
   *       400:
   *         description: Error coming from AWS Cognito
   */
  async createUser(request, response) {
    const signUpDetails = request.body;
    signUpDetails.UserPoolId = credentials.USER_POOL_ID;
    signUpDetails.DesiredDeliveryMediums = ['EMAIL'];
    const emailValidation = {Name: 'email_verified', Value: 'true'};
    signUpDetails.UserAttributes.push(emailValidation);
    const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
    try {
      const data = await cognitoIdentityServiceProvider.adminCreateUser(signUpDetails).promise();
      response.status(200).send({data});
    } catch (error) {
      console.log(error, error.stack);
      resolveErrorAndRespond(error, CreateUserExceptionHandler, response);
    }
  }

  /**
   * @swagger
   * /user/login:
   *   post:
   *     summary: User login
   *     description: If the user was created by an admin, and it is it's first time loging in, this will
   *     return a 'NEW_PASSWORD_REQUIRED' challenge.
   *       If not, this function will return the ID, access and refresh tokens.
   *     tags:
   *       - User
   *     parameters:
   *       - loginDetails: Object
   *         in: body
   *         required: true
   *         description: Details to login the user
   *         schema:
   *           type: Object
   *           required: ["AuthParameters"]
   *           properties:
   *             AuthParameters:
   *               type: Object
   *               description: Username, password of the user. Both have string values
   *               {USERNAME: , PASSWORD: }
   *     responses:
   *       200:
   *         description: User logged in successfully
   *         If the user is in confirmed state already it returns:
   *         - ChallengeParameters (empty object)
   *         - AuthenticationResult
   *           - Access, ID, and refresh tokens.
   *           - ExpiresIn
   *           - TokenType
   *         If not it returns:
   *         - ChallengeName (it will be NEW_PASSWORD_REQUIRED if its the first time a user created by an admin tries to log in)
   *         - ChallengeParameters
   *           - USER_IF_FOR_SRP (needed for confirmLogin. It's the user's username)
   *         - Session (needed for confirmLogin)
   *       400:
   *         description: Error coming from AWS Cognito
   */
  /* User login.
   If the user was created by an admin and its the first time logging in, it returns all the requested attributes
   that the user must provide to complete the login (and then confirmLogIn should be called later with that info).
   If not, it logs in the user and returns the tokens */
  async login(request, response) {
    const loginDetails = request.body;
    loginDetails.AuthFlow = 'ADMIN_NO_SRP_AUTH';
    loginDetails.ClientId = credentials.CLIENT_ID;
    loginDetails.UserPoolId = credentials.USER_POOL_ID;
    const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
    try {
      const data = await cognitoIdentityServiceProvider.adminInitiateAuth(loginDetails).promise();
      response.status(200).send({data});
    } catch (error) {
      console.log(error, error.stack);
      resolveErrorAndRespond(error, LoginExceptionHandler, response);
    }
  }

  /**
   * @swagger
   * /user/confirm-login:
   *   post:
   *     summary: User login confirmation
   *     description: This is called after the user was requested to insert a new password
   *       because it was created by an admin and it is it's first time logging in.
   *     tags:
   *       - User
   *     parameters:
   *       - confirmLoginDetails: Object
   *         in: body
   *         required: true
   *         description: New attributes of the user
   *         schema:
   *           type: Object
   *           required: ["ChallengeResponses", "Session"]
   *           properties:
   *             ChallengeResponses:
   *               type: Object
   *               description: New password of the user.
   *               {NEW_PASSWORD: , USERNAME: }
   *                 note: only the username can be provided, NOT an alias.
   *             Session:
   *               type: string
   *               description: Session returned when calling 'login'
   *     responses:
   *       200:
   *         description: User logged in successfully
   *       400:
   *         description: Error coming from AWS Cognito
   */
  async confirmLogin(request, response) {
    const confirmLoginDetails = request.body;
    confirmLoginDetails.ChallengeName = 'NEW_PASSWORD_REQUIRED';
    confirmLoginDetails.ClientId = credentials.CLIENT_ID;
    confirmLoginDetails.UserPoolId = credentials.USER_POOL_ID;
    const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
    try {
      const data = await cognitoIdentityServiceProvider.adminRespondToAuthChallenge(confirmLoginDetails).promise();
      response.status(200).send({data});
    } catch (error) {
      console.log(error, error.stack);
      resolveErrorAndRespond(error, ConfirmLoginExceptionHandler, response);
    }
  }

  /**
   * @swagger
   * /user/logout/:username :
   *   get:
   *     summary: User log out.
   *     description: User log out.
   *     tags:
   *       - User
   *     parameters:
   *       - logoutDetails: Object
   *         in: query
   *         required: true
   *         description: Username of the user to log out
   *         schema:
   *           type: object
   *           required: ["username"]
   *           properties:
   *             username:
   *               type: string
   *               description: Username of the user.
   *     responses:
   *       200:
   *         description: User logged out successfully
   *       400:
   *         description: Error coming from AWS Cognito
   */
  async logout(request, response) {
    const logoutDetails = {
      Username: request.params.username,
      UserPoolId: credentials.USER_POOL_ID
    };
    const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
    try {
      const data = await cognitoIdentityServiceProvider.adminUserGlobalSignOut(logoutDetails).promise();
      response.status(200).send({data});
    } catch (error) {
      console.log(error, error.stack);
      resolveErrorAndRespond(error, LogoutExceptionHandler, response);
    }
  }

  /**
   * @swagger
   * /user/reset-password:
   *   post:
   *     summary: Change user's password
   *     description: When a developer calls this API, the current password is invalidated, so it must be changed.
   *     If a user tries to sign in after the API is called, the app will get a PasswordResetRequiredException exception
   *     back and should direct the user down the flow to reset the password, which is the same as the forgot password flow.
   *     In addition, if the user pool has phone verification selected and a verified phone number exists for the user,
   *     or if email verification is selected and a verified email exists for the user, calling this API will also result
   *     in sending a message to the end user with the code to change their password.
   *     tags:
   *       - User
   *     parameters:
   *       - resetPasswordDetails: Object
   *         in: body
   *         required: true
   *         description: Details to change the user's password
   *         schema:
   *           type: object
   *           required: ["Username"]
   *           properties:
   *             Username:
   *               type: string
   *               description: Username of the user.
   *     responses:
   *       200:
   *         description: New password request made successfully
   *       400:
   *         description: Error coming from AWS Cognito
   */
  async resetPassword(request, response) {
    const resetPasswordDetails = request.body;
    resetPasswordDetails.UserPoolId = credentials.USER_POOL_ID;
    const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
    try {
      const data = await cognitoIdentityServiceProvider.adminResetUserPassword(resetPasswordDetails).promise();
      response.status(200).send({data});
    } catch (error) {
      console.log(error, error.stack);
      resolveErrorAndRespond(error, ForgotPasswordExceptionHandler, response);
    }
  }

  /**
   * @swagger
   * /user/update:
   *   post:
   *     summary: Admin updates a user's attributes
   *     description: Admin updates one or more attributes of the user related to the provided username
   *     tags:
   *       - User
   *     parameters:
   *       - userDetails: Object
   *         in: body
   *         required: true
   *         description: Details of the user's attributes to be updated.
   *         schema:
   *           type: Object
   *           required: ["Username","UserAttributes"]
   *           properties:
   *             Username:
   *               type: string
   *               description: Username of the user to be updated. Only required if an admin is making the update.
   *             UserAttributes:
   *               type: Array<Map>
   *               description: An array of name-value pairs representing the user attributes that will be updated and their new values.
   *                 For custom attributes, you must prepend the custom: prefix to the attribute name.
   *               [{ Name: ,Value: }, { Name: ,Value: }, ...]
   *     responses:
   *       200:
   *         description: User updated successfully
   *       400:
   *         description: Error coming from AWS Cognito
   */
  async updateUser(request, response) {
    const userDetails = request.body;
    userDetails.UserAttributes.push({Name: 'email_verified', Value: 'true'});
    userDetails.UserPoolId = credentials.USER_POOL_ID;
    const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
    try {
      const data = await cognitoIdentityServiceProvider.adminUpdateUserAttributes(userDetails).promise();
      response.status(200).send({data});
    } catch (error) {
      console.log(error, error.stack);
      resolveErrorAndRespond(error, UpdateUserExceptionHandler, response);
    }
  }

  /**
   * @swagger
   * /user/forgot-password:
   *   post:
   *     summary: First step of the forgot password flow
   *     description: Sends an email with a secret code to the user
   *     tags:
   *       - User
   *     parameters:
   *       - forgotPasswordDetails: Object
   *         in: body
   *         required: true
   *         description: Details to start forgot password flow
   *         schema:
   *           type: Object
   *           required: ["Username"]
   *           properties:
   *             Username:
   *               type: string
   *               description: Username of the user that forgot its password.
   *     responses:
   *       200:
   *         description: Email sent successfully
   *           - data: Object
   *             schema:
   *               properties:
   *                 CodeDeliveryDetails:
   *                    type: Map
   *                    description: The code delivery details returned by the server in response to the request to reset a password.
   *                    {"Destination",value} The destination for the code delivery details.
   *                    {"DeliveryMedium", value} The delivery medium (email message or phone number). Possible values include: "SMS", "EMAIL".
   *                    {"AttributeName", value} The name of the attribute in the code delivery details type.
   *       400:
   *         description: Error coming from AWS Cognito
   */
  async forgotPassword(request, response) {
    const forgotPasswordDetails = request.body;
    forgotPasswordDetails.ClientId = credentials.CLIENT_ID;
    const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
    try {
      const data = await cognitoIdentityServiceProvider.forgotPassword(forgotPasswordDetails).promise();
      response.status(200).send({data});
    } catch (error) {
      console.log(error, error.stack);
      resolveErrorAndRespond(error, ForgotPasswordExceptionHandler, response);
    }
  }

  /**
   * @swagger
   * /user/confirm-new-password:
   *   post:
   *     summary: Final step of the forgot password flow or the reset password flow
   *     description: Checks secret code and saves new password
   *     tags:
   *       - User
   *     parameters:
   *       - confirmForgotPasswordDetails: Object
   *         in: body
   *         required: true
   *         description: Details to finish forgot password flow
   *         schema:
   *           type: Object
   *           required: ["Username","ConfirmationCode","Password"]
   *           properties:
   *             Username:
   *               type: string
   *               description: Username of the user that forgot its password.
   *             ConfirmationCode:
   *               type: string
   *               description: Confirmation secret code sent by email
   *             Password:
   *               type: string
   *               description: New password to be set to the user
   *     responses:
   *       200:
   *         description: New password set successfully
   *       400:
   *         description: Error coming from AWS Cognito
   */
  async confirmNewPassword(request, response) {
    const confirmNewPasswordDetails = request.body;
    confirmNewPasswordDetails.ClientId = credentials.CLIENT_ID;
    const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
    try {
      const data = await cognitoIdentityServiceProvider.confirmForgotPassword(confirmNewPasswordDetails).promise();
      response.status(200).send({data});
    } catch (error) {
      console.log(error);
      resolveErrorAndRespond(error, ForgotPasswordExceptionHandler, response);
    }
  }

  /**
   * @swagger
   * /user/:username :
   *   get:
   *     summary: Gets user attributes.
   *     description: Gets user attributes.
   *     tags:
   *       - User
   *     parameters:
   *       - getUserDetails: Object
   *         in: query
   *         required: true
   *         description: Username of the user.
   *         schema:
   *           type: object
   *           required: ["username"]
   *           properties:
   *             username:
   *               type: string
   *               description: Username of the user.
   *     responses:
   *       200:
   *         description: Got user attributes successfully
   *       400:
   *         description: Error coming from AWS Cognito
   */
  async getUser(request, response) {
    const getUserDetails = {
      Username: request.params.username,
      UserPoolId: credentials.USER_POOL_ID
    };
    const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
    try {
      const data = await cognitoIdentityServiceProvider.adminGetUser(getUserDetails).promise();
      console.log(data);
      response.status(200).send({data});
    } catch (error) {
      console.log(error, error.stack);
      resolveErrorAndRespond(error, GetUserExceptionHandler, response);
    }
  }

  /**
   * @swagger
   * /user/signup:
   *   post:
   *     summary: User sign up
   *     description: Registers a new user, and sends an email with a confirmation code for email validation.
   *     tags:
   *       - User
   *     parameters:
   *       - signUpDetails: Object
   *         in: body
   *         required: true
   *         description: Details to register new user
   *         schema:
   *           type: Object
   *           required: ["username","userAttributes","password"]
   *           properties:
   *             Username:
   *               type: string
   *               description: Username of the user to be created.
   *             UserAttributes:
   *               type: Array<map>
   *               description: An array of name-value pairs that contain user attributes and attribute values to be set for the user to be created.
   *               [{ Name: "email", Value: },{ Name: "phone_number", Value: }, ...]
   *             Password:
   *               type: string
   *               description: The user's password.
   *     responses:
   *       200:
   *         description: User created successfully, awaiting email validation.
   *       400:
   *         description: Error coming from AWS Cognito
   */
  async signUp(request, response) {
    const signUpDetails = request.body;
    signUpDetails.ClientId = credentials.CLIENT_ID;
    const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
    try {
      const data = await cognitoIdentityServiceProvider.signUp(signUpDetails).promise();
      response.status(200).send({data});
    } catch (error) {
      console.log(error, error.stack);
      resolveErrorAndRespond(error, SignUpExceptionHandler, response);
    }
  }

  /**
   * @swagger
   * /user/confirm-signup:
   *   post:
   *     summary: Confirms user's sign up
   *     description: It confirms a new user (and validates its email address) by checking the username and the confirmation code sent to their email.
   *     tags:
   *       - User
   *     parameters:
   *       - confirmSignUpDetails: Object
   *         in: body
   *         required: true
   *         description: Details to confirm new user
   *         schema:
   *           type: Object
   *           required: ["Username","ConfirmationCode"]
   *           properties:
   *             Username:
   *               type: string
   *               description: Username of the user.
   *             ConfirmationCode:
   *               type: string
   *               description: The confirmation code sent to the user's email.
   *     responses:
   *       200:
   *         description: User is now in confirmed state and is able to login.
   *       400:
   *         description: Error coming from AWS Cognito
   */
  async confirmSignUp(request, response) {
    const confirmSignUpDetails = request.body;
    confirmSignUpDetails.ClientId = credentials.CLIENT_ID;
    confirmSignUpDetails.ForceAliasCreation = false;
    const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
    try {
      const data = await cognitoIdentityServiceProvider.confirmSignUp(confirmSignUpDetails).promise();
      response.status(200).send({data});
    } catch (error) {
      console.log(error, error.stack);
      resolveErrorAndRespond(error, ConfirmSignUpExceptionHandler, response);
    }
  }

}

export default UserService;
