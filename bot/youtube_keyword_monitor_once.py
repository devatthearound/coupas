import os
import requests
import logging
import re
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('youtube_monitor.log'),
        logging.StreamHandler()
    ]
)

def extract_keyword_before_추천(title):
    """
    제목에서 '추천' 앞에 오는 키워드만 추출
    """
    if "추천" in title:
        match = re.search(r'(.+?)\s*추천', title)
        if match:
            return match.group(1).strip()
    return None

class YouTubeKeywordMonitor:
    def __init__(self):
        self.api_key = os.getenv('YOUTUBE_API_KEY')
        self.channel_id = os.getenv('YOUTUBE_CHANNEL_ID')
        self.discord_webhook_url = os.getenv('DISCORD_WEBHOOK_URL')
        self.website_api_url = os.getenv('WEBSITE_API_URL', 'http://localhost:3000/api/trending-keywords')
        self.keywords = os.getenv('KEYWORDS', '').split(',')
        self.min_views = int(os.getenv('MIN_VIEWS', '50'))
        self.days_to_monitor = int(os.getenv('DAYS_TO_MONITOR', '4'))

        # 설정 확인을 위한 디버깅 로그
        print(f"\n🔍 환경 설정 확인:")
        print(f"YouTube API Key: {'설정됨' if self.api_key else '설정되지 않음'}")
        print(f"Channel ID: {'설정됨' if self.channel_id else '설정되지 않음'}")
        print(f"Discord Webhook URL: {'설정됨' if self.discord_webhook_url else '설정되지 않음'}")
        print(f"Website API URL: {self.website_api_url}")
        print(f"Keywords: {self.keywords}")
        print(f"Min Views: {self.min_views}")
        print(f"Days to Monitor: {self.days_to_monitor}")
        print("-" * 50)

        if not all([self.api_key, self.channel_id]):
            raise ValueError("Missing required environment variables")

    def send_to_website(self, keywords):
        """Send keywords to website API"""
        if not keywords:
            logging.info("No keywords to send to website")
            return
            
        data = {
            "keywords": keywords
        }
        
        try:
            print(f"\n🌐 웹사이트로 키워드 전송 시도...")
            response = requests.post(self.website_api_url, json=data)
            response.raise_for_status()
            print(f"✅ 웹사이트 전송 성공!")
            logging.info("Successfully sent keywords to website")
        except requests.exceptions.RequestException as e:
            print(f"❌ 웹사이트 전송 실패: {str(e)}")
            logging.error(f"Error sending keywords to website: {e}")

    def send_discord_notification(self, keywords):
        """Send trending keywords notification to Discord"""
        if not keywords or not self.discord_webhook_url:
            logging.info("No keywords to send or Discord webhook not configured")
            return

        keyword_list = "\n".join([f"◆ {keyword}" for keyword in keywords])
        
        message = {
            "content": f"""🚨 요즘 검색 터지는 키워드 총정리!
지금 뜨는 쿠팡 상품, 이거면 반은 먹고 들어갑니다 👇

🔥 실시간 트래픽 몰리는 핵심 키워드
{keyword_list}"""
        }

        try:
            print(f"\n📤 디스코드로 메시지 전송 시도...")
            response = requests.post(self.discord_webhook_url, json=message)
            response.raise_for_status()
            print(f"✅ 메시지 전송 성공!")
            logging.info("Successfully sent trending keywords notification")
        except requests.exceptions.RequestException as e:
            print(f"❌ 메시지 전송 실패: {str(e)}")
            logging.error(f"Error sending Discord notification: {e}")

    def run(self):
        """Main monitoring function - runs once and exits"""
        logging.info("Starting YouTube keyword monitor (single run)...")
        
        try:
            # YouTube API URL 직접 선언
            url = 'https://www.googleapis.com/youtube/v3/search'
            params = {
                'key': self.api_key,
                'channelId': self.channel_id,
                'order': 'date',
                'publishedAfter': (datetime.now() - timedelta(days=self.days_to_monitor)).isoformat("T") + "Z",
                'type': 'video',
                'part': 'snippet',
                'maxResults': 5
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            videos = response.json().get('items', [])
            
            if not videos:
                logging.info("No recent videos found")
                print("📺 최근 업로드된 영상이 없습니다.")
                return

            print("\n📺 최근 업로드된 영상:")
            print("-" * 50)
            keywords = []
            for item in videos:
                title = item['snippet']['title']
                published_at = item['snippet']['publishedAt']
                video_id = item['id']['videoId']
                keyword = extract_keyword_before_추천(title)
                
                if keyword:
                    keywords.append(keyword)
                
                print(f"제목: {title}")
                if keyword:
                    print(f"추출된 키워드: {keyword}")
                print(f"업로드: {published_at}")
                print(f"링크: https://youtu.be/{video_id}")
                print("-" * 50)
            
            if keywords:
                print(f"\n🔥 수집된 키워드: {keywords}")
                # 디스코드와 웹사이트 모두에 전송
                if self.discord_webhook_url:
                    self.send_discord_notification(keywords)
                self.send_to_website(keywords)
                print(f"✅ 키워드 수집 및 전송 완료!")
            else:
                print("💡 오늘은 수집된 키워드가 없습니다.")
            
        except Exception as e:
            logging.error(f"Error in main execution: {e}")
            print(f"❌ 실행 중 오류 발생: {e}")

if __name__ == "__main__":
    try:
        print("🤖 YouTube 키워드 수집 봇 시작...")
        print(f"📅 실행 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        monitor = YouTubeKeywordMonitor()
        monitor.run()
        
        print(f"🏁 봇 실행 완료: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
    except Exception as e:
        logging.error(f"Error in main execution: {e}")
        print(f"❌ 봇 실행 실패: {e}") 