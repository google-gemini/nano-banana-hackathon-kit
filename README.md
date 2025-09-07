# TrailerCraft AI

**Your Personal AI Movie Trailer Studio**

---

### 🎥 [Watch the Video Demo](https://your-youtube-link-here)
### 🚀 [Try the Live Application](https://your-live-app-url-here)

---

## ✨ About The Project

TrailerCraft AI is an agentic application that transforms a simple movie idea into a complete, shareable video trailer. Our project showcases Gemini 2.5 Flash Image Preview (Nano Banana) as the core of a dynamic and collaborative creative workflow.

While our AI pipeline generates an initial script and storyboard, **Nano Banana is the star of our interactive "Storyboard" phase.** Here, the user becomes the director. Instead of being locked into a generated image, they can make iterative, natural-language edits.

A user can select a scene and type commands like:

* `"add a cybernetic eye to the character,"`
* `"make it rain,"` or
* `"change the setting to a neon-lit city street,"`

...and Nano Banana dynamically regenerates the visual.

This feature is central to our app's magic. It turns the static process of storyboarding into an interactive, conversational experience, allowing for rapid visual prototyping and fine-tuning. TrailerCraft AI leverages Nano Banana to move beyond simple generation, offering a powerful tool for dynamic storytelling and demonstrating the future of automated, collaborative creative work—a capability that wasn't possible before.

## 🎯 Why TrailerCraft AI is a Perfect Fit

This application is far more than a simple text-to-image demo. It's a complete, agentic system that automates a complex creative workflow.

#### Dynamic Storytelling
You aren't just creating a static image; you're building a narrative. The app takes a user from a high-level text concept to a full script, an editable storyboard, and a final, moving video. This is the definition of dynamic, AI-powered storytelling.

#### Automated Creative Workflows
This is your strongest angle. You've successfully automated the entire pre-production and concepting pipeline for a movie trailer—a process that normally takes teams of people days or weeks. This demonstrates immense utility and vision.

#### Next-Gen Natural Language Photo Editor
The Image Review component is your secret weapon. The ability to use Nano Banana to conversationally edit the generated storyboard images (e.g., `"make it nighttime,"` `"add a futuristic helmet"`) is precisely the kind of "magical user experience" the hackathon calls for. This is where our team demonstrates the unique, transformative power of `gemini-2.5-flash-image-preview`.

## 🛠️ How to Run This Project

To get a local copy up and running, follow these simple steps.

### Prerequisites

* Python 3.9+
* A Gemini API key.

### Installation & Setup

1.  **Clone the repository**
    ```sh
    git clone [https://github.com/your-username/trailercraft-ai.git](https://github.com/your-username/trailercraft-ai.git)
    cd trailercraft-ai
    ```

2.  **Install dependencies**
    ```sh
    pip install -r requirements.txt
    ```

3.  **Set up environment variables**
    * Create a new file named `.env` in the root directory.
    * Add your API key to this file:
    ```
    GEMINI_API_KEY='YOUR_API_KEY_HERE'
    ```

4.  **Run the application**
    ```sh
    # This is an example for a Streamlit app. Adjust if you are using a different framework.
    streamlit run app.py
    ```
