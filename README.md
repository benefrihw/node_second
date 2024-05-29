나만의 채용 서비스 백엔드 서버 만들기

< 주요 기능 >
- 회원가입
  id, password, passwordConfirm, name을 입력하여 회원가입한다.

- 로그인
  id, password를 입력하여 로그인하고 Acesstoken을 발급받는다.

- 내 정보 조회
  발급받은 Acesstoken을 통해 내 정보를 조회할 수 있다.

- 이력서 생성
  발급받은 Acesstoken을 통해 이력서를 작성할 수 있다.
  title, content를 작성한다.

- 이력서 목록 조회
  발급받은 Acesstoken을 통해 이력서 목록을 조회한다.
  목록이 없는 경우 빈 배열을 반환한다.

- 이력서 상세 조회
  발급받은 Acesstoken을 통해 작성한 이력서를 상세 조회한다.

- 이력서 수정
  발급받은 Acesstoken을 통해 작성한 이력서를 수정한다.
  title 또는 content 둘 중 하나만 수정도 가능하다.

- 이력서 삭제
  발급받은 Acesstoken을 통해 작성한 이력서를 삭제한다.
