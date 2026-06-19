import express from 'express';
import { GetHomeFeed, GetRecommendations } from "../controllers/RecommanderController";
import authMiddleware from "../middlewares/authMiddleware";
import { isEtudiant } from "../middlewares/roleMiddleware";

const recommanderRoutes = express.Router();


recommanderRoutes.get('/public-feed', GetHomeFeed);
recommanderRoutes.get('/recommendations', authMiddleware, isEtudiant, GetRecommendations);

export { recommanderRoutes };
