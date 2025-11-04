import scrapetube
from langdetect import detect, DetectorFactory
from datetime import datetime, timedelta
import csv

DetectorFactory.seed = 0  # for consistent language detection

# Fetch recent videos
videos = scrapetube.get_channel(channel_username="ParisPeaceForum", limit=200)

# Define time window
now = datetime.now()
seven_days_ago = now - timedelta(days=7)

# Prepare list for CSV
english_recent_videos = []

for video in videos:
    try:
        title = video['title']['runs'][0]['text']
        lang = detect(title)
        if lang != 'en':
            continue

        published_text = video['publishedTimeText']['simpleText']
        # Skip videos without a parseable relative time (e.g., "Streamed 2 years ago")
        if 'ago' not in published_text:
            continue

        # Estimate publish time from relative text
        if 'hour' in published_text:
            published_date = now - timedelta(hours=int(published_text.split()[0]))
        elif 'day' in published_text:
            published_date = now - timedelta(days=int(published_text.split()[0]))
        else:
            continue

        if published_date < seven_days_ago:
            continue

        video_id = video['videoId']
        views = video.get('viewCountText', {}).get('simpleText', 'N/A')
        link = f"https://www.youtube.com/watch?v={video_id}"

        english_recent_videos.append({
            "Title": title,
            "Link": link,
            "Published": published_text,
            "Views": views
        })

    except Exception as e:
        continue

# Print results
for video in english_recent_videos:
    print(f"Title: {video['Title']}")
    print(f"Link: {video['Link']}")
    print(f"Published: {video['Published']}")
    print(f"Views: {video['Views']}")
    print("-" * 60)

# Write to CSV
with open("english_recent_videos.csv", "w", newline='', encoding='utf-8') as csvfile:
    fieldnames = ["Title", "Link", "Published", "Views"]
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(english_recent_videos)
