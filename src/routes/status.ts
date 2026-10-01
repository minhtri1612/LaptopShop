import { Express } from 'express';

const statusRoutes = (app: Express) => {
    app.get('/status/403', (_req, res) => {
        res.status(403).render('status/403');
    });

    app.get('/status/404', (_req, res) => {
        res.status(404).render('status/404');
    });
};

export default statusRoutes;
