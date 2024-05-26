import express from 'express';
import UsersRouter from './routers/users.router.js';
import { errorHandler } from './middlewares/error-handler.middleware.js';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/auth', [UsersRouter]);
app.use(errorHandler);

app.listen(PORT, (req, res) => {
    console.log(PORT, '포트로 서버가 열렸습니다!')
})