import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { isEtudiant, isProprietaire } from '../middlewares/roleMiddleware.js';
import {
    ReserveLogement,
    GetLogementOccupants,
    GetMyReservations,
    CancelMyReservation,
    GetOwnerReservations,
    UpdateReservationStatusByOwner
} from '../controllers/ReservationControllers.js';

const reservationroutes = express.Router();

reservationroutes.post('/', authMiddleware, isEtudiant, ReserveLogement);
reservationroutes.get('/me', authMiddleware, isEtudiant, GetMyReservations);
reservationroutes.delete('/:logement_id', authMiddleware, isEtudiant, CancelMyReservation);
reservationroutes.get('/owner/me', authMiddleware, isProprietaire, GetOwnerReservations);
reservationroutes.patch('/:logement_id/etudiant/:etudiant_id/status', authMiddleware, isProprietaire, UpdateReservationStatusByOwner);
reservationroutes.get('/logement/:logement_id', authMiddleware, isProprietaire, GetLogementOccupants);

export { reservationroutes };
