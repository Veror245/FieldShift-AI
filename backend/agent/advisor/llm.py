import os
from langchain_core.language_models import BaseChatModel
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

def get_llm() -> BaseChatModel:
    provider = os.getenv("LLM_PROVIDER", "freellm").lower()

    if provider == "freellm":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model="deepseek/deepseek-v4-flash-0731free:free", # type: ignore
            temperature=0.3, # type: ignore
            api_key=os.environ["FREE_KEY"], # type: ignore
            max_retries=3, # type: ignore
            timeout=10,
            base_url="http://localhost:3001/v1" # type: ignore
        )
    
    if provider == "groq":
        from langchain_groq import ChatGroq
        return ChatGroq(
            model="qwen/qwen3.8-27b", # type: ignore
            temperature=0.3, # type: ignore
            api_key=os.environ["GROQ_API_KEY"], # type: ignore
            max_retries=3, # type: ignore
            timeout=10,
        )

    if provider == "ollama":
        from langchain_ollama import ChatOllama
        return ChatOllama(
            model="gemma4:31b-cloud", # type: ignore
            temperature=0.3,
            num_predict=2500,
            api_key =os.environ["OLLAMA_API_KEY"], # type: ignore
        )
    
    if provider == "google":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model="gemma-4-31b-it", # type: ignore
            temperature=0.3, # type: ignore
            api_key=os.environ["GOOGLE_API_KEY"], # type: ignore
            max_retries=3,
            timeout=45,
        )

    raise ValueError(f"unknown LLM_PROVIDER: {provider}")