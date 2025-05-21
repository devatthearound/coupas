import { app } from 'electron';
import * as path from 'path';
import * as os from 'os';

export function setupSharpModule() {
  const platform = os.platform();
  const arch = os.arch();
  
  // 프로덕션 환경에서만 실행
  if (app.isPackaged) {
    const resourcePath = process.resourcesPath;
    const vendorPath = path.join(resourcePath, 'sharp-vendor');
    
    // Windows에서는 PATH 환경변수에 추가
    if (platform === 'win32') {
      process.env.PATH = `${vendorPath};${process.env.PATH}`;
    }
    
    // macOS에서는 DYLD_LIBRARY_PATH에 추가
    if (platform === 'darwin') {
      process.env.DYLD_LIBRARY_PATH = `${vendorPath}:${process.env.DYLD_LIBRARY_PATH || ''}`;
    }
    
    console.log(`Sharp vendor path set for ${platform}-${arch}: ${vendorPath}`);
  }
}