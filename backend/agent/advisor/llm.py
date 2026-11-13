import os
from langchain_core.language_models import BaseChatModel
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

def get_llm() -> BaseChatModel:
    provider = os.getenv("LLM_PROVIDER", "openai").lower()

    if provider == "openai":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model="gemma-4-31b-it",
            temperature=0.3,
            api_key=os.environ["FREE_KEY"], # type: ignore
            base_url="http://localhost:3001/v1"
        )

    if provider == "ollama":
        from langchain_ollama import ChatOllama
        return ChatOllama(
            model="gemma4:31b-cloud",
            temperature=0.3,
            num_predict=2500,
            api_key =os.environ["OLLAMA_API_KEY"], # type: ignore
        )

    raise ValueError(f"unknown LLM_PROVIDER: {provider}")