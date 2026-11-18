import express from 'express';
import { resetDemoHandler } from '../../controllers/demo.controller.js';

const demoRouter = express.Router();

demoRouter.post('/reset', resetDemoHandler);

export default demoRouter;
