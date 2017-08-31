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
   *     summary: User registration by an admin
   *     description: Creates a new user and sends a welcome message with a temporary password via email.
   *       It also sets the email as verified by default.
   *     tags:
   *       - User
   *     parameters:
   *     - name: signUpDetails
   *       in: body
   *       required: true
   *       schema:
   *         type: object
   *         required: ["Username","UserAttributes"]
   *         properties:
   *           Username:
   *             type: string
   *             example: "johnDoe"
   *           UserAttributes:
   *             type: array
   *             description: "An array of name-value pairs that contain user attributes and attribute values to be set for the user to be created.
   *             An email attribute is required. For custom attributes a custom: prefix must be included"
   *             items:
   *               type: object
   *               properties:
   *                 Name:
   *                   type: string
   *                 Value:
   *                   type: string
   *             example: [{Name: "email", Value: "user@domain.com"}, {Name: "given_name", Value: "John"},
   *             {Name: "family_name", Value: "Doe"}, {Name: "phone_number", Value: "+14325551212"},
   *             {Name: "custom:work_phone",Value: "+14325551212"}, {Name: "custom:companyId", Value: "id"}]
   *     responses:
   *       200:
   *         description: "User created successfully."
   *         schema:
   *           type: object
   *           properties:
   *             data:
   *               type: object
   *               properties:
   *                 User:
   *                   type: object
   *                   properties:
   *                     Username:
   *                       type: string
   *                       example: "johnDoe"
   *                     UserCreateDate:
   *                       type: string
   *                       example: "2017-08-29T16:10:00.058Z"
   *                     UserLastModifiedDate:
   *                       type: string
   *                       example: "2017-08-29T16:10:00.058Z"
   *                     Enabled:
   *                       type: boolean
   *                       example: true
   *                     UserStatus:
   *                       type: string
   *                       description: The user's current status. As the user is being created by an admin it will always be
   *                         in the force_change_password state at this point.
   *                       enum: ["FORCE_CHANGE_PASSWORD","CONFIRMED","RESET_REQUIRED","UNCONFIRMED"]
   *                       example: "FORCE_CHANGE_PASSWORD"
   *                     Attributes:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           Name:
   *                             type: string
   *                           Value:
   *                             type: string
   *                       example: [{Name: "sub", Value: "subValue"}, {Name: "email", Value: "user@domain.com"},
   *                       {Name: "given_name", Value: "John"}, {Name: "family_name", Value: "Doe"},
   *                       {Name: "phone_number", Value: "+14325551212"}, {Name: "custom:work_phone",Value: "+14325551212"},
   *                       {Name: "custom:companyId", Value: "id"}]
   *       400:
   *         description: Username is already taken, there was a problem delivering the confirmation code or
   *           the user exists already in an unsupported state.
   *       401:
   *         description: Not authorized.
   *       404:
   *         description: User not found.
   *       429:
   *         description: Too many requests.
   *       500:
   *         description: Something went wrong in the server.
   */
  async createUser(request, response) {
    const signUpDetails = request.body;
    signUpDetails.UserPoolId = credentials.USER_POOL_ID;
    signUpDetails.DesiredDeliveryMediums = ['EMAIL'];
    const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
    try {
      const data = await cognitoIdentityServiceProvider.adminCreateUser(signUpDetails).promise();
      response.status(200).send({data});
    } catch (error) {
      console.log(error, error.stack);
      resolveErrorAndRespond(error, CreateUserExceptionHandler, response);
    }
  }

  /* User login.
   If the user was created by an admin and its the first time logging in, it returns all the requested attributes
   that the user must provide to complete the login (and then confirmLogIn should be called later with that info).
   If not, it logs in the user and returns the tokens */
  /**
   * @swagger
   * /user/login:
   *   post:
   *     summary: Initiates the authentication flow.
   *     description: If it's not the first time a user logs in, calling this service will login the user.
   *       On the other hand, if it's the first time a user logs in after an admin created the account,
   *       calling this service will return a challenge name and other details as a response which must
   *       be used to continue with the authentication flow.
   *     tags:
   *       - User
   *     parameters:
   *     - name: loginDetails
   *       in: body
   *       required: true
   *       schema:
   *         type: object
   *         required: ["AuthParameters"]
   *         properties:
   *           AuthParameters:
   *             type: object
   *             description: Username and password of the user.
   *             properties:
   *               USERNAME:
   *                 type: string
   *               PASSWORD:
   *                 type: string
   *             example: { USERNAME: "johnDoe", PASSWORD: "Password123" }
   *     responses:
   *       200:
   *         description: User logged in successfully or a confirm login challenge is thrown.
   *         schema:
   *           type: object
   *           properties:
   *             data:
   *               type: object
   *               properties:
   *                 ChallengeName:
   *                   type: string
   *                   description: Not returned if the user logged in correctly.
   *                   example: "NEW_PASSWORD_REQUIRED"
   *                 Session:
   *                   type: string
   *                   description: Session string to be used in the confirm login service as an authentication method.
   *                     An empty string is returned if the user is in confirmed state.
   *                   example: "SessionString"
   *                 ChallengeParameters:
   *                   type: object
   *                   description: An empty object is returned if there aren't any challenges (the user logged in successfully).
   *                   properties:
   *                     USER_ID_FOR_SRP:
   *                       type: string
   *                       description: The user's username. Useful in the confirm login service.
   *                       example: "johnDoe"
   *                     requiredAttributes:
   *                       type: object
   *                       description: Required attributes that were not set yet.
   *                       example: []
   *                     userAttributes:
   *                       type: object
   *                       description: The user's current attributes.
   *                       example: {email_verified: true, phone_number: "+12345678910", given_name: "John",
   *                         family_name: "Doe", email: "email@domain.com" }
   *                 AuthenticationResult:
   *                   type: object
   *                   description: Only returned if the user logged in correctly (there weren't any pending challenges)
   *                   properties:
   *                     AccessToken:
   *                       type: string
   *                     IdToken:
   *                       type: string
   *                     RefreshToken:
   *                       type: string
   *                     ExpiresIn:
   *                       type: number
   *                     TokenType:
   *                       type: string
   *       400:
   *         description: The user must complete a reset password flow or the user is not confirmed successfully.
   *       401:
   *         description: Not authorized.
   *       404:
   *         description: User not found.
   *       429:
   *         description: Too many requests.
   *       500:
   *         description: Something went wrong in the server.
   */
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
   *     summary: User confirm login.
   *     description: It sets a new password to the user and logs it in if no more challenges are returned.
   *     tags:
   *       - User
   *     parameters:
   *     - name: confirmLoginDetails
   *       in: body
   *       required: true
   *       description: User's username and new password to be set and a session string for user authentication.
   *       schema:
   *         type: object
   *         required: ["ChallengeResponses", "Session"]
   *         properties:
   *           ChallengeResponses:
   *             type: object
   *             description: The user's username and a new password to be set.
   *             properties:
   *               USERNAME:
   *                 type: string
   *               NEW_PASSWORD:
   *                 type: string
   *             example: {USERNAME: "johnDoe", NEW_PASSWORD: "NewPassword123"}
   *           Session:
   *             type: string
   *             description: Session string returned after calling the login service
   *             example: "sessionString"
   *     responses:
   *       200:
   *         description: User logged in and a new password was set successfully.
   *         schema:
   *           type: object
   *           properties:
   *             data:
   *               type: object
   *               properties:
   *                 ChallengeName:
   *                   type: string
   *                   description: Not returned if the user logged in correctly.
   *                   example: "NEW_PASSWORD_REQUIRED"
   *                 Session:
   *                   type: string
   *                   description: Session string to be used in the confirm login service as an authentication method.
   *                     An empty string is returned if the user is in confirmed state.
   *                   example: "SessionString"
   *                 ChallengeParameters:
   *                   type: object
   *                   description: An empty object is returned if there aren't any challenges (the user logged in successfully).
   *                   properties:
   *                     USER_ID_FOR_SRP:
   *                       type: string
   *                       description: The user's username. Useful in the confirm login service.
   *                       example: "johnDoe"
   *                     requiredAttributes:
   *                       type: object
   *                       description: Required attributes that were not set yet.
   *                       example: []
   *                     userAttributes:
   *                       type: object
   *                       description: The user's current attributes.
   *                       example: {email_verified: true, phone_number: "+12345678910", given_name: "John",
   *                         family_name: "Doe", email: "email@domain.com" }
   *                 AuthenticationResult:
   *                   type: object
   *                   description: Only returned if the user logged in correctly (there weren't any pending challenges)
   *                   properties:
   *                     AccessToken:
   *                       type: string
   *                     IdToken:
   *                       type: string
   *                     RefreshToken:
   *                       type: string
   *                     ExpiresIn:
   *                       type: number
   *                     TokenType:
   *                       type: string
   *       400:
   *         description: ' Possible errors:
   *           - The user must complete a reset password flow.
   *           - The user was not confirmed successfully.
   *           - Invalid user pool configuration.
   *           - Invalid parameters.
   *           - Email already exists.
   *           - Wrong confirmation code.
   *           - The confirmation code expired.
   *           - Invalid password. '
   *       401:
   *          description: Not authorized.
   *       404:
   *         description: User not found.
   *       429:
   *         description: Too many requests.
   *       500:
   *         description: Something went wrong in the server.
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
   * /user/logout/{username}:
   *   get:
   *     summary: User logout.
   *     description: User logout.
   *     tags:
   *       - User
   *     parameters:
   *     - name: username
   *       in: path
   *       description: The username of the user to log out.
   *       required: true
   *       type: string
   *     responses:
   *       200:
   *         description: User logged out successfully.
   *         schema:
   *           type: object
   *           properties:
   *             data:
   *               type: object
   *               description: Empty object.
   *               example: {}
   *       400:
   *         description: Invalid parameters.
   *       401:
   *         description: Not authorized.
   *       404:
   *         description: User not found.
   *       429:
   *         description: Too many requests.
   *       500:
   *         description: Something went wrong in the server.
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
   *     summary: Resets a user's password.
   *     description: "When a developer calls this API, the current password is invalidated, so it must be changed.
   *       If a user tries to sign in after the API is called, the app will get a PasswordResetRequiredException exception
   *       back and should direct the user down the flow to reset the password, which is the same as the forgot password flow.
   *       In addition, this API will also result in sending an email to the end user with the code to change their password."
   *     tags:
   *       - User
   *     parameters:
   *     - name: resetPasswordDetails
   *       in: body
   *       required: true
   *       description: Details to reset the user's password.
   *       schema:
   *         type: object
   *         required: ["Username"]
   *         properties:
   *           Username:
   *             type: string
   *             description: Username of the user.
   *             example: "johnDoe"
   *     responses:
   *       200:
   *         description: New password request made successfully.
   *         schema:
   *           type: object
   *           properties:
   *             data:
   *               type: object
   *               description: Empty object.
   *               example: {}
   *       400:
   *         description: "Possible errors:
   *           - The user is not confirmed.
   *           - The email is not verified.
   *           - Wrong confirmation code.
   *           - The confirmation code expired."
   *       404:
   *         description: User not found.
   *       429:
   *         description: Too many requests or attempt limit exceeded.
   *       500:
   *         description: Something went wrong in the server.
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
   @swagger
   * /user/update:
   *   post:
   *     summary: Updates the provided attributes of a user.
   *     description: Calling this service will update one or more attributes of the user related to the provided username.
   *     tags:
   *       - User
   *     parameters:
   *     - name: userDetails
   *       in: body
   *       required: true
   *       description: Details of the user's attributes to be updated.
   *       schema:
   *         type: object
   *         required: ["Username","UserAttributes"]
   *         properties:
   *           Username:
   *             type: string
   *             description: Username of the user to be updated. Only required if an admin is making the update.
   *             example: "johnDoe"
   *           UserAttributes:
   *             type: array
   *             description: "An array of name-value pairs representing the user attributes that will be updated
   *               and their new values. For custom attributes the prefix custom: is required."
   *             items:
   *               type: object
   *               properties:
   *                 Name:
   *                   type: string
   *                 Value:
   *                   type: string
   *             example: [{Name: "given_name", Value: "John"}, {Name: "family_name", Value: "Doe"},
   *             {Name: "phone_number", Value: "+14325551212"}, {Name: "custom:work_phone",Value: "+14325551212"}]
   *     responses:
   *       200:
   *         description: User updated successfully.
   *         schema:
   *           type: object
   *           properties:
   *             data:
   *               type: object
   *               description: Empty object.
   *               example: {}
   *       400:
   *         description: Email doesn't exist or there are invalid parameters.
   *       401:
   *         description: Not authorized.
   *       404:
   *         description: User not found.
   *       429:
   *         description: Too many requests.
   *       500:
   *         description: Something went wrong in the server.
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
   *     summary: First step of the forgot password flow.
   *     description: Sends an email with a secret code to the user.
   *     tags:
   *       - User
   *     parameters:
   *     - name: forgotPasswordDetails
   *       in: body
   *       required: true
   *       description: Details to start the forgot password flow.
   *       schema:
   *         type: object
   *         required: ["Username"]
   *         properties:
   *           Username:
   *             type: string
   *             description: Username of the user that forgot its password.
   *             example: "johnDoe"
   *     responses:
   *       200:
   *         description: Email sent successfully.
   *         schema:
   *           type: object
   *           properties:
   *             data:
   *               type: object
   *               properties:
   *                 CodeDeliveryDetails:
   *                   type: object
   *                   properties:
   *                     Destination:
   *                       type: string
   *                       description: Email address where the forgot password email was sent.
   *                       example: "email@domain.com"
   *                     DeliveryMedium:
   *                       type: string
   *                       Enum: ["EMAIL","SMS"]
   *                       example: "EMAIL"
   *                     AttributeName:
   *                       type: string,
   *                       example: "email"
   *       400:
   *         description: "Possible errors:
   *           - The user is not confirmed.
   *           - The email is not verified.
   *           - Wrong confirmation code.
   *           - The confirmation code expired."
   *       404:
   *         description: User not found.
   *       429:
   *         description: Too many requests or attempt limit exceeded.
   *       500:
   *         description: Something went wrong in the server.
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
   *     summary: Final step of the forgot password or the reset password flow
   *     description: Checks the secret code, saves the new password for the user and invalidates the current session.
   *     tags:
   *       - User
   *     parameters:
   *     - name: confirmNewPasswordDetails
   *       in: body
   *       required: true
   *       description: Username, new password and confirmation code to complete the flow.
   *       schema:
   *         type: object
   *         required: ["Username","ConfirmationCode","Password"]
   *         properties:
   *           Username:
   *             type: string
   *             description: Username of the user that forgot its password.
   *             example: "johnDoe"
   *           ConfirmationCode:
   *             type: string
   *             description: Confirmation secret code sent by email.
   *             example: "123456"
   *           Password:
   *             type: string
   *             description: New password to be set to the user.
   *             example: "NewPassword123"
   *     responses:
   *       200:
   *         description: New password set successfully and current session invalidated.
   *         schema:
   *           type: object
   *           properties:
   *             data:
   *               type: object
   *               description: Empty object.
   *               example: {}
   *       400:
   *         description: "Possible errors:
   *           - The user is not confirmed.
   *           - The email is not verified.
   *           - Wrong confirmation code.
   *           - The confirmation code expired."
   *       404:
   *         description: User not found.
   *       429:
   *         description: Too many requests or attempt limit exceeded.
   *       500:
   *         description: Something went wrong in the server.
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
   * /user/{username}:
   *   get:
   *     summary: Gets a user's attributes.
   *     description: Gets a user's attributes.
   *     tags:
   *       - User
   *     parameters:
   *     - name: username
   *       in: path
   *       description: The username of the user.
   *       required: true
   *       type: string
   *     responses:
   *       200:
   *         description: Got user attributes successfully.
   *         schema:
   *           type: object
   *           properties:
   *             data:
   *               type: object
   *               properties:
   *                 Username:
   *                   type: string
   *                   example: "johnDoe"
   *                 UserCreateDate:
   *                   type: string
   *                   example: "2017-08-29T16:10:00.058Z"
   *                 UserLastModifiedDate:
   *                   type: string
   *                   example: "2017-08-29T16:10:00.058Z"
   *                 Enabled:
   *                   type: boolean
   *                   example: true
   *                 UserStatus:
   *                   type: string
   *                   description: The user's current status. As the user is being created by an admin it will always be
   *                     in the force_change_password state at this point.
   *                   enum: ["FORCE_CHANGE_PASSWORD","CONFIRMED","RESET_REQUIRED","UNCONFIRMED"]
   *                   example: "FORCE_CHANGE_PASSWORD"
   *                 UserAttributes:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       Name:
   *                         type: string
   *                       Value:
   *                         type: string
   *                   example: [{Name: "sub", Value: "subValue"}, {Name: "email", Value: "user@domain.com"},
   *                     {Name: "given_name", Value: "John"}, {Name: "family_name", Value: "Doe"}, {Name: "email_verified", Value: "true"},
   *                     {Name: "phone_number", Value: "+14325551212"}, {Name: "custom:work_phone",Value: "+14325551212"},
   *                     {Name: "custom:companyId", Value: "id"}]
   *       400:
   *         description: Invalid parameters.
   *       401:
   *         description: Not authorized.
   *       404:
   *         description: User not found.
   *       429:
   *         description: Too many requests.
   *       500:
   *         description: Something went wrong in the server.
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
   * user/sign-up:
   *   post:
   *     summary: User registration.
   *     description: Registers a new user, and sends an email with a confirmation code for email validation.
   *     tags:
   *       - User
   *     parameters:
   *     - name: signUpDetails
   *       in: body
   *       required: true
   *       description: Details to register a new user.
   *       schema:
   *         type: object
   *         required: ["Username","Password","UserAttributes"]
   *         properties:
   *           Username:
   *             type: string
   *             description: Username of the user to be created.
   *             example: "johnDoe"
   *           Password:
   *             type: string
   *             description: The user's password.
   *             example: "Password123"
   *           UserAttributes:
   *             type: array
   *             description: "An array of name-value pairs that contain user attributes and attribute values to be set for the user to be created.
   *               An email attribute is required. For custom attributes a custom: prefix must be included"
   *             items:
   *               type: object
   *               properties:
   *                 Name:
   *                   type: string
   *                 Value:
   *                   type: string
   *             example: [{Name: "email", Value: "user@domain.com"}, {Name: "given_name", Value: "John"},
   *               {Name: "family_name", Value: "Doe"}, {Name: "phone_number", Value: "+14325551212"},
   *               {Name: "custom:work_phone",Value: "+14325551212"}, {Name: "custom:companyId", Value: "id"}]
   *     responses:
   *       200:
   *         description: User created successfully, awaiting email validation.
   *         schema:
   *           type: object
   *           properties:
   *             data:
   *               type: object
   *               properties:
   *                 UserConfirmed:
   *                   type: boolean
   *                   example: false
   *                 CodeDeliveryDetails:
   *                   type: object
   *                   properties:
   *                     Destination:
   *                       type: string
   *                       description: Email address where the forgot password email was sent.
   *                       example: "email@domain.com"
   *                     DeliveryMedium:
   *                       type: string
   *                       Enum: ["EMAIL","SMS"]
   *                       example: "EMAIL"
   *                     AttributeName:
   *                       type: string,
   *                       example: "email"
   *                 UserSub:
   *                   type: string
   *       400:
   *         description: "Possible errors:
   *         - Invalid parameters.
   *         - Password does not match criteria.
   *         - Invalid email (for some reason this email can't be used for signup).
   *         - Username already exists.
   *         - Error sending the confirmation code."
   *       401:
   *         description: Not authorized.
   *       404:
   *         description: User not found.
   *       429:
   *         description: Too many requests.
   *       500:
   *         description: Something went wrong in the server.
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
   * /user/confirm-sign-up:
   *   post:
   *     summary: Confirms a user's registration.
   *     description: It confirms a new user (and validates its email address) by checking the username and the confirmation code sent to their email.
   *     tags:
   *       - User
   *     parameters:
   *     - name: confirmSignUpDetails
   *       in: body
   *       required: true
   *       description: Details to confirm the new user.
   *       schema:
   *         type: object
   *         required: ["Username","ConfirmationCode"]
   *         properties:
   *           Username:
   *             type: string
   *             description: Username of the user.
   *             example: "johnDoe"
   *           ConfirmationCode:
   *             type: string
   *             description: The confirmation code sent to the user's email.
   *             example: "123456"
   *     responses:
   *       200:
   *         description: User is now in confirmed state and is able to login.
   *         schema:
   *           type: object
   *           properties:
   *             data:
   *               type: object
   *               description: Empty object.
   *               example: {}
   *       400:
   *         description: "Possible errors:
   *           - The user must complete a reset password flow.
   *           - The user was not confirmed successfully.
   *           - Invalid parameters.
   *           - Email already exists.
   *           - Wrong confirmation code.
   *           - The confirmation code expired.
   *           - Password does not match criteria. "
   *       401:
   *         description: Not authorized.
   *       404:
   *         description: User not found.
   *       429:
   *         description: Too many requests or failed attempts.
   *       500:
   *         description: Something went wrong in the server.
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
