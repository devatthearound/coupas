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
    console.log('공증 건너뛰기');
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appBundleId = build.appId || 'com.growsome.coupas';

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
          appleId: process.env.APPLE_ID,
          appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
          teamId: process.env.APPLE_TEAM_ID,
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
    // 빌드는 계속 진행 (CI에서 실패하지 않도록)
    console.log('공증 실패했지만 빌드는 계속 진행합니다.');
  }
};