import os
import requests
import logging
import re
import time
import schedule
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
        self.keywords = os.getenv('KEYWORDS', '').split(',')
        self.min_views = int(os.getenv('MIN_VIEWS', '50'))
        self.days_to_monitor = int(os.getenv('DAYS_TO_MONITOR', '4'))

        # 설정 확인을 위한 디버깅 로그
        print("\n🔍 환경 설정 확인:")
        print(f"YouTube API Key: {'설정됨' if self.api_key else '설정되지 않음'}")
        print(f"Channel ID: {'설정됨' if self.channel_id else '설정되지 않음'}")
        print(f"Discord Webhook URL: {'설정됨' if self.discord_webhook_url else '설정되지 않음'}")
        print(f"Keywords: {self.keywords}")
        print(f"Min Views: {self.min_views}")
        print(f"Days to Monitor: {self.days_to_monitor}")
        print("-" * 50)

        if not all([self.api_key, self.channel_id, self.discord_webhook_url]):
            raise ValueError("Missing required environment variables")

    def get_recent_videos(self):
        """Fetch recent videos from the channel"""
        published_after = (datetime.now() - timedelta(days=self.days_to_monitor)).isoformat("T") + "Z"
        
        url = 'https://www.googleapis.com/youtube/v3/search'
        params = {
            'key': self.api_key,
            'channelId': self.channel_id,
            'order': 'date',
            'publishedAfter': published_after,
            'type': 'video',
            'part': 'snippet',
            'maxResults': 5
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            res = response.json()
            
            print("\n📺 최근 업로드된 영상:")
            print("-" * 50)
            for item in res.get('items', []):
                title = item['snippet']['title']
                published_at = item['snippet']['publishedAt']
                video_id = item['id']['videoId']
                keyword = extract_keyword_before_추천(title)
                
                print(f"제목: {title}")
                if keyword:
                    print(f"추출된 키워드: {keyword}")
                print(f"업로드: {published_at}")
                print(f"링크: https://youtu.be/{video_id}")
                print("-" * 50)
            
            video_ids = [item['id']['videoId'] for item in res.get('items', [])]
            return video_ids
        except requests.exceptions.RequestException as e:
            logging.error(f"Error fetching videos: {e}")
            return []

    def get_video_details(self, video_ids):
        """Get detailed information about videos"""
        url = 'https://www.googleapis.com/youtube/v3/videos'
        params = {
            'key': self.api_key,
            'id': ','.join(video_ids),
            'part': 'snippet,statistics'
        }

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            return response.json().get('items', [])
        except requests.exceptions.RequestException as e:
            logging.error(f"Error fetching video details: {e}")
            return []

    def contains_keywords(self, text):
        """Check if text contains any of the monitored keywords"""
        return any(keyword.lower() in text.lower() for keyword in self.keywords)

    def collect_trending_keywords(self, videos):
        """영상들에서 추천 키워드 수집"""
        keywords = []
        for item in videos:
            title = item['snippet']['title']
            keyword = extract_keyword_before_추천(title)
            if keyword:
                keywords.append(keyword)
        return keywords

    def send_to_website(self, keywords):
        """Send keywords to website API"""
        if not keywords:
            logging.info("No keywords to send to website")
            return
            
        website_api_url = os.getenv('WEBSITE_API_URL', 'http://localhost:3000/api/trending-keywords')
        
        data = {
            "keywords": keywords
        }
        
        try:
            print(f"\n🌐 웹사이트로 키워드 전송 시도...")
            response = requests.post(website_api_url, json=data)
            response.raise_for_status()
            print(f"✅ 웹사이트 전송 성공!")
            logging.info("Successfully sent keywords to website")
        except requests.exceptions.RequestException as e:
            print(f"❌ 웹사이트 전송 실패: {str(e)}")
            logging.error(f"Error sending keywords to website: {e}")

    def send_discord_notification(self, keywords):
        """Send trending keywords notification to Discord"""
        if not keywords:
            logging.info("No keywords to send")
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
        """Main monitoring loop"""
        logging.info("Starting YouTube keyword monitor...")
        
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
                # 디스코드와 웹사이트 모두에 전송
                self.send_discord_notification(keywords)
                self.send_to_website(keywords)
            
        except Exception as e:
            logging.error(f"Error in main execution: {e}")

if __name__ == "__main__":
    try:
        monitor = YouTubeKeywordMonitor()
        
        # 매일 오전 7시에 실행되도록 스케줄 설정
        schedule.every().day.at("07:00").do(monitor.run)
        
        print("🤖 봇이 실행되었습니다.")
        print("📅 매일 오전 7시에 키워드 알림을 보냅니다.")
        print("⌛ 다음 실행 시간까지 대기중...")
        
        # 즉시 한 번 실행
        monitor.run()
        
        # 스케줄 유지를 위한 무한 루프
        while True:
            schedule.run_pending()
            time.sleep(60)  # 1분마다 스케줄 체크
            
    except Exception as e:
        logging.error(f"Error in main execution: {e}") 