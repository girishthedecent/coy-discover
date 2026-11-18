import express from 'express';
import { serverConfig } from '../../config/index.js';
import { attachCurrentUser, noStoreMiddleware } from '../../middlewares/currentUser.middleware.js';
import demoRouter from './demo.routes.js';
import feedRouter from './feed.routes.js';
import healthRouter from './health.routes.js';
import matchRouter from './match.routes.js';
import swipeRouter from './swipe.routes.js';

const v1Router = express.Router();

v1Router.use('/health', healthRouter);

v1Router.use(noStoreMiddleware, attachCurrentUser);
v1Router.use('/feed', feedRouter);
v1Router.use('/swipe', swipeRouter);
v1Router.use('/matches', matchRouter);
if (serverConfig.DEMO_RESET_ENABLED) v1Router.use('/demo', demoRouter);

export default v1Router;
