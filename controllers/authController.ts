import { User } from '../models/userModel';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/email';
import crypto from 'crypto';

const signToken = (id: any) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user: any, statusCode: any, res: any) => {
  const token = signToken(user._id);

  let cookieOptions: any = {};
  if (process.env.JWT_COOKIE_EXPIRES_IN) {
    cookieOptions = {
      expires: new Date(
        Date.now() +
          parseInt(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000,
      ),
      httpOnly: true,
    };
  }
  if (process.env.NODE_ENV == 'production') cookieOptions.secure = true;

  user.password = undefined;
  user.passwordConfirm = undefined;
  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
export const signUp = catchAsync(async (req: any, res: any) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });
  createSendToken(newUser, 201, res);
});

export const logIn = catchAsync(async (req: any, res: any, next: any) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  // remember the plus in the select
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.checkPassword(req.body.password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, res);
});

export const protect = catchAsync(async (req: any, res: any, next: any) => {
  // 1) check if token appear in the header
  let token = '';
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else {
    return next(
      new AppError(
        'you are not logged in, please login to see the content',
        401,
      ),
    );
  }

  // 2) check if token is valid
  let decode = {};
  jwt.verify(token, process.env.JWT_SECRET!, function (err: any, decoded: any) {
    if (err) {
      return next(err);
    }
    decode = decoded;
  });

  // 3) check if user still exist
  const currentUser = await User.findById((decode as any).id);
  if (!currentUser) {
    return next(
      new AppError(
        'the user belonging to this token does no longer exist',
        401,
      ),
    );
  }

  // 4) check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter((decode as any).iat)) {
    return next(
      new AppError('user recently changed password, please login again', 401),
    );
  }

  req.user = currentUser;
  next();
});

export const restrictTo = (...roles: any) => {
  return (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('you do not have permission to perform this action', 403),
      );
    }
    next();
  };
};

export const forgotPassword = catchAsync(
  async (req: any, res: any, next: any) => {
    // 1) get user based on POSTed email
    const email = req.body.email;
    const user = await User.findOne({ email: email });
    if (!user) {
      next(new AppError('there is no user with that email', 404));
    }

    // 2) generate the random reset token
    const resetToken = user?.createPasswordResetToken();
    // basically turn off the validation, for example, when user data is export from database,
    // the field passwordConfirm is missing => we can't save the new user if we run the validation
    await user?.save({ validateBeforeSave: false });

    // 3) send it to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you did not forget your password, please ignore this email.`;
    try {
      await sendEmail({
        email: email,
        subject: 'YOUR PASSWORD RESET TOKEN (VALID FOR 10 MINUTES)',
        message,
      });
      res
        .status(200)
        .json({ status: 'success', message: 'Token sent to email' });
    } catch {
      if (user) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
      }
    }
  },
);

export const changePassword = catchAsync(
  async (req: any, res: any, next: any) => {
    // 1) get user from collection
    const token = req.params.token;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
      return next('Token is invalid or has expired', 400);
    }

    // 2) set the new password
    const newPassword = req.body.password;
    const passwordConfirm = req.body.passwordConfirm;
    user.password = newPassword;
    user.passwordConfirm = passwordConfirm;
    user.passwordChangedAt = new Date();
    (user.passwordResetToken = undefined),
      (user.passwordResetExpires = undefined),
      await user.save();

    // 2b) update the changePasswordAt (doing it in the model with middleware function)
    // 3) sign new jwt token and login
    createSendToken(user, 200, res);
  },
);

export const updatePassword = catchAsync(
  async (req: any, res: any, next: any) => {
    // 1) check the current user (user information come from protect middleware)
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return new AppError('user not found', 404);
    }
    // 2) check if POSTed current password is correct, then update the password

    const currentPassword = req.body.currentPassword;
    const newPassword = req.body.newPassword;
    const passwordConfirm = req.body.passwordConfirm;
    if (!(await user.checkPassword(currentPassword, user.password))) {
      return new AppError('current password is not correct', 401);
    }
    user.password = newPassword;
    user.passwordConfirm = passwordConfirm;

    await user.save();
    // WE DONT USE findByIdAndUpdate BECAUSE IT DOESN'T WORK WITH MONGOOSE validation in some case

    // 3) update the changePasswordAt (doing it in the model with middleware function)
    // 4) log the user in, send JWT
    createSendToken(user, 200, res);
  },
);
