import express from 'express';
import { protect, requireCompany } from '../../../middleware/authmiddleware.js';
import {
  createRestaurantMenuItem,
  deleteRestaurantMenuItem,
  getRestaurantMenuItemById,
  getRestaurantMenuItems,
  getRestaurantSummary,
  updateRestaurantMenuItem,
} from '../controllers/restaurantController.js';

const router = express.Router();

router.use(protect);
router.use(requireCompany);

router.get('/summary', getRestaurantSummary);

router.route('/')
  .get(getRestaurantMenuItems)
  .post(createRestaurantMenuItem);

router.route('/:id')
  .get(getRestaurantMenuItemById)
  .put(updateRestaurantMenuItem)
  .delete(deleteRestaurantMenuItem);

export default router;
