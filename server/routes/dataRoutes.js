import express from 'express';
import { getAllData } from '../controllers/dataController.js';

const dataRouter = express.Router();

dataRouter.get('/', getAllData);


export default dataRouter;