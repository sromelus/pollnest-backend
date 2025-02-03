import { Router } from 'express';
import registrationRoutes from './registrationRoutes';
import userRoutes from './userRoutes';
const router = Router();

const defaultRoutes = [
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

