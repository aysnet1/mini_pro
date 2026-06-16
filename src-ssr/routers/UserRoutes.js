import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { isAdmin } from '../middlewares/roleMiddleware.js';
import {
  AddUser,
  GetAllUser,
  GetAdminStats,
  GetUser,
  UpdateUser,
  DeleteUser,
  ToggleUserStatus,
  SigninUser,
  RegisterUser,
  LogoutUser,
} from '../controllers/UserControllers.js';

const userroutes = express.Router();

// users routes authentifiées
userroutes.post('/', authMiddleware, isAdmin, AddUser)
userroutes.post('/register', RegisterUser)
userroutes.get('/admin/stats', authMiddleware, isAdmin, GetAdminStats)
userroutes.get('/', authMiddleware, isAdmin, GetAllUser)
userroutes.get('/:id', authMiddleware, GetUser)
userroutes.put('/:id', authMiddleware, UpdateUser)
userroutes.delete('/:id', authMiddleware, isAdmin, DeleteUser)
userroutes.patch('/:id/toggle-status', authMiddleware, isAdmin, ToggleUserStatus)
userroutes.post('/signin', SigninUser)
userroutes.post('/logout', LogoutUser)


export { userroutes };
