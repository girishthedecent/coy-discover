import express from 'express';
import { listMatchesHandler } from '../../controllers/match.controller.js';

const matchRouter = express.Router();

matchRouter.get('/', listMatchesHandler);

export default matchRouter;
