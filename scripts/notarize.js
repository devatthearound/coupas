const { notarize } = require('@electron/notarize');
const { build } = require('../package.json');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  
  // macOS에서만 공증 진행
  if (electronPlatformName !== 'darwin') {
    return;
  }

  // notarization 비활성화 옵션 추가
  if (process.env.SKIP_NOTARIZATION === 'true') {
    console.log('공증 건너뛰기: SKIP_NOTARIZATION=true로 설정됨');
    return;
  }

  // 환경 변수에서 인증 정보 가져오기
  const { 
    APPLE_ID, 
    APPLE_APP_SPECIFIC_PASSWORD, 
    APPLE_TEAM_ID 
  } = process.env;

  // 필수 환경 변수 검사
  if (!APPLE_ID || !APPLE_APP_SPECIFIC_PASSWORD || !APPLE_TEAM_ID) {
    console.warn('공증에 필요한 환경 변수가 설정되지 않았습니다:');
    if (!APPLE_ID) console.warn('- APPLE_ID 환경 변수가 없습니다');
    if (!APPLE_APP_SPECIFIC_PASSWORD) console.warn('- APPLE_APP_SPECIFIC_PASSWORD 환경 변수가 없습니다');
    if (!APPLE_TEAM_ID) console.warn('- APPLE_TEAM_ID 환경 변수가 없습니다');
    
    // 개발 환경에서는 경고만 표시하고 계속 진행
    if (process.env.NODE_ENV !== 'production') {
      console.log('개발 모드이므로 공증 없이 계속 진행합니다');
      return;
    }
    
    // 프로덕션 환경에서는 중단
    console.error('프로덕션 빌드에서는 공증이 필요합니다. 환경 변수를 설정하세요.');
    process.exit(1);
  }

  const appName = context.packager.appInfo.productFilename;
  const appBundleId = build.appId || 'com.electron.coupas';

  console.log(`공증 시작: ${appName}`);

  try {
    // 재시도 로직 추가
    let retries = 3;
    while (retries > 0) {
      try {
        await notarize({
          appBundleId,
          tool: 'notarytool',
          appPath: `${appOutDir}/${appName}.app`,
          appleId: APPLE_ID,
          appleIdPassword: APPLE_APP_SPECIFIC_PASSWORD,
          teamId: APPLE_TEAM_ID,
        });
        console.log('공증 완료');
        return;
      } catch (retryError) {
        retries--;
        if (retries === 0) throw retryError;
        console.log(`공증 재시도 남은 횟수: ${retries}`);
        // 재시도 전 3초 대기
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  } catch (error) {
    console.error('공증 실패:', error);
    
    // 개발 환경에서는 실패해도 빌드 프로세스를 중단하지 않음
    if (process.env.NODE_ENV !== 'production') {
      console.log('개발 모드이므로 공증 실패를 무시합니다');
      return;
    }
    
    process.exit(1);
  }
};