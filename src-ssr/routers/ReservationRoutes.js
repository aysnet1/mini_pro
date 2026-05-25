import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { isEtudiant, isProprietaire } from '../middlewares/roleMiddleware.js';
import {
    ReserveLogement,
    GetLogementOccupants
} from '../controllers/ReservationControllers.js';

const reservationroutes = express.Router();

reservationroutes.post('/', authMiddleware, isEtudiant, ReserveLogement);
reservationroutes.get('/logement/:logement_id', authMiddleware, isProprietaire, GetLogementOccupants);

export { reservationroutes };
