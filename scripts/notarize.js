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
          appleId: 'sales@the-around.com',
          appleIdPassword: 'fweh-xccb-fsdn-vrak',
          teamId: 'AJNAL73TT5',
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
    process.exit(1);
  }

  return;
};