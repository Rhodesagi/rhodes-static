#!/usr/bin/env python3
"""
Hacker News Top Stories Scraper
Fetches top 30 stories and saves to JSON + readable text
"""

import urllib.request
import urllib.error
import json
import time
from datetime import datetime

def fetch_top_stories(limit=30):
    """Fetch top story IDs from HN"""
    url = "https://hacker-news.firebaseio.com/v0/topstories.json"
    try:
        with urllib.request.urlopen(url, timeout=15) as response:
            all_ids = json.loads(response.read().decode())
            return all_ids[:limit]
    except urllib.error.URLError as e:
        print(f"Error fetching top stories: {e}")
        return []

def fetch_story(story_id):
    """Fetch individual story details"""
    url = f"https://hacker-news.firebaseio.com/v0/item/{story_id}.json"
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            return json.loads(response.read().decode())
    except urllib.error.URLError:
        return None

def main():
    print("🔥 Fetching Hacker News top stories...")
    
    top_ids = fetch_top_stories(30)
    if not top_ids:
        print("❌ Failed to fetch story IDs")
        return
    
    stories = []
    for i, story_id in enumerate(top_ids, 1):
        print(f"  Fetching {i}/30...", end="\r")
        story = fetch_story(story_id)
        if story and story.get("title"):
            stories.append({
                "rank": i,
                "title": story.get("title"),
                "url": story.get("url", f"https://news.ycombinator.com/item?id={story_id}"),
                "score": story.get("score", 0),
                "by": story.get("by", "unknown"),
                "time": datetime.fromtimestamp(story.get("time", 0)).strftime("%Y-%m-%d %H:%M"),
                "comments": story.get("descendants", 0)
            })
        time.sleep(0.05)  # be nice to the API
    
    print(f"\n✅ Fetched {len(stories)} stories")
    
    # Save as JSON
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    json_file = f"hn_top_{timestamp}.json"
    
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump({
            "fetched_at": datetime.now().isoformat(),
            "story_count": len(stories),
            "stories": stories
        }, f, indent=2, ensure_ascii=False)
    
    print(f"💾 Saved JSON: {json_file}")
    
    # Save as readable text
    text_file = f"hn_top_{timestamp}.txt"
    with open(text_file, "w", encoding="utf-8") as f:
        f.write(f"HACKER NEWS TOP STORIES\n")
        f.write(f"Fetched: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}\n")
        f.write(f"=" * 60 + "\n\n")
        
        for s in stories:
            f.write(f"{s['rank']:2}. {s['title']}\n")
            f.write(f"    🔥 {s['score']} pts | 💬 {s['comments']} comments | by {s['by']}\n")
            f.write(f"    {s['url']}\n\n")
    
    print(f"📝 Saved text: {text_file}")
    print(f"\n🏆 Top story: {stories[0]['title'][:50]}... ({stories[0]['score']} pts)")

if __name__ == "__main__":
    main()
