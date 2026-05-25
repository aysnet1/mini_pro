import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { SendMessage, GetConversation } from '../controllers/MessageControllers.js';

const messageroutes = express.Router();

messageroutes.post('/', authMiddleware, SendMessage);
messageroutes.get('/conversation/:user1/:user2', authMiddleware, GetConversation);

export { messageroutes };
