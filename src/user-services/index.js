import express from 'express';
import UserService from './controller';
const router = new express.Router();
export default function () {
  const userService = new UserService();
  router.post('/create', userService.createUser);
  router.post('/login', userService.login);
  router.post('/confirm-login', userService.confirmLogin);
  router.post('/reset-password', userService.resetPassword);
  router.post('/update', userService.updateUser);
  router.post('/forgot-password', userService.forgotPassword);
  router.post('/confirm-new-password', userService.confirmNewPassword);
  router.post('/sign-up', userService.signUp);
  router.post('/confirm-sign-up', userService.confirmSignUp);
  router.get('/logout/:username', userService.logout);
  router.get('/:username', userService.getUser);
  return router;
}
