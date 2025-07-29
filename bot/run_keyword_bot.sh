#!/bin/bash

# YouTube 키워드 수집 봇 실행 스크립트
# 프로덕션 환경에서 cron job으로 실행하기 위한 스크립트

# 스크립트 경로 설정
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BOT_DIR="$SCRIPT_DIR"
VENV_DIR="$BOT_DIR/venv"
LOG_FILE="$BOT_DIR/cron_execution.log"

# 로그 함수
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

log_message "🤖 키워드 수집 봇 실행 시작"

# 가상환경 활성화 및 봇 실행
cd "$BOT_DIR"

if [ -d "$VENV_DIR" ]; then
    log_message "✅ 가상환경 활성화: $VENV_DIR"
    source "$VENV_DIR/bin/activate"
    
    # 봇 실행
    log_message "🚀 YouTube 키워드 수집 봇 실행"
    python youtube_keyword_monitor_once.py
    
    # 실행 결과 로깅
    if [ $? -eq 0 ]; then
        log_message "✅ 봇 실행 성공"
    else
        log_message "❌ 봇 실행 실패 (Exit Code: $?)"
    fi
    
    deactivate
else
    log_message "❌ 가상환경을 찾을 수 없습니다: $VENV_DIR"
    exit 1
fi

log_message "🏁 키워드 수집 봇 실행 완료" 