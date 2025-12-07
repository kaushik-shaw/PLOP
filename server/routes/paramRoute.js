import express from 'express';
import { getAllParameters } from '../controllers/dataController.js';

const paramRouter = express.Router();

paramRouter.get('/parameters', getAllParameters);

export default paramRouter;