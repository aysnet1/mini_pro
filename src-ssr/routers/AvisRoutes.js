import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { isEtudiant } from '../middlewares/roleMiddleware.js';
import { AddAvis, GetLogementAvis } from '../controllers/AvisControllers.js';

const avisroutes = express.Router();

avisroutes.post('/', authMiddleware, isEtudiant, AddAvis);
avisroutes.get('/logement/:logement_id', GetLogementAvis);

export { avisroutes };
