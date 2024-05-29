import express from 'express';
import dotenv from 'dotenv';
import AuthRouter from './routers/auth.router.js';
import ResumesRouter from './routers/resumes.router.js'
import { errorHandler } from './middlewares/error-handler.middleware.js';


dotenv.config();

const app = express();
const PORT = 3002;

const ACCESS_TOKEN_SECRET_KEY = process.env.ACCESS_TOKEN_SECRET_KEY;
const REFRESH_TOKEN_SECRET_KEY = process.env.REFRESH_TOKEN_SECRET_KEY;

app.use(express.json());
app.use('/auth', [AuthRouter]);
app.use('/resumes', [ResumesRouter])
app.use(errorHandler);

app.listen(PORT, (req, res) => {
    console.log(PORT, '포트로 서버가 열렸습니다!')
})