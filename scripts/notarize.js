const { notarize } = require('@electron/notarize');
const { build } = require('../package.json');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  
  // macOS에서만 공증 진행
  if (electronPlatformName !== 'darwin') {
    return;
  }

  // notarization 비활성화 옵션 추가
  if (process.env.SKIP_NOTARIZATION === 'true' || !process.env.APPLE_ID) {
    console.log('공증 건너뛰기 (환경변수 없음 또는 비활성화됨)');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appBundleId = build.appBundleId || build.appId || 'com.growsome.coupas';

  console.log(`공증 시작: ${appName}`);

  try {
    // 재시도 로직 추가
    let retries = 3;
    while (retries > 0) {
      try {
        console.log('공증 시작...');
        await notarize({
          appBundleId,
          tool: 'notarytool',
          appPath: `${appOutDir}/${appName}.app`,
          appleId: process.env.APPLE_ID,
          appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
          teamId: process.env.APPLE_TEAM_ID,
        });
        console.log('공증 완료');
        return;
      } catch (retryError) {
        retries--;
        console.error(`공증 시도 실패 (${3 - retries}/3):`, retryError.message);
        if (retries === 0) {
          console.log('공증 실패했지만 빌드는 계속 진행합니다.');
          return; // 빌드 실패 방지
        }
        console.log(`공증 재시도 남은 횟수: ${retries}`);
        // 재시도 전 5초 대기
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  } catch (error) {
    console.error('공증 중 예상치 못한 오류:', error);
    console.log('공증 실패했지만 빌드는 계속 진행합니다.');
  }
};