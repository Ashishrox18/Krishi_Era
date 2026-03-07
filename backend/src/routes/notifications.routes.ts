import { Router } from 'express';
import { NotificationsController } from '../controllers/notifications.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new NotificationsController();

// Get notifications for current user
router.get('/', authenticate, controller.getNotifications);

// Mark notification as read
router.put('/:notificationId/read', authenticate, controller.markNotificationAsRead);

// Mark all notifications as read
router.put('/mark-all-read', authenticate, controller.markAllNotificationsAsRead);

export default router;