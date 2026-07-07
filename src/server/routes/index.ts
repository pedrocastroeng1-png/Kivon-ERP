import express from 'express';
import usersRouter from './users.js';
import notificationsRouter from './notifications.js';
import employeesRouter from './employees.js';
import projectsRouter from './projects.js';
import reportsRouter from './reports.js';
import presenceRouter from './presence.js';

export const apiRouter = express.Router();

apiRouter.use('/users', usersRouter);
apiRouter.use('/notifications', notificationsRouter);
apiRouter.use('/employees', employeesRouter);
apiRouter.use('/projects', projectsRouter);
apiRouter.use('/reports', reportsRouter);
apiRouter.use('/presence', presenceRouter);
