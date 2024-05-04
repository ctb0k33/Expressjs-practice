import mongoose, { Query } from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please tell us your name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    photo: {
      type: String,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minLength: 8,
      // this will not show the field when api call to take data in DB ( but still show in create api because its actually not take the data in DB )
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        validator: function (this: any, val: any) {
          // ONLY WORK WITH SAVE() AND CREATE(). NOT UPDATE
          return val === this.password;
        },
        message: 'Passwords are not the same',
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    methods: {
      async checkPassword(password: string, dbPassword: string) {
        return await bcrypt.compare(password, dbPassword);
      },
      changedPasswordAfter(JWTTimestamp: number) {
        if (this.passwordChangedAt) {
          const changedTimeStamp = this.passwordChangedAt.getTime() / 1000;

          return JWTTimestamp < changedTimeStamp;
        }
        return false;
      },
      createPasswordResetToken() {
        const resetToken = crypto.randomBytes(32).toString('hex');
        console.log(resetToken);
        this.passwordResetToken = crypto
          .createHash('sha256')
          .update(resetToken)
          .digest('hex');
        this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
        return resetToken;
      },
    },
  },
);

// function to check if the password is changed
userSchema.pre('save', async function (next) {
  // we need this.isNew because when user create a new account, its acctually count as password change
  if (!this.isModified('password') || this.isNew) return next();

  // -1000 to make sure that JWT is create after the passwordChangeAt update => user can login
  this.passwordChangedAt = new Date(Date.now() - 1000);

  next();
});

userSchema.pre<Query<any, any, any, any>>(/^find/, function (next: any) {
  this.find({ active: { $ne: false } });
  next();
});

// function to hash the password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = '';

  next();
});

export const User = mongoose.model('User', userSchema);
