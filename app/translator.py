import string

_DICTIONARY: dict[str, str] = {
    "the": "o / a",
    "be": "ser / estar",
    "to": "para",
    "of": "de",
    "and": "e",
    "a": "um / uma",
    "in": "em",
    "that": "que",
    "have": "ter",
    "it": "isso",
    "for": "para",
    "not": "não",
    "on": "em",
    "with": "com",
    "he": "ele",
    "she": "ela",
    "they": "eles",
    "we": "nós",
    "you": "você",
    "at": "em",
    "this": "este / esta",
    "but": "mas",
    "from": "de",
    "or": "ou",
    "an": "um / uma",
    "all": "todos",
    "which": "qual",
    "one": "um",
    "were": "eram",
    "her": "ela / dela",
    "do": "fazer",
    "if": "se",
    "will": "irá",
    "each": "cada",
    "about": "sobre",
    "up": "acima",
    "out": "fora",
    "many": "muitos",
    "then": "então",
    "them": "eles / elas",
    "these": "estes / estas",
    "so": "então",
    "some": "alguns",
    "would": "iria",
    "make": "fazer",
    "like": "gostar / como",
    "him": "ele",
    "into": "dentro de",
    "time": "tempo",
    "look": "olhar",
    "two": "dois",
    "more": "mais",
    "write": "escrever",
    "go": "ir",
    "see": "ver",
    "number": "número",
    "no": "não",
    "way": "caminho",
    "could": "poderia",
    "people": "pessoas",
    "my": "meu / minha",
    "than": "do que",
    "first": "primeiro",
    "water": "água",
    "been": "sido",
    "call": "chamar",
    "who": "quem",
    "its": "seu / sua",
    "now": "agora",
    "find": "encontrar",
    "long": "longo",
    "down": "abaixo",
    "day": "dia",
    "did": "fez",
    "get": "obter",
    "come": "vir",
    "made": "feito",
    "may": "pode",
    "part": "parte",
}


def _normalize(word: str) -> str:
    word = word.lower()
    word = word.strip(string.punctuation)
    return word


def translate_word(word: str) -> str:
    normalized = _normalize(word)
    if not normalized:
        return "Tradução não encontrada"

    local = _DICTIONARY.get(normalized)
    if local:
        return local

    try:
        from deep_translator import GoogleTranslator
        return GoogleTranslator(source="auto", target="pt").translate(normalized)
    except Exception:
        return "Tradução não encontrada"
