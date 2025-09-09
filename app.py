import os
from google import genai
from PIL import Image
from io import BytesIO
import streamlit as st
from dotenv import load_dotenv

# Load environment variables
# Works both locally (.env) and on Streamlit Cloud (secrets)
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY") or st.secrets.get("GEMINI_API_KEY")

if not API_KEY:
    st.error("❌ API key not found. Please set GEMINI_API_KEY in .env (local) or Streamlit Secrets (cloud).")
    st.stop()


# Configure the Gemini client
client = genai.Client(api_key=API_KEY)

# Directory to save generated images
output_dir = "generated_images"
os.makedirs(output_dir, exist_ok=True)


def generate_image(prompt, base_image=None):
    """Generates or edits an image using Gemini."""
    if base_image:
        response = client.models.generate_content(
            model="gemini-2.5-flash-image-preview",
            contents=[base_image, prompt],
        )
    else:
        response = client.models.generate_content(
            model="gemini-2.5-flash-image-preview",
            contents=prompt,
        )

    image_bytes = None
    if response.candidates and response.candidates[0].content.parts:
        for part in response.candidates[0].content.parts:
            if part.inline_data:
                image_bytes = part.inline_data.data
                break

    if image_bytes:
        image = Image.open(BytesIO(image_bytes))
        return image
    return None


# ---------------- Streamlit UI ----------------
st.set_page_config(page_title="Nano Banana Hackathon Kit 🍌", layout="wide")

st.title("🍌 Nano Banana Hackathon Kit")
st.markdown(
    """
Welcome to the **Nano Banana Hackathon Kit** demo!  
This app lets you **generate AI-powered images** from text prompts and apply **iterative edits**.  
Just enter a creative description and see your imagination come to life!
"""
)

# User prompt for initial image
initial_prompt = st.text_area(
    "Enter a description for your image:", 
    "A picturesque landscape with a clear blue sky, green rolling hills, and a small river flowing through it."
)

if st.button("✨ Generate Image"):
    with st.spinner("Generating your masterpiece..."):
        image = generate_image(initial_prompt)
        if image:
            st.image(image, caption="Generated Image", use_container_width=True)

            # Save to file
            filename = os.path.join(output_dir, "generated_image.png")
            image.save(filename)
            st.success(f"Image saved to {filename}")

            with open(filename, "rb") as f:
                st.download_button("⬇️ Download Image", f, file_name="generated_image.png")
        else:
            st.error("❌ Failed to generate image. Please try again.")

st.markdown("---")
st.subheader("🔄 Iterative Edits")

uploaded_image = st.file_uploader("Upload a previously generated image:", type=["png", "jpg", "jpeg"])
edit_prompt = st.text_input("Describe the edit:", "Add a red barn on the right side of the rolling hills.")

if st.button("Apply Edit"):
    if uploaded_image is not None:
        base_img = Image.open(uploaded_image)
        with st.spinner("Applying your edit..."):
            edited_image = generate_image(edit_prompt, base_img)
            if edited_image:
                st.image(edited_image, caption="Edited Image", use_container_width=True)

                # Save to file
                filename = os.path.join(output_dir, "edited_image.png")
                edited_image.save(filename)
                st.success(f"Edit applied and saved to {filename}")

                with open(filename, "rb") as f:
                    st.download_button("⬇️ Download Edited Image", f, file_name="edited_image.png")
            else:
                st.error("❌ Edit failed. Try again.")
    else:
        st.warning("Please upload an image first before applying edits.")
