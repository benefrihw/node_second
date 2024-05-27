import express from 'express';
import { prisma } from '../utils/prisma.util.js';
import authMiddleware from '../middlewares/require-access-token.middleware.js';

const router = express.Router();

/** 이력서 생성 API */
router.post('/resumes', authMiddleware, async (req, res, next) => {
    // 1. 게시글 작성자가 로그인 된 사용자 인지 확인합니다.
    const { userId } = req.user;

    // 2. 제목, 자기소개를 req.body로 전달 받습니다.
    const { title, content } = req.body;
    
    // 3. 제목이 빠진 경우
    if (!title) {
        return res.status(400).json({ message: '제목을 입력해 주세요.'});
    };

    // 4. 자기소개가 빠진 경우
    if(!content) {
        return res.status(400).json({ message: '자기소개를 입력해 주세요.'});
    };

    // 5. 자기소개 글자 수가 150자 보다 짧은 경우
    if(content.length < 10) {
        return res.status(400).json({ message: '자기소개는 150자 이상 작성해야 합니다.'});
    };

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

    return res.status(200).json({ message: '이력서가 생성되었습니다.',
        resume: {
            id: resume.id,
            userId: resume.userId,
            title: resume.title,
            content: resume.content,
            status: resume.status,
            createdAt: resume.createdAt,
            updatedAt: resume.updatedAt,
        },
    })

});

/** 이력서 목록 조회 API */


/** 이력서 상세 조회 API */


/** 이력서 수정 API */


/** 이력서 삭제 API */



export default router;
