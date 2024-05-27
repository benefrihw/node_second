import express from 'express';
import UsersRouter from './routers/users.router.js';
import ResumesRouter from './routers/resumes.router.js'
import { errorHandler } from './middlewares/error-handler.middleware.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

const ACCESS_TOKEN_SECRET_KEY = process.env.ACCESS_TOKEN_SECRET_KEY;
const REFRESH_TOKEN_SECRET_KEY = process.env.REFRESH_TOKEN_SECRET_KEY;

app.use(express.json());
app.use('/auth', [UsersRouter], [ResumesRouter]);
app.use(errorHandler);

app.listen(PORT, (req, res) => {
    console.log(PORT, '포트로 서버가 열렸습니다!')
})