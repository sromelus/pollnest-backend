import { Router } from 'express';
import registrationRoutes from './registrationRoutes';
import userRoutes from './userRoutes';
import authRoutes from './authRoutes';

const router = Router();

const defaultRoutes = [
    {
        path: '/auth',
        route: authRoutes
    },
    {
        path: '/registration',
        route: registrationRoutes
    },
    {
        path: '/users',
        route: userRoutes
    }
]

defaultRoutes.forEach(route => {
    router.use(route.path, route.route)
})

export default router;

