import express from 'express';
const router = express.Router();
import {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
} from '../controllers/userController';
import {
  changePassword,
  forgotPassword,
  logIn,
  protect,
  restrictTo,
  signUp,
  updatePassword,
} from '../controllers/authController';

router.post('/signup', signUp);
router.post('/login', logIn);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', changePassword);

router.use(protect);
router.get('/me', getMe, getUser);
router.delete('/deleteMe', deleteMe);
router.patch('/updateMe', updateMe);
router.patch('/updateMyPassword', updatePassword);

router.use(restrictTo('admin'));
router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

export default router;
