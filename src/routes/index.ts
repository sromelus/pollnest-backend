import { Router } from 'express';
import userRoutes from './userRoutes';
import authRoutes from './authRoutes';
import pollRoutes from './pollRoutes';
import expressListEndpoints from 'express-list-endpoints';

const router = Router();

const defaultRoutes = [
    {
        path: '/auth',
        route: authRoutes
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

// console.log(expressListEndpoints(router));

export default router;

