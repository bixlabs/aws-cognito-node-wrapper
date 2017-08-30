import userRoutes from '../user-services';
import swagger from './swagger';

export default function (app) {
  app.use('/user', userRoutes());
  app.use('/swagger', swagger());
}
