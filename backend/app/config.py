from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT / '.env', extra='ignore')
    host: str = '127.0.0.1'
    port: int = 8000
    database_url: str = f'sqlite:///{(ROOT / "data/careercanvas.db").as_posix()}'
    ai_enabled: bool = False
    gemini_api_key: str = ''
    gemini_model: str = ''
    export_directory: Path = ROOT / 'data/exports'
