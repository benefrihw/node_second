import express from 'express';
import { prisma } from '../utils/prisma.util.js';
import authMiddleware from '../middlewares/require-access-token.middleware.js';

const router = express.Router();

/** 이력서 생성 API */
router.post('/resumes', authMiddleware, async (req, res, next) => {
  try {
    // 1. 게시글 작성자가 로그인 된 사용자 인지 확인합니다.
    const { userId } = req.user;

    // 2. 제목, 자기소개를 req.body로 전달 받습니다.
    const { title, content } = req.body;

    // 3. 제목이 빠진 경우
    if (!title) {
      return res.status(400).json({ message: '제목을 입력해 주세요.' });
    }

    // 4. 자기소개가 빠진 경우
    if (!content) {
      return res.status(400).json({ message: '자기소개를 입력해 주세요.' });
    }

    // 5. 자기소개 글자 수가 150자 보다 짧은 경우
    if (content.length < 10) {
      return res
        .status(400)
        .json({ message: '자기소개는 150자 이상 작성해야 합니다.' });
    }

    // 6. Resumes 테이블에 이력서를 생성합니다.
    const resume = await prisma.resumes.create({
      data: {
        userId: userId,
        title,
        content,
        status: 'APPLY',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({
      message: '이력서가 생성되었습니다.',
      resume: {
        resumeId: resume.resumeId,
        userId: resume.userId,
        title: resume.title,
        content: resume.content,
        status: resume.status,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/** 이력서 목록 조회 API */
router.get('/resumes', authMiddleware, async (req, res, next) => {
  try {
    // 1. 사용자 정보를 req.user를 통해서 받습니다.
    const { userId } = req.user;

    // 2. Query Parameters(req.query)으로 정렬 조건을 받습니다.
    const sortOrder = req.query.sotr ? req.query.sort.toLowerCase() : 'decs';

    // 3. 생성일시 기준 과거순(ASC), 최신순(DESC)으로 전달 받습니다. 기본값은 최신순
    const orderbyCreateAt = sortOrder === 'asc' ? 'asc' : 'desc';

    // 4. 이력서 목록을 조회합니다.
    const resumes = await prisma.resumes.findMany({
      where: {
        userId: +userId,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: orderbyCreateAt,
      },
    });

    // 5. 일치하는 값이 없는 경우 - 빈 배열을 반환합니다.
    if (resumes.length === 0) {
      return res.status(200).json({ resumes: [] });
    }

    // 6. 이력서 ID, 작성자 이름, 제목, 자기소개, 지원 상태, 생성일시, 수정일시의 목록을 반환합니다.
    const isExistResumes = resumes.map((resume) => ({
      resumeId: resume.resumeId,
      name: resume.user.name,
      title: resume.title,
      content: resume.content,
      status: resume.status,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    }));

    return res
      .status(200)
      .json({
        message: '이력서 조회가 완료되었습니다',
        resume: isExistResumes,
      });
  } catch (error) {
    next(error);
  }
});

/** 이력서 상세 조회 API */
router.get('/:resumeId', authMiddleware, async (req, res, next) => {
  try {
    // 1. 사용자 정보를 req.user를 통해서 받습니다.
    const { userId } = req.user;

    // 2. 이력서 ID를 req.params로 전달 받습니다.
    const { resumeId } = req.params;

    // 3. 이력서 정보를 조회합니다.
    const resume = await prisma.resumes.findFirst({
      where: {
        resumeId: +resumeId,
        userId: +userId,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // 4. 이력서 정보가 없는 경우
    if (!resume) {
      return res.status(400).json({ message: '이력서가 존재하지 않습니다.' });
    }

    // 4. 이력서 ID, 이름, 제목, 자기소개, 지원상태, 생성일시, 수정일시를 반환합니다.
    const detailResume = {
      resumeId: resume.resumeId,
      name: resume.user.name,
      title: resume.title,
      content: resume.content,
      status: resume.status,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    };

    return res.status(200).json({
      message: '이력서 상제 조회가 완료되었습니다.',
      resume: detailResume,
    });
  } catch (error) {
    next(error);
  }
});

/** 이력서 수정 API */
router.patch('/:resumeId', authMiddleware, async (req, res, next) => {
  try {
    // 1. 사용자 정보를 req.user를 통해서 받습니다.
    const { userId } = req.user;

    // 2. 이력서 ID를 req.params로 전달 받습니다.
    const { resumeId } = req.params;

    // 3. 제목, 자기소개를 req.body로 전달 받습니다.
    const { title, content } = req.body;

    // 4. 제목, 자기소개가 둘 다 없는 경우
    if (!title && !content) {
      return res.status(400).json({ message: '수정 할 정보를 입력해주세요.' });
    }

    // 5. 이력서 정보를 조회합니다.
    const resume = await prisma.resumes.findFirst({
      where: {
        resumeId: +resumeId,
        userId: +userId,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });
    console.log(resume);

    // 6. 이력서 정보가 없는 경우
    if (!resume) {
      return res.status(400).json({ message: '이력서가 존재하지 않습니다.' });
    }

    // 7. 변경된 내용으로 이력서를 수정합니다.
    const updateResume = await prisma.resumes.update({
      where: {
        resumeId: +resumeId,
      },
      data: {
        title,
        content,
        updatedAt: new Date(),
      },
    });
    console.log(updateResume);
    // 8. updateResume에서 수정된 값을 반환합니다.
    return res
      .status(200)
      .json({ message: '이력서가 수정되었습니다.', data: updateResume });
  } catch (error) {
    next(error);
  }
});

/** 이력서 삭제 API */
router.delete('/:resumeId', authMiddleware, async (req, res, next) => {
  try {
    // 1. 사용자 정보를 req.user를 통해서 받습니다.
    const { userId } = req.user;

    // 2. 이력서 ID를 req.params로 전달 받습니다.
    const { resumeId } = req.params;

    // 3. 이력서 정보를 조회합니다.
    const resume = await prisma.resumes.findFirst({
      where: {
        resumeId: +resumeId,
        userId: +userId,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // 4. 이력서 정보가 없는 경우
    if (!resume) {
      return res.status(400).json({ message: '이력서가 존재하지 않습니다.' });
    }

    // 6. 이력서를 삭제합니다.
    await prisma.resumes.delete({
      where: {
        resumeId: +resumeId,
      },
    });

    // 5. 삭제 된 이력서 ID를 반환합니다.
    return res
      .status(200)
      .json({ message: '이력서 삭제가 완료됐습니다.', data: resumeId });
  } catch (error) {
    next(error);
  }
});

export default router;
