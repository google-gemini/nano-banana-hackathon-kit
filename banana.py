import os
from google import genai
from PIL import Image
from io import BytesIO
from IPython.display import display
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get your API key from the environment variable
API_KEY = os.getenv("GEMINI_API_KEY")

# Configure the client with your API key
client = genai.Client(api_key=API_KEY)

# Directory to save generated images
output_dir = "generated_images"
os.makedirs(output_dir, exist_ok=True)

# Function to save and display an image
def save_and_display_image(image_bytes, filename, step_description=""):
    """Saves a bytes image to file and displays it."""
    image = Image.open(BytesIO(image_bytes))
    output_path = os.path.join(output_dir, filename)
    image.save(output_path)
    print(f"{step_description} saved to '{output_path}'.")
    display(image)
    return image # Return the PIL Image object for subsequent edits

# --- Step 1: Generate the initial base image from a text prompt ---
initial_prompt = "A picturesque landscape with a clear blue sky, green rolling hills, and a small river flowing through it."
initial_filename = "landscape_base.png"

print(f"Generating initial image: '{initial_prompt}'...")

response_initial = client.models.generate_content(
    model="gemini-2.5-flash-image-preview",
    contents=initial_prompt,
)

initial_image_bytes = None
if response_initial.candidates and response_initial.candidates[0].content.parts:
    for part in response_initial.candidates[0].content.parts:
        if part.inline_data:
            initial_image_bytes = part.inline_data.data
            break

if initial_image_bytes:
    # Save and display the initial image, and get the PIL Image object
    current_image_pil = save_and_display_image(
        initial_image_bytes, 
        initial_filename, 
        "Initial image generated and"
    )

    # --- Step 2: Perform iterative edits on the generated image ---
    print("\n--- Starting iterative edits ---")

    # Edit 1: Add a specific element
    edit_prompt_1 = "Add a red barn on the right side of the rolling hills."
    edit_filename_1 = "landscape_with_barn.png"
    print(f"Applying edit 1: '{edit_prompt_1}'...")
    response_edit_1 = client.models.generate_content(
        model="gemini-2.5-flash-image-preview",
        contents=[current_image_pil, edit_prompt_1], # Pass the PIL Image directly
    )

    edit_image_bytes_1 = None
    if response_edit_1.candidates and response_edit_1.candidates[0].content.parts:
        for part in response_edit_1.candidates[0].content.parts:
            if part.inline_data:
                edit_image_bytes_1 = part.inline_data.data
                break
    
    if edit_image_bytes_1:
        current_image_pil = save_and_display_image(
            edit_image_bytes_1, 
            edit_filename_1, 
            "Edit 1 (red barn) applied and"
        )
    else:
        print("Edit 1 failed to generate an image.")


    # Edit 2: Change atmospheric conditions
    edit_prompt_2 = "Make the sky look like a dramatic sunset with orange and purple hues."
    edit_filename_2 = "landscape_sunset.png"
    print(f"\nApplying edit 2: '{edit_prompt_2}'...")
    response_edit_2 = client.models.generate_content(
        model="gemini-2.5-flash-image-preview",
        contents=[current_image_pil, edit_prompt_2], # Pass the result of the previous edit
    )

    edit_image_bytes_2 = None
    if response_edit_2.candidates and response_edit_2.candidates[0].content.parts:
        for part in response_edit_2.candidates[0].content.parts:
            if part.inline_data:
                edit_image_bytes_2 = part.inline_data.data
                break

    if edit_image_bytes_2:
        current_image_pil = save_and_display_image(
            edit_image_bytes_2, 
            edit_filename_2, 
            "Edit 2 (sunset) applied and"
        )
    else:
        print("Edit 2 failed to generate an image.")
    
    # You can add more edits here...
    # For example:
    # edit_prompt_3 = "Add a small wooden bridge over the river."
    # ... and so on.

    print("\nAll specified edits processed.")

else:
    print("Initial image generation failed. Please check your prompt and API key.")