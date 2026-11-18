import express from 'express';
import { validateQueryParams } from '../../middlewares/validator.middleware.js';
import { getFeedHandler } from '../../controllers/feed.controller.js';
import { feedQuerySchema } from '../../validators/feed.validator.js';

const feedRouter = express.Router();

feedRouter.get('/', validateQueryParams(feedQuerySchema), getFeedHandler);

export default feedRouter;
