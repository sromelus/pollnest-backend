import { RequestHandler } from 'express';

export const tryCatch = (handler: RequestHandler): RequestHandler => {
    return async (req, res, next) => {
        try {
            await handler(req, res, next);
        } catch (error) {
            if ((error as Error).name === 'ValidationError') {
                res.status(400).send({
                    success: false,
                    message: 'Validation failed',
                    errors: (error as Error).message
                });

                return;
            }

            res.status(500).send({
                success: false,
                message: 'Internal server error',
                errors: (error as Error).message
            });
        }
    };
};