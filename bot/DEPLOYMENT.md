# 🤖 YouTube 키워드 수집 봇 배포 가이드

## 📋 개요

이 봇은 **하루에 한 번** 자동으로 실행되어야 하며, 사용자가 직접 실행하는 것이 아닌 **시스템 레벨**에서 자동화되어야 합니다.

## 🔄 실행 방식

### 📂 파일 구조
```
bot/
├── youtube_keyword_monitor.py          # 개발/테스트용 (무한 루프)
├── youtube_keyword_monitor_once.py     # 프로덕션용 (한 번 실행)
├── run_keyword_bot.sh                  # 실행 스크립트
├── .env                                # 환경 변수
├── requirements.txt                    # Python 패키지
└── venv/                              # 가상환경
```

---

## 🏭 프로덕션 환경 배포 방법

### 1️⃣ **Cron Job (Linux/macOS) - 🌟 추천**

#### 설정 방법:
```bash
# 1. crontab 편집
crontab -e

# 2. 매일 오전 7시에 실행하도록 설정
0 7 * * * /path/to/coupas/bot/run_keyword_bot.sh

# 3. 저장 후 확인
crontab -l
```

#### 장점:
- ✅ **안정성**: 시스템이 자동으로 관리
- ✅ **메모리 효율**: 필요할 때만 실행
- ✅ **로그 관리**: 실행 결과 자동 기록
- ✅ **복구**: 서버 재시작 시 자동으로 재설정

#### 실행 예시:
```bash
# 수동 테스트
./bot/run_keyword_bot.sh

# 로그 확인
tail -f bot/cron_execution.log
```

---

### 2️⃣ **systemd + Timer (Linux)**

#### 서비스 파일 생성:
```bash
# /etc/systemd/system/youtube-keyword-bot.service
[Unit]
Description=YouTube Keyword Collection Bot
After=network.target

[Service]
Type=oneshot
User=your-username
WorkingDirectory=/path/to/coupas/bot
ExecStart=/path/to/coupas/bot/run_keyword_bot.sh
StandardOutput=journal
StandardError=journal
```

#### 타이머 파일 생성:
```bash
# /etc/systemd/system/youtube-keyword-bot.timer
[Unit]
Description=Run YouTube Keyword Bot daily at 7 AM
Requires=youtube-keyword-bot.service

[Timer]
OnCalendar=*-*-* 07:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

#### 활성화:
```bash
sudo systemctl daemon-reload
sudo systemctl enable youtube-keyword-bot.timer
sudo systemctl start youtube-keyword-bot.timer
```

---

### 3️⃣ **Docker + Cron**

#### Dockerfile:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# cron 설치 및 설정
RUN apt-get update && apt-get install -y cron
RUN echo "0 7 * * * cd /app && python youtube_keyword_monitor_once.py" | crontab -

CMD ["cron", "-f"]
```

#### docker-compose.yml:
```yaml
version: '3.8'
services:
  youtube-keyword-bot:
    build: .
    environment:
      - YOUTUBE_API_KEY=${YOUTUBE_API_KEY}
      - YOUTUBE_CHANNEL_ID=${YOUTUBE_CHANNEL_ID}
      - DISCORD_WEBHOOK_URL=${DISCORD_WEBHOOK_URL}
      - WEBSITE_API_URL=${WEBSITE_API_URL}
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
```

---

### 4️⃣ **클라우드 서비스**

#### AWS Lambda + EventBridge:
```python
# lambda_function.py
import json
from youtube_keyword_monitor_once import YouTubeKeywordMonitor

def lambda_handler(event, context):
    try:
        monitor = YouTubeKeywordMonitor()
        monitor.run()
        return {
            'statusCode': 200,
            'body': json.dumps('Keywords collected successfully')
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
```

#### EventBridge 규칙:
```json
{
  "ScheduleExpression": "cron(0 7 * * ? *)",
  "State": "ENABLED",
  "Targets": [
    {
      "Id": "YouTubeKeywordBot",
      "Arn": "arn:aws:lambda:region:account:function:youtube-keyword-bot"
    }
  ]
}
```

---

### 5️⃣ **GitHub Actions**

#### .github/workflows/keyword-collection.yml:
```yaml
name: YouTube Keyword Collection

on:
  schedule:
    - cron: '0 7 * * *'  # 매일 오전 7시 (UTC)
  workflow_dispatch:      # 수동 실행 가능

jobs:
  collect-keywords:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v3
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: |
        cd bot
        pip install -r requirements.txt
    
    - name: Run keyword collection
      env:
        YOUTUBE_API_KEY: ${{ secrets.YOUTUBE_API_KEY }}
        YOUTUBE_CHANNEL_ID: ${{ secrets.YOUTUBE_CHANNEL_ID }}
        DISCORD_WEBHOOK_URL: ${{ secrets.DISCORD_WEBHOOK_URL }}
        WEBSITE_API_URL: ${{ secrets.WEBSITE_API_URL }}
      run: |
        cd bot
        python youtube_keyword_monitor_once.py
```

---

## 📊 모니터링 및 로그

### 로그 파일들:
```
bot/
├── youtube_monitor.log      # 봇 실행 로그
├── cron_execution.log       # Cron 실행 로그
└── error.log               # 에러 로그
```

### 로그 확인 명령어:
```bash
# 실시간 로그 모니터링
tail -f bot/*.log

# 최근 실행 결과 확인
grep "✅\|❌" bot/cron_execution.log | tail -10

# 에러만 확인
grep "ERROR" bot/youtube_monitor.log
```

---

## 🔧 환경별 추천 방식

| 환경 | 추천 방식 | 이유 |
|------|-----------|------|
| **개인 서버** | Cron Job | 간단하고 안정적 |
| **클라우드 서버** | systemd + Timer | 더 나은 관리 기능 |
| **컨테이너** | Docker + Cron | 환경 독립성 |
| **서버리스** | AWS Lambda | 비용 효율적 |
| **CI/CD** | GitHub Actions | 코드와 함께 관리 |

---

## ⚠️ 주의사항

1. **API 제한**: YouTube API 할당량 초과 방지
2. **네트워크**: 웹사이트 API 접근 가능 확인
3. **권한**: 스크립트 실행 권한 설정
4. **로그 관리**: 디스크 용량 모니터링
5. **에러 처리**: 실패 시 알림 설정

---

## 🚀 빠른 시작 (Cron Job)

```bash
# 1. 프로젝트 서버에 배포
git clone <repository>
cd coupas/bot

# 2. 가상환경 설정
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. 환경변수 설정
cp .env.example .env
# .env 파일 편집

# 4. 실행 권한 부여
chmod +x run_keyword_bot.sh

# 5. Cron 설정
crontab -e
# 0 7 * * * /full/path/to/coupas/bot/run_keyword_bot.sh

# 6. 테스트 실행
./run_keyword_bot.sh
```

이제 **매일 오전 7시마다 자동으로** 키워드가 수집되어 웹사이트에 업데이트됩니다! 🎉 