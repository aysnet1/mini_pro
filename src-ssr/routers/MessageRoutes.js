import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { SendMessage, GetConversation, DeleteConversation } from '../controllers/MessageControllers.js';

const messageroutes = express.Router();

messageroutes.post('/', authMiddleware, SendMessage);
messageroutes.get('/conversation/:user1/:user2', authMiddleware, GetConversation);
messageroutes.delete('/conversation/:user1/:user2', authMiddleware, DeleteConversation);

export { messageroutes };
