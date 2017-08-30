import 'babel-polyfill';
import config from 'config';
import express from 'express';
import bodyParser from 'body-parser';
import routes from 'routes';
import log from 'log';
import cors from 'cors';
import {errorHandle} from 'utils';

// error handle
process.on('unhandledRejection', err => {
  throw err;
});

process.on('uncaughtException', err => {
  log.error('uncaughtException:', err);
});

const app = express();

app.use(cors());
app.use(bodyParser.json({
  limit: '50mb'
}));

routes(app);

app.use(errorHandle);

const port = config.port;
app.listen(port, () => {
  log.info(`App is listening on ${port}.`);
});

export default app;
