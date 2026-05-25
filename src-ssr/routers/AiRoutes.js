import express from 'express';
import { chatBot } from '../controllers/AiControllers.js';
import { chatBotFlow } from '../controllers/AgentFlowControllers.js';
import { expressHandler } from '@genkit-ai/express';

const airoutes = express.Router();

airoutes.post('/chat', chatBot);
airoutes.post('/agent-flow', expressHandler(chatBotFlow));


export { airoutes };
