from deep_translator import GoogleTranslator


def translate(text: str, source: str = "en", target: str = "pt") -> str:
    try:
        return GoogleTranslator(source=source, target=target).translate(text)
    except Exception:
        return ""
