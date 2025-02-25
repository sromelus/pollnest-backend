import { Router } from 'express';
import userRoutes from './userRoutes';
import authRoutes from './authRoutes';
import pollRoutes from './pollRoutes';
import voteRoutes from './voteRoutes';
import chatRoutes from './chatRoutes';
import pollAccessRoutes from './pollAccessRoutes';

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
    },
    // {
    //     path: '/poll_access',
    //     route: pollAccessRoutes
    // },
    // {
    //     path: '/polls/:pollId/votes',
    //     route: voteRoutes
    // },
    // {
    //     path: '/polls/:pollId/chat',
    //     route: chatRoutes
    // }
]

defaultRoutes.forEach(route => {
    router.use(route.path, route.route)
})

// import expressListEndpoints from 'express-list-endpoints';

// console.log(expressListEndpoints(router));

export default router;

