# VIBE 리뷰 분석기 - Python 백엔드
# /Users/hyunjucho/Documents/GitHub/coupas/python/review_analyzer.py

import asyncio
import json
import time
import re
import pandas as pd
import numpy as np
from datetime import datetime
from collections import Counter
from typing import Dict, List, Optional, Any
import logging

# 웹 크롤링
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from bs4 import BeautifulSoup
import requests

# AI 분석
from textblob import TextBlob
import matplotlib.pyplot as plt
import seaborn as sns
from wordcloud import WordCloud

# 웹 프레임워크
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="VIBE Review Analyzer API", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터 모델
class AnalysisRequest(BaseModel):
    url: str
    max_reviews: int = 100
    analysis_type: str = "basic"

class AnalysisStatus(BaseModel):
    id: str
    status: str  # 'crawling', 'analyzing', 'completed', 'error'
    progress: int
    message: str
    estimated_time: Optional[int] = None

class AnalysisResult(BaseModel):
    id: str
    product_info: Dict[str, Any]
    statistics: Dict[str, Any]
    sentiment: Dict[str, Any]
    keywords: List[Dict[str, Any]]
    generated_at: str

# 전역 변수로 분석 상태 저장
analysis_tasks = {}

class ReviewCrawler:
    """리뷰 크롤러 클래스"""
    
    def __init__(self, headless: bool = True):
        self.driver = None
        self.headless = headless
        self.setup_driver()
    
    def setup_driver(self):
        """Selenium 드라이버 설정"""
        try:
            chrome_options = Options()
            if self.headless:
                chrome_options.add_argument("--headless")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-blink-features=AutomationControlled")
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option('useAutomationExtension', False)
            
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            logger.info("Chrome 드라이버 초기화 완료")
        except Exception as e:
            logger.error(f"Chrome 드라이버 초기화 실패: {e}")
            self.driver = None
    
    def detect_platform(self, url: str) -> str:
        """URL에서 쇼핑몰 플랫폼 감지"""
        if 'coupang.com' in url:
            return 'coupang'
        elif 'aliexpress.com' in url:
            return 'aliexpress'
        elif 'amazon.com' in url or 'amazon.co.kr' in url:
            return 'amazon'
        else:
            raise ValueError("지원되지 않는 쇼핑몰입니다.")
    
    def get_product_info(self, url: str) -> Dict[str, Any]:
        """상품 기본 정보 수집"""
        platform = self.detect_platform(url)
        
        if not self.driver:
            raise Exception("크롤러 초기화 실패")
        
        try:
            self.driver.get(url)
            time.sleep(3)
            
            if platform == 'coupang':
                return self._get_coupang_product_info()
            elif platform == 'aliexpress':
                return self._get_aliexpress_product_info()
            elif platform == 'amazon':
                return self._get_amazon_product_info()
        except Exception as e:
            logger.error(f"상품 정보 수집 실패: {e}")
            return {
                'title': '상품명을 가져올 수 없습니다',
                'rating': 0,
                'review_count': 0,
                'price': '가격 정보 없음',
                'image': None
            }
    
    def _get_coupang_product_info(self) -> Dict[str, Any]:
        """쿠팡 상품 정보 수집"""
        try:
            # 상품명
            title_element = self.driver.find_element(By.CSS_SELECTOR, "h1.prod-buy-header__title")
            title = title_element.text.strip()
            
            # 평점
            try:
                rating_element = self.driver.find_element(By.CSS_SELECTOR, ".rating-star-num")
                rating = float(rating_element.text.strip())
            except:
                rating = 0
            
            # 리뷰 수
            try:
                review_count_element = self.driver.find_element(By.CSS_SELECTOR, ".rating-total-review-count")
                review_count = int(re.search(r'\d+', review_count_element.text).group())
            except:
                review_count = 0
            
            # 가격
            try:
                price_element = self.driver.find_element(By.CSS_SELECTOR, ".total-price strong")
                price = price_element.text.strip()
            except:
                price = "가격 정보 없음"
            
            # 이미지
            try:
                image_element = self.driver.find_element(By.CSS_SELECTOR, ".prod-image__detail img")
                image = image_element.get_attribute("src")
            except:
                image = None
            
            return {
                'title': title,
                'rating': rating,
                'review_count': review_count,
                'price': price,
                'image': image
            }
        except Exception as e:
            logger.error(f"쿠팡 상품 정보 수집 실패: {e}")
            raise
    
    def _get_aliexpress_product_info(self) -> Dict[str, Any]:
        """알리익스프레스 상품 정보 수집 (기본 구조)"""
        # 실제 구현은 알리익스프레스 페이지 구조에 맞게 조정 필요
        return {
            'title': 'AliExpress 상품',
            'rating': 4.5,
            'review_count': 100,
            'price': '$19.99',
            'image': None
        }
    
    def _get_amazon_product_info(self) -> Dict[str, Any]:
        """아마존 상품 정보 수집 (기본 구조)"""
        # 실제 구현은 아마존 페이지 구조에 맞게 조정 필요
        return {
            'title': 'Amazon 상품',
            'rating': 4.2,
            'review_count': 200,
            'price': '$29.99',
            'image': None
        }
    
    def crawl_reviews(self, url: str, max_reviews: int = 100, progress_callback=None) -> List[Dict[str, Any]]:
        """리뷰 크롤링 메인 함수"""
        platform = self.detect_platform(url)
        
        if platform == 'coupang':
            return self._crawl_coupang_reviews(url, max_reviews, progress_callback)
        elif platform == 'aliexpress':
            return self._crawl_aliexpress_reviews(url, max_reviews, progress_callback)
        elif platform == 'amazon':
            return self._crawl_amazon_reviews(url, max_reviews, progress_callback)
    
    def _crawl_coupang_reviews(self, url: str, max_reviews: int, progress_callback=None) -> List[Dict[str, Any]]:
        """쿠팡 리뷰 크롤링"""
        reviews = []
        
        try:
            # 리뷰 탭으로 이동
            review_tab = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//a[contains(text(), '상품리뷰')]"))
            )
            review_tab.click()
            time.sleep(2)
            
            page = 1
            while len(reviews) < max_reviews:
                if progress_callback:
                    progress = int((len(reviews) / max_reviews) * 70)  # 크롤링은 전체의 70%
                    progress_callback(progress, f"리뷰 수집 중... ({len(reviews)}/{max_reviews})")
                
                # 현재 페이지의 리뷰 수집
                review_elements = self.driver.find_elements(By.CSS_SELECTOR, "article.sdp-review__article")
                
                if not review_elements:
                    break
                
                for element in review_elements:
                    if len(reviews) >= max_reviews:
                        break
                    
                    try:
                        # 평점
                        rating_element = element.find_element(By.CSS_SELECTOR, ".sdp-review__rating__star")
                        rating = len(rating_element.find_elements(By.CSS_SELECTOR, ".icon--star-full"))
                        
                        # 리뷰 텍스트
                        review_text_element = element.find_element(By.CSS_SELECTOR, ".sdp-review__article__review")
                        review_text = review_text_element.text.strip()
                        
                        # 날짜
                        date_element = element.find_element(By.CSS_SELECTOR, ".sdp-review__article__date")
                        review_date = date_element.text.strip()
                        
                        # 도움이 됨 수
                        try:
                            helpful_element = element.find_element(By.CSS_SELECTOR, ".sdp-review__article__helpful__count")
                            helpful_count = int(re.search(r'\d+', helpful_element.text).group())
                        except:
                            helpful_count = 0
                        
                        reviews.append({
                            'id': f"review_{len(reviews)}",
                            'rating': rating,
                            'text': review_text,
                            'date': review_date,
                            'helpful_count': helpful_count,
                            'platform': 'coupang'
                        })
                    
                    except Exception as e:
                        logger.warning(f"개별 리뷰 수집 실패: {e}")
                        continue
                
                # 다음 페이지로
                try:
                    next_button = self.driver.find_element(By.CSS_SELECTOR, ".sdp-review__article__page__next")
                    if "disabled" in next_button.get_attribute("class"):
                        break
                    next_button.click()
                    time.sleep(2)
                    page += 1
                except:
                    break
            
        except Exception as e:
            logger.error(f"쿠팡 리뷰 크롤링 실패: {e}")
        
        return reviews
    
    def _crawl_aliexpress_reviews(self, url: str, max_reviews: int, progress_callback=None) -> List[Dict[str, Any]]:
        """알리익스프레스 리뷰 크롤링 (기본 구조)"""
        # 실제 구현 필요
        return []
    
    def _crawl_amazon_reviews(self, url: str, max_reviews: int, progress_callback=None) -> List[Dict[str, Any]]:
        """아마존 리뷰 크롤링 (기본 구조)"""
        # 실제 구현 필요
        return []
    
    def close(self):
        """드라이버 종료"""
        if self.driver:
            self.driver.quit()

class ReviewAnalyzer:
    """리뷰 분석기 클래스"""
    
    def __init__(self):
        # 한글 폰트 설정
        plt.rcParams['font.family'] = 'DejaVu Sans'
        plt.rcParams['axes.unicode_minus'] = False
    
    def analyze_sentiment(self, reviews: List[Dict[str, Any]], progress_callback=None) -> Dict[str, Any]:
        """감정 분석"""
        sentiments = []
        positive_count = 0
        negative_count = 0
        neutral_count = 0
        total_score = 0
        
        for i, review in enumerate(reviews):
            if progress_callback:
                progress = 70 + int((i / len(reviews)) * 20)  # 70%부터 90%까지
                progress_callback(progress, f"AI 감정 분석 중... ({i+1}/{len(reviews)})")
            
            text = review['text']
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity
            
            if polarity > 0.1:
                sentiment = 'positive'
                positive_count += 1
            elif polarity < -0.1:
                sentiment = 'negative'
                negative_count += 1
            else:
                sentiment = 'neutral'
                neutral_count += 1
            
            sentiments.append({
                'sentiment': sentiment,
                'polarity': polarity
            })
            total_score += polarity
        
        total_reviews = len(reviews)
        avg_score = total_score / total_reviews if total_reviews > 0 else 0
        
        return {
            'positive': round((positive_count / total_reviews) * 100, 1) if total_reviews > 0 else 0,
            'negative': round((negative_count / total_reviews) * 100, 1) if total_reviews > 0 else 0,
            'neutral': round((neutral_count / total_reviews) * 100, 1) if total_reviews > 0 else 0,
            'score': round(avg_score, 3),
            'details': sentiments
        }
    
    def extract_keywords(self, reviews: List[Dict[str, Any]], top_n: int = 20) -> List[Dict[str, Any]]:
        """키워드 추출 및 분석"""
        # 모든 리뷰 텍스트 합치기
        all_text = ' '.join([review['text'] for review in reviews])
        
        # 한글만 추출 (간단한 전처리)
        korean_text = re.sub(r'[^가-힣\s]', ' ', all_text)
        
        # 단어 분리
        words = korean_text.split()
        
        # 1글자 단어 및 불용어 제거
        stopwords = ['이', '그', '저', '것', '수', '때', '곳', '더', '잘', '좀', '진짜', '정말']
        words = [word for word in words if len(word) > 1 and word not in stopwords]
        
        # 빈도 계산
        word_freq = Counter(words)
        top_keywords = word_freq.most_common(top_n)
        
        # 키워드별 감정 분석
        keyword_sentiments = []
        for word, count in top_keywords:
            # 해당 키워드가 포함된 리뷰들의 감정 분석
            related_reviews = [r['text'] for r in reviews if word in r['text']]
            if related_reviews:
                sentiments = [TextBlob(text).sentiment.polarity for text in related_reviews]
                avg_sentiment = sum(sentiments) / len(sentiments)
                
                if avg_sentiment > 0.1:
                    sentiment = 'positive'
                elif avg_sentiment < -0.1:
                    sentiment = 'negative'
                else:
                    sentiment = 'neutral'
            else:
                sentiment = 'neutral'
            
            keyword_sentiments.append({
                'word': word,
                'count': count,
                'sentiment': sentiment
            })
        
        return keyword_sentiments
    
    def generate_statistics(self, reviews: List[Dict[str, Any]], product_info: Dict[str, Any]) -> Dict[str, Any]:
        """기본 통계 생성"""
        if not reviews:
            return {
                'total_reviews': 0,
                'avg_rating': 0,
                'rating_distribution': {},
                'avg_review_length': 0
            }
        
        ratings = [review['rating'] for review in reviews]
        review_lengths = [len(review['text']) for review in reviews]
        
        rating_dist = Counter(ratings)
        
        return {
            'total_reviews': len(reviews),
            'avg_rating': round(sum(ratings) / len(ratings), 2) if ratings else 0,
            'rating_distribution': dict(rating_dist),
            'avg_review_length': round(sum(review_lengths) / len(review_lengths), 0) if review_lengths else 0
        }

# API 엔드포인트
@app.post("/analyze")
async def start_analysis(request: AnalysisRequest, background_tasks: BackgroundTasks):
    """분석 시작"""
    analysis_id = f"analysis_{int(time.time())}"
    
    # 분석 태스크 등록
    analysis_tasks[analysis_id] = {
        'status': 'starting',
        'progress': 0,
        'message': '분석 준비 중...',
        'created_at': datetime.now().isoformat()
    }
    
    # 백그라운드에서 분석 실행
    background_tasks.add_task(run_analysis, analysis_id, request)
    
    return {
        'success': True,
        'analysis_id': analysis_id,
        'message': '분석이 시작되었습니다.'
    }

@app.get("/status/{analysis_id}")
async def get_analysis_status(analysis_id: str):
    """분석 상태 확인"""
    if analysis_id not in analysis_tasks:
        raise HTTPException(status_code=404, detail="분석을 찾을 수 없습니다.")
    
    task = analysis_tasks[analysis_id]
    return {
        'id': analysis_id,
        'status': task['status'],
        'progress': task['progress'],
        'message': task['message'],
        'estimated_time': task.get('estimated_time')
    }

@app.get("/results/{analysis_id}")
async def get_analysis_results(analysis_id: str):
    """분석 결과 조회"""
    if analysis_id not in analysis_tasks:
        raise HTTPException(status_code=404, detail="분석을 찾을 수 없습니다.")
    
    task = analysis_tasks[analysis_id]
    
    if task['status'] != 'completed':
        raise HTTPException(status_code=400, detail="분석이 아직 완료되지 않았습니다.")
    
    return {
        'success': True,
        'analysis': task['result']
    }

async def run_analysis(analysis_id: str, request: AnalysisRequest):
    """실제 분석 실행 함수"""
    def update_progress(progress: int, message: str):
        analysis_tasks[analysis_id].update({
            'progress': progress,
            'message': message,
            'status': 'analyzing' if progress < 100 else 'completed'
        })
    
    try:
        update_progress(5, "크롤러 초기화 중...")
        
        # 크롤러 초기화
        crawler = ReviewCrawler(headless=True)
        analyzer = ReviewAnalyzer()
        
        update_progress(10, "상품 정보 수집 중...")
        
        # 상품 정보 수집
        product_info = crawler.get_product_info(request.url)
        
        update_progress(20, "리뷰 크롤링 시작...")
        
        # 리뷰 크롤링
        reviews = crawler.crawl_reviews(
            request.url, 
            request.max_reviews, 
            progress_callback=update_progress
        )
        
        if not reviews:
            raise Exception("리뷰를 수집할 수 없습니다.")
        
        update_progress(75, "AI 분석 중...")
        
        # 감정 분석
        sentiment_result = analyzer.analyze_sentiment(reviews, update_progress)
        
        update_progress(90, "키워드 분석 중...")
        
        # 키워드 분석
        keywords = analyzer.extract_keywords(reviews)
        
        update_progress(95, "통계 생성 중...")
        
        # 기본 통계
        statistics = analyzer.generate_statistics(reviews, product_info)
        
        update_progress(100, "분석 완료!")
        
        # 결과 저장
        result = {
            'id': analysis_id,
            'product_info': product_info,
            'statistics': statistics,
            'sentiment': sentiment_result,
            'keywords': keywords,
            'raw_reviews': reviews,
            'generated_at': datetime.now().isoformat()
        }
        
        analysis_tasks[analysis_id].update({
            'status': 'completed',
            'result': result
        })
        
        # 크롤러 정리
        crawler.close()
        
    except Exception as e:
        logger.error(f"분석 실패: {e}")
        analysis_tasks[analysis_id].update({
            'status': 'error',
            'message': f"분석 중 오류가 발생했습니다: {str(e)}",
            'progress': 0
        })

@app.get("/")
async def root():
    return {"message": "VIBE Review Analyzer API", "status": "running"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)