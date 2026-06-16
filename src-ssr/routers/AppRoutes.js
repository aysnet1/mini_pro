import express from 'express';
import { isAdmin, isProprietaire } from '../middlewares/roleMiddleware.js';
import {
  GetAllEtablissements,
  GetEtablissementById,
  AddEtablissement,
  UpdateEtablissement,
  DeleteEtablissement,
  ImportEtablissements,
  ExportEtablissements,
  ImportLogements
} from '../controllers/AppControllers.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const appRoutes = express.Router();

// Routes publiques - Accessible à tous (pour inscription et profil étudiant)
appRoutes.get('/etablissements', GetAllEtablissements);

// Routes protégées - Admin uniquement
// CRUD Routes for Etablissements
appRoutes.get('/etablissements/:id', GetEtablissementById);
appRoutes.post('/etablissements', authMiddleware, isAdmin, AddEtablissement);
appRoutes.put('/etablissements/:id', authMiddleware, isAdmin, UpdateEtablissement);
appRoutes.delete('/etablissements/:id', authMiddleware, isAdmin, DeleteEtablissement);

// Import/Export Routes for Etablissements
appRoutes.post('/etablissements/import', authMiddleware, isAdmin, ImportEtablissements);
appRoutes.get('/etablissements/export', authMiddleware, isAdmin, ExportEtablissements);

// Import Route for Logements (Admin or Proprietaire)
appRoutes.post('/logements/import', authMiddleware, isProprietaire, ImportLogements);

export { appRoutes };
