import dotenv from 'dotenv';
import mongoose from 'mongoose';
process.on('uncaughtException', (err: any) => {
  console.log(err.name, err.message);
  // ignore unclean state node app
  process.exit(1);
});

dotenv.config({ path: '.env' });
import { app } from './app';

const DB = process.env.DATABASE as string;

mongoose.connect(DB).then(() => {
  console.log('DB connection successful');
});

const port = process.env.PORT;
console.log(process.env.NODE_ENV);
const server = app.listen(port, () => {
  console.log('App listening on port ' + port);
});
process.on('unhandledRejection', (err: any) => {
  console.log(err.name, err.message);
  // handle pending request
  server.close(() => {
    process.exit(1);
  });
});
