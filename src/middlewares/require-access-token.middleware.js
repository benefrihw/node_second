import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.util.js';

export default async function (req, res, next) {
  try {
    const authorization = req.headers['authorization'];
    console.log(req.headers);
    if (!authorization) throw new Error('인증 정보가 없습니다.');
    console.log(authorization);

    const [tokenType, token] = authorization.split(' ');
    console.log;

    if (tokenType !== 'Bearer')
      throw new Error('지원하지 않는 인증 방식입니다.');

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY);
    console.log(decodedToken);
    const userId = decodedToken.userId;

    console.log(+userId);
    const user = await prisma.users.findFirst({
      where: { userId: +userId },
    });
    if (!user) {
      res.clearCookie('authorization');
      throw new Error('인증 정보와 일치하는 사용자가 없습니다.');
    }

    // req.user에 사용자 정보를 저장합니다.
    req.user = user;

    next();
  } catch (error) {
    res.clearCookie('authorization');

    // 토큰이 만료되었거나, 조작되었을 때, 에러 메시지를 다르게 출력합니다.
    switch (error.name) {
      case 'TokenExpiredError':
        return res.status(401).json({ message: '인증 정보가 만료되었습니다.' });
      case 'JsonWebTokenError':
        return res
          .status(401)
          .json({ message: '인증 정보가 유효하지 않습니다.' });
      default:
        return res
          .status(401)
          .json({ message: error.message ?? '비정상적인 요청입니다.' });
    }
  }
}
