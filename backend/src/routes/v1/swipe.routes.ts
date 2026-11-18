import express from 'express';
import { validateRequestBody } from '../../middlewares/validator.middleware.js';
import { recordSwipeHandler } from '../../controllers/swipe.controller.js';
import { swipeBodySchema } from '../../validators/swipe.validator.js';

const swipeRouter = express.Router();

swipeRouter.post('/', validateRequestBody(swipeBodySchema), recordSwipeHandler);

export default swipeRouter;
