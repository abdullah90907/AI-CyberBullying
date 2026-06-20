import os
import time
import httpx
from dotenv import load_dotenv

load_dotenv()

cached_news = None
last_fetch_time = 0
CACHE_DURATION = 10800  # 3 hours in seconds

# Fallback mock news in case API fails
MOCK_NEWS = [
    {
        "title": "AI-Powered Moderation Tools Reduce Cyberbullying by 40%",
        "description": "New research shows that AI-powered content moderation tools are significantly reducing cyberbullying incidents on major social platforms.",
        "url": "https://example.com/ai-moderation",
        "urlToImage": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop",
        "source": {"name": "Tech News Daily"},
        "publishedAt": "2024-06-20T10:30:00Z"
    },
    {
        "title": "Schools Adopt New Cyber Safety Programs",
        "description": "Schools across the country are implementing comprehensive cyber safety education programs to combat online harassment.",
        "url": "https://example.com/school-cyber-safety",
        "urlToImage": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop",
        "source": {"name": "Education Today"},
        "publishedAt": "2024-06-19T15:45:00Z"
    },
    {
        "title": "Social Platforms Introduce New Reporting Features",
        "description": "Major social media platforms have launched enhanced reporting tools for users to flag cyberbullying more easily.",
        "url": "https://example.com/new-reporting-features",
        "urlToImage": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=400&fit=crop",
        "source": {"name": "Social Media Weekly"},
        "publishedAt": "2024-06-18T09:15:00Z"
    },
    {
        "title": "Study: Parents Need More Digital Safety Training",
        "description": "A new study highlights the importance of parental digital literacy in preventing cyberbullying incidents.",
        "url": "https://example.com/parent-digital-training",
        "urlToImage": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop",
        "source": {"name": "Family Safety Magazine"},
        "publishedAt": "2024-06-17T12:20:00Z"
    },
    {
        "title": "AI Detection Tools Help Identify Harmful Content",
        "description": "Advanced AI models are now capable of detecting subtle forms of cyberbullying that human moderators often miss.",
        "url": "https://example.com/ai-detection-tools",
        "urlToImage": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop",
        "source": {"name": "AI Research Journal"},
        "publishedAt": "2024-06-16T08:00:00Z"
    },
    {
        "title": "Global Cyber Safety Initiative Launched",
        "description": "Countries unite to launch a global initiative aimed at creating safer online spaces for young people.",
        "url": "https://example.com/global-cyber-safety",
        "urlToImage": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop",
        "source": {"name": "World News"},
        "publishedAt": "2024-06-15T14:30:00Z"
    }
]

async def get_latest_news(force_refresh: bool = False):
    global cached_news, last_fetch_time
    
    current_time = time.time()
    
    if not force_refresh and cached_news and (current_time - last_fetch_time) < CACHE_DURATION:
        return cached_news
    
    api_key = os.getenv("NEWS_API_KEY")
    
    # Try real API first
    if api_key:
        url = "https://newsapi.org/v2/everything"
        params = {
            "q": "cyberbullying OR (AI AND moderation) OR (online AND safety) OR (content AND moderation) OR (digital AND safety) OR (bullying AND online)",
            "language": "en",
            "sortBy": "relevancy",
            "pageSize": 6
        }
        headers = {
            "X-Api-Key": api_key
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, headers=headers, timeout=30.0)
                response.raise_for_status()
                data = response.json()
                
                articles = data.get("articles", [])
                if articles:
                    cached_news = articles
                    last_fetch_time = current_time
                    return articles
        except Exception as e:
            print(f"News API Error: {e}")
    
    # Fallback to mock news if API fails or no key
    print("Using fallback mock news")
    cached_news = MOCK_NEWS
    last_fetch_time = current_time
    return MOCK_NEWS
