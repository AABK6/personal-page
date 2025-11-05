import pandas as pd
from google import genai
from google.genai import types
import os
import argparse
import sys
from tqdm import tqdm
import logging

# --- 1. Setup Logging ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# --- 2. Define the Prompt (Your "Rapporteur" prompt) ---
GEMINI_PROMPT_TEMPLATE = """
**Your Role:** You are a Senior Rapporteur for a premier think tank (e.g., *Chatham House* or *IFRI*). Your audience consists of experts, diplomats, and policymakers who demand substantive analysis, not summaries.

**Your Mission:** For each YouTube link provided, you will use your **built-in video analysis tool** to fetch and process the content. You will then produce an analytical readout in the form of a dense, narrative web article.

**Mandatory Editorial Line:**

* **Intellectual Density:** Every sentence must deliver information or analysis. You must eliminate all "filler," platitudes, and obvious statements.
* **Analytical Style (Not Descriptive):** Do not simply report *who* spoke and *what* they said. Focus on the *meaning* of what was said, the *implications* of the disagreements, and the *scope* of the proposals. Back up your analysis with direct quotes from the speakers.
* **Fluid Prose:** **No bullet points.** The final output must be a single, coherent text structured by thematic paragraphs.

**Required Article Format (Strictly enforce for each video):**

---

**[H1 TITLE: An analytical title that captures the central tension or thesis of the debate - IT MUST START WITH '## ']**
**(Leadin / Introduction)**
[Start with an introductory paragraph (3-4 sentences). Pose the context of the debate and enunciate immediately the primary thesis or the most significant tension that emerged. What did this panel *actually* reveal?]
**(Body of Analysis: 4 to 5 well-written paragraphs that reflects on the debates and discussions)**
[Weave the analysis into dense narrative paragraphs. Quote the speakers. *Do not* use bullet points. Use substantive subtitles as relevant. Remember this has to be extremely well written with full sentences.]
**(Conclusion: end on a strategic takeaway)**
[A final concluding paragraph (2-3 sentences) that answers the "So what?" question. What is the strategic implication of this discussion?]
---
"""

def get_article_from_gemini(client: genai.Client, video_link: str) -> str:
    """
    Sends the prompt and a *chunk* of the video to the Gemini API.
    """
    logging.info(f"Task Started: Processing {video_link}")
    
    try:
        # 1. Create the text part
        prompt_part = types.Part(text=GEMINI_PROMPT_TEMPLATE)
        
        # 2. *** THIS IS THE FIX (From your script) ***
        # We process a 4000-second chunk (66.6 mins) at a low FPS.
        # This keeps the input tokens low and avoids all timeouts.
        video_part = types.Part(
            file_data=types.FileData(file_uri=video_link),
            video_metadata=types.VideoMetadata(
                start_offset='0s',
                end_offset='4000s', # Process first ~66 minutes
                fps=0.05 # 1 frame every 20 seconds
            ) 
        )

        # 3. Create the Content object
        content_object = types.Content(parts=[prompt_part, video_part])
        
        logging.info("Sending request to Gemini API (using video chunking)...")
        # 4. Make the call. No timeout options are needed.
        response = client.models.generate_content(
            model="gemini-2.5-pro",
            contents=[content_object],
        )
        
        article_text = response.text
        logging.info("Task Success: Article generated.")
        if response.usage_metadata:
            logging.info(f"Token Usage: Input={response.usage_metadata.prompt_token_count}, Output={response.usage_metadata.candidates_token_count}, Total={response.usage_metadata.total_token_count}")
        return article_text
        
    except Exception as e:
        logging.error(f"Task Error processing {video_link}: {e}")
        return f"Error: {e}"

def main():
    # --- 3. Setup Argparse ---
    parser = argparse.ArgumentParser(description="Generate articles for YouTube links in a CSV.")
    parser.add_argument("--csv_file", type=str, default="english_recent_videos.csv", help="Path to the input/output CSV file.")
    parser.add_argument("--limit", type=int, default=1, help="Maximum number of links to process (X). Set to 0 to process all.")
    args = parser.parse_args()

    # --- 4. Setup API Key & Client ---
    api_key_to_use = None
    if "GEMINI_API_KEY" in os.environ:
        api_key_to_use = os.environ["GEMINI_API_KEY"]
        if "GOOGLE_API_KEY" in os.environ:
            logging.warning("Both keys found. Unsetting GOOGLE_API_KEY to prioritize GEMINI_API_KEY.")
            del os.environ["GOOGLE_API_KEY"]
    elif "GOOGLE_API_KEY" in os.environ:
        api_key_to_use = os.environ["GOOGLE_API_KEY"]
    
    if not api_key_to_use:
        logging.critical("GEMINI_API_KEY or GOOGLE_API_KEY environment variable not set.")
        sys.exit(1)

    try:
        # Initialize client with NO timeout options.
        client = genai.Client(api_key=api_key_to_use)
        logging.info("Gemini Client initialized.")
    except Exception as e:
        logging.critical(f"Failed to initialize Gemini client: {e}")
        sys.exit(1)

    # --- 5. Read and Prepare CSV ---
    try:
        df = pd.read_csv(args.csv_file)
    except FileNotFoundError:
        logging.critical(f"The file '{args.csv_file}' was not found.")
        sys.exit(1)

    if "Article" not in df.columns:
        logging.info("'Article' column not found, creating it.")
        df["Article"] = pd.NA
    
    df = df.astype({'Article': 'object'}) # Fix Pandas dtype warning
    
    rows_to_process = df[df['Article'].isna()]
    total_empty_rows = len(rows_to_process)
    
    if total_empty_rows == 0:
        logging.info("All articles are already generated. No new links to process.")
        sys.exit(0)

    if args.limit > 0:
        rows_to_process = rows_to_process.head(args.limit)
    
    logging.info(f"Found {total_empty_rows} empty rows. Processing {len(rows_to_process)}.")

    # --- 6. Process Videos Loop ---
    for index, row in tqdm(rows_to_process.iterrows(), total=len(rows_to_process), desc="Processing videos"):
        
        video_link = row['Link']
        
        article_text = get_article_from_gemini(client, video_link)
        
        # Save progress to CSV immediately
        df.loc[index, 'Article'] = article_text
        try:
            df.to_csv(args.csv_file, index=False, encoding='utf-8')
        except PermissionError:
            logging.error(f"Could not write to '{args.csv_file}'. Is it open in another program?")
            break # Stop the script if we can't save
        except Exception as e:
            logging.error(f"Failed to save CSV: {e}")

    # --- 7. Clean Up ---
    try:
        client.close()
        logging.info("Gemini client closed.")
    except Exception as e:
        logging.error(f"Error closing client: {e}")

    logging.info(f"Processing complete. '{args.csv_file}' has been updated.")

if __name__ == "__main__":
    main()