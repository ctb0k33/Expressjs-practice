import { User } from '../models/userModel';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import {
  createOne,
  deleteOne,
  getAllDoc,
  getOne,
  updateOne,
} from './handlerFactory';

const filterObject = (object: any, ...Fields: string[]) => {
  const newObj: any = {};
  Object.keys(object).forEach((el: string) => {
    if (Fields.includes(el)) newObj[el] = object[el];
  });
  return newObj;
};
export const getAllUsers = getAllDoc(User);

export const getMe = (req: any, res: any, next: any) => {
  req.params.id = req.user.id;
  next();
};
export const getUser = getOne(User);

export const createUser = createOne(User);
export const patchUser = (req: any, res: any) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};
export const updateUser = updateOne(User);

export const updateMe = catchAsync(async (req: any, res: any, next: any) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'this route is not for password updates. Please use /updateMyPassword',
        400,
      ),
    );
  }

  // 2) modified the req data, so user can't change the strict fields (for example: roles)
  const filterBody = filterObject(req.body, 'name', 'email');

  // 2) update the document
  // we use findByIdAndUpdate to bypass the password validator
  const newUser = await User.findByIdAndUpdate(req.user.id, filterBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    user: newUser,
  });
});

export const deleteUser = deleteOne(User);

export const deleteMe = catchAsync(async (req: any, res: any, next: any) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
