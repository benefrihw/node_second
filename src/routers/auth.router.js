import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.util.js';
import authMiddleware from '../middlewares/require-access-token.middleware.js';

const router = express.Router();

/** 회원가입 API */
router.post('/sign-up', async (req, res, next) => {
    try {
      // email, password, passwordConfirm, name을 body로 전달받는다.
      const { email, password, passwordConfirm, name } = req.body;
  
      // 회원 정보 중 하나라도 빠진 경우
      if (!email || !password || !passwordConfirm || !name) {
        return res
          .status(400)
          .json({ message: '회원 정보를 모두 작성해주세요.' });
      }
  
      // 이메일 형식이 맞지 않는 경우
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
      if (!emailRegex.test(email)) {
        return res
          .status(400)
          .json({ message: '이메일 형식이 올바르지 않습니다.' });
      }
  
      // 이메일이 중복되는 경우
      const isExistUser = await prisma.users.findFirst({
        where: { email },
      });
  
      if (isExistUser) {
        return res.status(409).json({ message: '이미 존재하는 이메일입니다.' });
      }
  
      // 비밀번호가 6자리 미만인 경우
      if (password.length < 6) {
        return res
          .status(400)
          .json({ message: '비밀번호를 6자리 이상 작성해주세요.' });
      }
  
      // 비밀번호와 비밀번호 확인이 일치하지 않는 경우
      if (password !== passwordConfirm) {
        return res
          .status(400)
          .json({ message: '비밀번호가 서로 일치하지 않습니다.' });
      }
  
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
  
      return res.status(200).json({ message: '회원가입이 완료되었습니다.', userInfo:{
        userId: userInfo.userId,
        email,
        name,
        role: userInfo.role,
        createdAt: userInfo.createdAt,
        updatedAt: userInfo.updatedAt
      } });
    } catch (err) {
      next(err);
    }
  });
  
  /** 로그인 API */
  router.post('/sign-in', async (req, res, next) => {
      // 1. email, password를 body로 전달받는다.
      const { email, password } = req.body;
  
      // 2. email이 빠진 경우
      if (!email) {
          return res.status(400).json({ message: '이메일을 입력해주세요.'})
      };
  
      // 3. password가 빠진 경우
      if (!password) {
          return res.status(400).json({ message: '비밀번호를 입력해주세요.'})
      };
  
      // 4. email 형식에 맞지 않는 경우
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
          return res.status(401).json({ message: '이메일 형식이 올바르지 않습니다.'})
      }
  
      // 5. email에 해당하는 사용자가 있는지 확인한다.
      const user = await prisma.users.findFirst({ where: { email }});
      if (!user) {
          return res.status(401).json({ message: '존재하지 않는 이메일입니다.'})
      };
  
      // 6. password가 일치하는지 확인한다.
      if (!(await bcrypt.compare(password, user.password))) {
          return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.'})
      };
  
      // 7. 로그인 성공 시 사용자에게 JWT를 발급한다.
      const token = jwt.sign({
          userId: user.userId,
      },
      process.env.ACCESS_TOKEN_SECRET_KEY, { expiresIn: '12h'}
  );
    return res.status(200).json({ message: '로그인 성공했습니다.', token });
  });

/** 내 정보 조회 API */
router.get('/users', authMiddleware, async(req, res, next) => {
    // 1. 로그인 정보를 조회한다.
    const { userId } = req.user;

    console.log(req.user);
    // 2. Users와 UserInfos 테이블은 조회한다.
    const user = await prisma.users.findFirst({
        where: { userId: userId },
        select: {
          userId: true,
          email: true,
          name: true,
          userInfos: {
            select: {
              role: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      });

    return res.status(200).json({ data: user });
});

export default router;
