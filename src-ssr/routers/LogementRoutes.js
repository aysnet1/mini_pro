import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { isAdmin, isProprietaire } from '../middlewares/roleMiddleware.js';
import { uploadLogementPhotos, handleUploadErrors } from '../middlewares/uploadMiddleware.js';
import {
  AddLogement,
  GetAllLogements,
  GetHomeFeed,
  GetMyLogements,
  GetLogementById,
  UpdateLogement,
  DeleteLogement,
  SetLogementStatusByAdmin,
  UploadLogementPhotos,
  DeleteLogementPhoto
} from '../controllers/LogementControllers.js';

const logementroutes = express.Router();

logementroutes.post('/', authMiddleware, isProprietaire, AddLogement);
logementroutes.get('/home-feed', authMiddleware, GetHomeFeed);
logementroutes.get('/me', authMiddleware, isProprietaire, GetMyLogements);
logementroutes.get('/', authMiddleware, GetAllLogements);
logementroutes.get('/:id', GetLogementById);
logementroutes.put('/:id', authMiddleware, isProprietaire, UpdateLogement);
logementroutes.patch('/:id/status', authMiddleware, isAdmin, SetLogementStatusByAdmin);
logementroutes.delete('/:id', authMiddleware, isProprietaire, DeleteLogement);

// Photo upload / delete
logementroutes.post('/:id/photos', authMiddleware, isProprietaire, uploadLogementPhotos, handleUploadErrors, UploadLogementPhotos);
logementroutes.delete('/:id/photos', authMiddleware, isProprietaire, DeleteLogementPhoto);

export { logementroutes };
