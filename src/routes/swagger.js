import express from 'express';
import {swagDocHandler} from '../utils';
import {common} from '../config';
const router = new express.Router();
export default function () {
  router.get('/', (request, response) => {
    response.redirect(301, `http://swagger.daguchuangyi.com/?url=http://${request.headers.host}:${common.port}/swagger/swagger.json#!`);
  });
  router.get('/swagger.json', swagDocHandler);
  return router;
}
