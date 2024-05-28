import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.util.js';
import authMiddleware from '../middlewares/require-access-token.middleware.js';

const router = express.Router();

/** 회원가입 API */
router.post('/sign-up', async (req, res, next) => {
  try {
    // 1. email, password, passwordConfirm, name을 body로 전달받는다.
    const { email, password, passwordConfirm, name } = req.body;

    // 2. 회원 정보 중 하나라도 빠진 경우
    if (!email || !password || !passwordConfirm || !name) {
      return res
        .status(400)
        .json({ message: '회원 정보를 모두 작성해주세요.' });
    }

    // 3. 이메일 형식이 맞지 않는 경우
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ message: '이메일 형식이 올바르지 않습니다.' });
    }

    // 4. 이메일이 중복되는 경우
    const isExistUser = await prisma.users.findFirst({
      where: { email },
    });

    if (isExistUser) {
      return res.status(409).json({ message: '이미 가입 된 사용자입니다.' });
    }

    // 5. 비밀번호가 6자리 미만인 경우
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: '비밀번호를 6자리 이상이어야 합니다.' });
    }

    // 6. 비밀번호와 비밀번호 확인이 일치하지 않는 경우
    if (password !== passwordConfirm) {
      return res
        .status(400)
        .json({ message: '입력 한 두 비밀번호가 일치하지 않습니다.' });
    }

    // 7. email, password, passwordConfirm, name 입력 후 사용자 생성
    const hashedPassword = await bcrypt.hash(password, 10);

    const users = await prisma.users.create({
      data: { email, password: hashedPassword, name },
    });

    // 8. UserInfos 테이블에 email, name, role, createdAt, updatedAt을 이용해 사용자 정보 생성
    const userInfo = await prisma.userInfos.create({
      data: {
        userId: users.userId,
        role: 'APPLICANT',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    // console.log(userInfo);

    // 9. 사용자 ID, 이메일, 이름, 역할, 생성일시, 수정일시를 반환
    return res.status(200).json({
      message: '회원가입이 완료되었습니다.',
      userInfo: {
        userId: userInfo.userId,
        email,
        name,
        role: userInfo.role,
        createdAt: userInfo.createdAt,
        updatedAt: userInfo.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

/** 로그인 API */
router.post('/sign-in', async (req, res, next) => {
  try {
    // 1. email, password를 body로 전달받는다.
    const { email, password } = req.body;

    // 2. email이 빠진 경우
    if (!email) {
      return res.status(400).json({ message: '이메일을 입력해주세요.' });
    }

    // 3. password가 빠진 경우
    if (!password) {
      return res.status(400).json({ message: '비밀번호를 입력해주세요.' });
    }

    // 4. email 형식에 맞지 않는 경우
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ message: '이메일 형식이 올바르지 않습니다.' });
    }

    // 5. email로 조회되지 않거나 비밀번호가 일치하지 않는 경우
    const user = await prisma.users.findFirst({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: '인증 정보가 유효하지 않습니다.' });
    }

    // 6. 로그인 성공 시 사용자에게 AccessToken을 발급한다.
    const token = jwt.sign(
      {
        userId: user.userId,
      },
      process.env.ACCESS_TOKEN_SECRET_KEY,
      { expiresIn: '12h' }
    );

    // 7. AccessToken을 반환한다.
    return res.status(200).json({ message: '로그인 성공했습니다.', token });
  } catch (error) {
    next(error);
  }
});

/** 내 정보 조회 API */
router.get('/users', authMiddleware, async (req, res, next) => {
  try {
    // 1. 로그인 정보를 조회한다.
    const { userId } = req.user;

    // console.log(req.user);
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
            updatedAt: true,
          },
        },
      },
    });

    return res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
});

export default router;
