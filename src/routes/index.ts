import { Router } from 'express';
import registrationRoutes from './registrationRoutes';
import userRoutes from './userRoutes';
import authRoutes from './authRoutes';
import pollRoutes from './pollRoutes';

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
    },
    {
        path: '/polls',
        route: pollRoutes
    }
]

defaultRoutes.forEach(route => {
    router.use(route.path, route.route)
})

export default router;

