import express from 'express';
import {swagDocHandler} from '../utils';
const router = new express.Router();
export default function () {
  router.get('/', (request, response) => {
    response.redirect(301, 'http://swagger.daguchuangyi.com/?url=http://localhost:9001/swagger/swagger.json#!');
  });
  router.get('/swagger.json', swagDocHandler);
  return router;
}
