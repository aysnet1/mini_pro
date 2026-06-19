import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { isAdmin, isProprietaire } from '../middlewares/roleMiddleware.js';
import { uploadLogementPhotos, handleUploadErrors } from '../middlewares/uploadMiddleware.js';
import {
  AddLogement,
  GetAllLogements,
  GetMyLogements,
  GetLogementById,
  UpdateLogement,
  DeleteLogement,
  SetLogementStatusByAdmin,
  UploadLogementPhotos,
  DeleteLogementPhoto,
  GetLogementBookedDates,

} from '../controllers/LogementControllers.js';
import { SearchLogements } from '../controllers/RechercheControllers.js';

const logementroutes = express.Router();

logementroutes.post('/', authMiddleware, isProprietaire, AddLogement);

logementroutes.get('/me', authMiddleware, GetMyLogements);
logementroutes.get('/', GetAllLogements);
logementroutes.get('/:id/booked-dates', GetLogementBookedDates);
logementroutes.get('/:id', GetLogementById);
logementroutes.put('/:id', authMiddleware, isProprietaire, UpdateLogement);
logementroutes.patch('/:id/status', authMiddleware, isAdmin, SetLogementStatusByAdmin);
logementroutes.delete('/:id', authMiddleware, isProprietaire, DeleteLogement);

// Photo upload / delete
logementroutes.post('/:id/photos', authMiddleware, isProprietaire, uploadLogementPhotos, handleUploadErrors, UploadLogementPhotos);
logementroutes.delete('/:id/photos', authMiddleware, isProprietaire, DeleteLogementPhoto);



//oussama search
logementroutes.get('/search', SearchLogements);
export { logementroutes };
