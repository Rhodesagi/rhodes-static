#!/usr/bin/env python3
"""
Hacker News Top Stories Scraper
Fetches top 30 stories from HN via the official API.
Saves to both JSON and human-readable text formats.
"""

import urllib.request
import json
import time
from datetime import datetime
import os


def fetch_top_story_ids():
    """Fetch the top 30 story IDs from HN API."""
    url = "https://hacker-news.firebaseio.com/v0/topstories.json"
    
    req = urllib.request.Request(
        url,
        headers={
            'User-Agent': 'HN-Scraper-Python/1.0'
        }
    )
    
    with urllib.request.urlopen(req, timeout=10) as response:
        all_ids = json.loads(response.read().decode('utf-8'))
        return all_ids[:30]


def fetch_story(story_id):
    """Fetch a single story by ID."""
    url = f"https://hacker-news.firebaseio.com/v0/item/{story_id}.json"
    
    req = urllib.request.Request(
        url,
        headers={
            'User-Agent': 'HN-Scraper-Python/1.0'
        }
    )
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"  ⚠️  Error fetching story {story_id}: {e}")
        return None


def format_story_text(story, rank):
    """Format a story for human-readable text output."""
    title = story.get('title', 'No Title')
    url = story.get('url', f"https://news.ycombinator.com/item?id={story['id']}")
    score = story.get('score', 0)
    by = story.get('by', 'unknown')
    descendants = story.get('descendants', 0)
    time_unix = story.get('time', 0)
    
    # Convert Unix timestamp to readable format
    posted_time = datetime.fromtimestamp(time_unix).strftime('%Y-%m-%d %H:%M')
    
    lines = [
        f"{'=' * 60}",
        f"  🔥 Rank #{rank}",
        f"  📰 {title}",
        f"  🔗 {url}",
        f"  ⬆️  {score} points | 💬 {descendants} comments",
        f"  👤 by {by} | 🕐 {posted_time}",
        f"{'=' * 60}",
        ""
    ]
    
    return '\n'.join(lines)


def main():
    print("🚀 Fetching top Hacker News stories...")
    print()
    
    try:
        # Fetch top story IDs
        top_ids = fetch_top_story_ids()
        print(f"📋 Found {len(top_ids)} top stories to fetch")
        print()
        
        stories = []
        
        # Fetch each story
        for i, story_id in enumerate(top_ids, 1):
            print(f"  [{i:2d}/30] Fetching story {story_id}...", end='')
            story = fetch_story(story_id)
            if story:
                stories.append(story)
                print(" ✓")
            else:
                print(" ✗")
            
            # Polite delay
            time.sleep(0.05)
        
        print()
        print(f"✅ Successfully fetched {len(stories)} stories")
        print()
        
        # Generate timestamp for filenames
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Save as JSON
        json_filename = f"hn_top_{timestamp}.json"
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump({
                'scraped_at': datetime.now().isoformat(),
                'count': len(stories),
                'stories': stories
            }, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Saved JSON: {json_filename}")
        
        # Save as human-readable text
        text_filename = f"hn_top_{timestamp}.txt"
        with open(text_filename, 'w', encoding='utf-8') as f:
            f.write("HACKER NEWS TOP STORIES\n")
            f.write("=" * 60 + "\n")
            f.write(f"Scraped: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Stories: {len(stories)}\n")
            f.write("=" * 60 + "\n\n")
            
            for i, story in enumerate(stories, 1):
                f.write(format_story_text(story, i))
        
        print(f"💾 Saved text: {text_filename}")
        print()
        print("🎉 Done! Check your output files.")
        
        # Preview
        print()
        print("📊 QUICK PREVIEW:")
        print("-" * 60)
        for i, story in enumerate(stories[:5], 1):
            print(f"  {i}. {story.get('title', 'N/A')[:50]}... ({story.get('score', 0)} pts)")
        print("-" * 60)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
