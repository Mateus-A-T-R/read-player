# Read Player

App de leitura interativa para aprendizado de idiomas. Clique em qualquer palavra do texto para ver a tradução instantânea e salvar no vocabulário pessoal.

## Funcionalidades

- Biblioteca de textos com upload de `.txt`
- Leitor com palavras clicáveis e popup de tradução
- Vocabulário pessoal com status (`new`, `learning`, `known`)
- Dashboard com estatísticas de progresso

---

## Rodar localmente

### Pré-requisitos

- Python 3.11+

### Instalação

```bash
# Clone o repositório
git clone https://github.com/Mateus-A-T-R/read-player.git
cd read-player

# Crie e ative o ambiente virtual
python -m venv venv
source venv/bin/activate      # Linux/macOS
venv\Scripts\activate         # Windows

# Instale as dependências
pip install -r requirements.txt
```

### Iniciar o servidor

```bash
uvicorn app.main:app --reload --port 8080
```

Acesse: [http://localhost:8080](http://localhost:8080)

O banco de dados SQLite (`readplayer.db`) é criado automaticamente na primeira execução.

---

## Deploy no Fly.io

### Pré-requisitos

- Conta no [Fly.io](https://fly.io)
- [flyctl](https://fly.io/docs/hands-on/install-flyctl/) instalado

### Passos

```bash
# Login
fly auth login

# Criar o app (apenas na primeira vez)
fly launch --no-deploy

# Criar volume persistente para o banco de dados
fly volumes create read_player_data --size 1

# Fazer deploy
fly deploy
```

### Atualizar após mudanças

```bash
fly deploy
```

### Acessar logs

```bash
fly logs
```

---

## Variáveis de ambiente

| Variável       | Padrão                        | Descrição                                      |
|----------------|-------------------------------|------------------------------------------------|
| `DATABASE_URL` | `sqlite:///./readplayer.db`   | URL do banco. Troque por PostgreSQL em produção |

### Usar PostgreSQL no Fly.io

```bash
# Criar banco Postgres
fly postgres create --name read-player-db

# Conectar ao app
fly postgres attach read-player-db

# A variável DATABASE_URL é configurada automaticamente
```

Quando `DATABASE_URL` apontar para PostgreSQL, o app detecta e remove o `check_same_thread` automaticamente.

---

## Estrutura do projeto

```
app/
├── main.py          # App FastAPI e rota "/"
├── database.py      # Configuração SQLAlchemy
├── models.py        # Models TextModel e Vocabulary
├── translator.py    # Tradutor local (dicionário EN→PT)
├── routes/
│   ├── library.py   # CRUD de textos
│   ├── reader.py    # Leitor + API de tradução
│   └── vocabulary.py# Vocabulário + API de status
├── templates/       # Jinja2 HTML
└── static/          # CSS e JS
```
