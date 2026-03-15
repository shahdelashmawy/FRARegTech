# FRA RegTech — Egyptian Financial Regulatory Intelligence Platform

A comprehensive bilingual (Arabic/English) web platform for Egyptian fintech professionals to track, search, and understand FRA (Financial Regulatory Authority) regulations.

---

## Features

### 🔔 Real-Time Regulatory Tracking
- Automated daily/weekly scraping of the FRA website (fra.gov.eg) and regulatory sources
- Social listening integration for LinkedIn regulatory announcements
- Instant alerts via **WhatsApp** and **Email** when new regulations match your keywords

### 🔍 Smart Search & Knowledge Base
- Full-text search across all regulations and uploaded documents
- **Semantic (AI-powered) search** — finds relevant content even without exact keyword matches
- Filter by regulation type, date range, tags, and language

### 🤖 AI-Powered Q&A (RAG)
- Ask natural language questions in Arabic or English
- Get precise answers with **citations** linking to source regulations
- Example: *"How do I obtain an FRA digital payment license?"*
- Understands regulatory processes end-to-end

### 📄 Document Management
- Upload PDFs, Word docs, and text files
- Auto-extraction and indexing of content
- Track reference URLs (link to official sources)
- All uploaded docs become searchable in the knowledge base

### 🌐 Bilingual Support (Arabic / English)
- Full Arabic RTL layout support
- Toggle between Arabic and English on any regulation
- AI responses in your preferred language
- Cairo font for Arabic text

### 🛡️ Custom Alert Profiles
- Set keyword watchlists (e.g., "crowdfunding", "digital wallet", "AML")
- Filter by regulation type
- Receive formatted WhatsApp or email notifications
- Per-user alert management

### 👤 User Authentication & Profiles
- Secure JWT-based registration and login
- Profile with notification preferences
- Personal keyword tracking
- Query history

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | FastAPI (Python 3.11) |
| Database | PostgreSQL 16 + pgvector |
| AI / LLM | Claude (Anthropic) |
| Embeddings | sentence-transformers (multilingual) |
| Task Queue | Celery + Redis |
| Notifications | Twilio (WhatsApp) + SMTP (Email) |
| Scraping | httpx + BeautifulSoup |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| State | Zustand + React Query |
| Containerization | Docker Compose |

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- An Anthropic API key (for AI features)
- Twilio account (for WhatsApp alerts, optional)
- SMTP credentials (for email alerts, optional)

### 1. Clone & Configure
```bash
git clone <repo-url>
cd FRARegTech

# Copy and fill in your credentials
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
ANTHROPIC_API_KEY=your_claude_api_key
SMTP_USER=your@email.com
SMTP_PASSWORD=your_app_password
TWILIO_ACCOUNT_SID=ACxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxx
```

### 2. Start Everything
```bash
docker-compose up -d
```

This starts:
- PostgreSQL with pgvector at `localhost:5432`
- Redis at `localhost:6379`
- FastAPI backend at `http://localhost:8000`
- React frontend at `http://localhost:3000`
- Celery workers for background scraping
- Flower dashboard at `http://localhost:5555`

### 3. Initialize Database
```bash
docker-compose exec backend alembic upgrade head
docker-compose exec backend python -m app.scripts.seed_data
```

### 4. Access the App
Open **http://localhost:3000** — Register and start tracking regulations!

---

## Development Setup (without Docker)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Start PostgreSQL and Redis locally, then:
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Start Celery Worker
```bash
cd backend
celery -A app.core.celery_app worker --loglevel=info
celery -A app.core.celery_app beat --loglevel=info
```

---

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Architecture

```
┌─────────────────┐     ┌──────────────────────────────────┐
│   React Frontend │────▶│  FastAPI Backend                 │
│   (Port 3000)   │     │  - Auth, Regulations, Search     │
└─────────────────┘     │  - AI Query (Claude RAG)         │
                        │  - Document Upload               │
                        │  - Alert Management              │
                        └──────────────┬───────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                   │
             ┌──────▼──────┐  ┌───────▼──────┐  ┌────────▼───────┐
             │ PostgreSQL  │  │    Redis     │  │ Celery Workers │
             │ + pgvector  │  │  (Queue)     │  │ - Scraping     │
             │ (Port 5432) │  │ (Port 6379)  │  │ - Notifications│
             └─────────────┘  └──────────────┘  └────────────────┘
```

---

## Regulatory Sources Scraped

- [FRA Official Website](https://www.fra.gov.eg) — Laws, Decrees, Circulars
- FRA Press Releases and Announcements
- Egyptian Official Gazette (Al-Waqa'i Al-Masriyya)
- LinkedIn (FRA official page social listening)

---

## Notification Formats

### WhatsApp Alert
```
🚨 FRA RegTech Alert: "crowdfunding"

📋 New Regulation: Crowdfunding Framework Amendment 2024
📅 Date: March 15, 2024
🏷️ Type: Decree
🔗 Source: https://fra.gov.eg/...

View full details: http://localhost:3000/regulations/123
```

### Email Alert
HTML formatted email with regulation summary and direct links.

---

## Contributing

1. Fork the repository
2. Create your feature branch
3. Add regulations sources or improve AI prompts
4. Submit a pull request

---

## License

MIT License — See LICENSE file.

---

*Built for Egyptian fintech professionals navigating the regulatory landscape.*
