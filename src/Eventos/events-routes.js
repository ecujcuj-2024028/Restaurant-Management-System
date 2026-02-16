'use strict';

import { Router } from 'express';
import {
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    updateEventStatus,
    deleteEvent
} from '../Eventos/events-controller.js';

const router = Router();

router.get('/',             getEvents);
router.get('/:id',          getEvent);
router.post('/',            createEvent);
router.put('/:id',          updateEvent);
router.patch('/:id/status', updateEventStatus);
router.delete('/:id',       deleteEvent);

export default router;