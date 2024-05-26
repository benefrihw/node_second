import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.util.js';
// import authMiddleware from '../middlewares/error-handler.middleware.js';

const router = express.Router();

/** 회원가입 API */
router.post('/sign-up', async (req, res, next) => {
    try{
        // email, password, passwordConfirm, name을 body로 전달받는다.
        const { email, password, passwordConfirm, name } = req.body;

        // 회원 정보 중 하나라도 빠진 경우
        if (!email || !password || !passwordConfirm || !name) {
            return res.status(400).json({ message: '회원 정보를 모두 작성해주세요.'});
        };

        // 이메일 형식이 맞지 않는 경우
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: '이메일 형식이 올바르지 않습니다.'})
        }
        
        // 이메일이 중복되는 경우
        const isExistUser = await prisma.users.findFirst({
            where: { email }
        });

        if (isExistUser) {
            return res.status(409).json({ message: '이미 존재하는 이메일입니다.'})
        };

        // 비밀번호가 6자리 미만인 경우
        if (password.length < 6) {
            return res.status(400).json({ message: '비밀번호를 6자리 이상 작성해주세요.'})
        };

        // 비밀번호와 비밀번호 확인이 일치하지 않는 경우
        if (password !== passwordConfirm) {
            return res.status(400).json({ message: "비밀번호가 서로 일치하지 않습니다."});
        };

        // email, password, passwordConfirm, name 입력 후 사용자 생성
        const hashedPassword = await bcrypt.hash(password, 10);

        const users = await prisma.users.create({
            data: { email, password: hashedPassword, name },
        });

        // UserInfos 테이블에 email, name, role, createdAt, updatedAt을 이용해 사용자 정보 생성
        const userInfo = await prisma.userInfos.create({
            data: {
                userId: users.userId,
                role: 'APPLICANT',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });

        return res.status(200).json({ message: '회원가입이 완료되었습니다.'});
    } catch (err) {
        next(err);
    }
})

export default router;