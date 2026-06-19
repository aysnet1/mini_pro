import express from 'express';
import { chatBotFlow } from '../controllers/AgentFlowControllers.js';
import { expressHandler } from '@genkit-ai/express';

const airoutes = express.Router();


airoutes.post('/agent-flow', expressHandler(chatBotFlow));


export { airoutes };
