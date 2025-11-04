import os
from google import genai
from google.genai import types
import logging

try:
    # --- 1. Configuration (Client Pattern) ---
    API_KEY = os.environ["GEMINI_API_KEY"]
except KeyError:
    print("Error: GOOGLE_API_KEY environment variable not set.")
    print("Please set the variable or replace 'os.environ[\"GOOGLE_API_KEY\"]' with your key.")
    exit()

print("Authenticating with Google AI...")
client = genai.Client(api_key=API_KEY)

# --- 2. Define the YouTube URL and Prompt ---
video_url = "https://youtu.be/Q20PvSN1H2A?si=ddcABJPQZ4soTjk0"
prompt = "Please provide a summarized readout of this panel discussion."

print(f"Preparing request for: {video_url}")

# --- 3. Construct the Request (from ai.google.dev docs) ---
video_part = types.Part(
    file_data=types.FileData(file_uri=video_url),
    video_metadata=types.VideoMetadata(
        start_offset='0s', # Start at 0 seconds
        end_offset='4000s',   # End at 600 seconds
        fps=0.001  # 0.01 frames per second
    )
)
prompt_part = types.Part(text=prompt)
request_contents = types.Content(parts=[prompt_part, video_part])

# --- 4. Define the Model (THE CHANGE IS HERE) ---
# The ai.google.dev docs for this feature show 'gemini-2.5-flash'.
# Let's use that model, as 'pro' may have timed out.
model_name = "gemini-2.5-pro" 

# --- 5. Generate the "Readout" ---
print(f"Generating content with {model_name}...")

try:
    response = client.models.generate_content(
        model=model_name,
        contents=request_contents
    )
    
    print("\n--- Video Readout ---")
    print(response.text)
    print("---------------------\n")

    if response.usage_metadata:
            print(f"Token Usage: Input={response.usage_metadata.prompt_token_count}, Output={response.usage_metadata.candidates_token_count}, Total={response.usage_metadata.total_token_count}")

except Exception as e:
    print(f"An error occurred: {e}")
    print("Note: The documentation states that only public YouTube videos can be processed.")
    print("If this 'server disconnected' error persists, it may be a transient network issue. Please try running the script again after a moment.")

print("Script complete.")