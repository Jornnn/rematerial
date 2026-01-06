# 🌱 ReMaterial - AI Advisor for Sustainable Urban Materials

An AI-powered web application that helps urban planners, architects, and designers in Rotterdam choose sustainable building materials and find circular alternatives.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. **Clone or create the project structure:**
```bash
mkdir rematerial && cd rematerial
# Create all the files as shown in the structure above
```

2. **Set up environment variables:**
```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your OpenAI API key
nano .env
# Add: OPENAI_API_KEY=sk-your-actual-key-here
```

3. **Start all services:**
```bash
docker-compose up --build
```

This will start:
- **Frontend** on http://localhost:5173
- **Backend** on http://localhost:3001
- **Database** on localhost:5432

4. **Access the application:**
Open your browser to http://localhost:5173

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │
│   (React)       │ :5173
│   Vite + Tailwind│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend       │
│   (Node.js)     │ :3001
│   Express + AI  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Database      │
│   (PostgreSQL)  │ :5432
│   Materials DB  │
└─────────────────┘
```

## 🔑 API Endpoints

### Health Check
```bash
GET http://localhost:3001/api/health
```

### Get All Materials
```bash
GET http://localhost:3001/api/materials
```

### Get Material by ID
```bash
GET http://localhost:3001/api/materials/:id
```

### AI Recommendation
```bash
POST http://localhost:3001/api/recommend
Content-Type: application/json

{
  "query": "I need material for wall insulation"
}
```

### Database Stats
```bash
GET http://localhost:3001/api/stats
```

## 🧪 Testing the API

Using curl:
```bash
# Health check
curl http://localhost:3001/api/health

# Get all materials
curl http://localhost:3001/api/materials

# AI recommendation
curl -X POST http://localhost:3001/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"query": "I need sustainable materials for a cycling station"}'
```

## 🛠️ Development

### Running in Development Mode
The Docker Compose setup includes hot-reload for both frontend and backend:

```bash
# Start with logs
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Restart a specific service
docker-compose restart backend
```

### Stopping the Application
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (including database data)
docker-compose down -v
```

### Accessing the Database
```bash
# Connect to PostgreSQL
docker exec -it rematerial-db psql -U rematerial -d rematerial_db

# Run queries
SELECT * FROM materials;
\q  # to quit
```

## 📊 Database Schema

```sql
materials (
  id                  SERIAL PRIMARY KEY,
  name                VARCHAR(255),
  source              TEXT,
  category            VARCHAR(100),
  co2_reduction       INTEGER,
  recyclability       INTEGER,
  local_availability  VARCHAR(50),
  location            VARCHAR(255),
  cost_index          VARCHAR(50),
  applications        TEXT[],
  description         TEXT,
  created_at          TIMESTAMP
)
```

## 🔧 Configuration

### Environment Variables

**.env file:**
- `OPENAI_API_KEY` - Your OpenAI API key (required)

**Backend (.env or docker-compose.yml):**
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Backend port (default: 3001)
- `NODE_ENV` - Environment (development/production)

**Frontend (.env or docker-compose.yml):**
- `VITE_API_URL` - Backend API URL (default: http://localhost:3001)

## 🧩 Adding New Materials

### Option 1: Via SQL
```bash
docker exec -it rematerial-db psql -U rematerial -d rematerial_db

INSERT INTO materials (name, source, category, co2_reduction, recyclability, 
                       local_availability, location, cost_index, applications, description)
VALUES ('New Material', 'Source', 'Category', 80, 90, 'High', 
        'Rotterdam', 'Medium', ARRAY['app1', 'app2'], 'Description');
```

### Option 2: Create API Endpoint
Add to `backend/server.js`:
```javascript
app.post('/api/materials', async (req, res) => {
  const { name, source, category, /* ... */ } = req.body;
  // Insert logic here
});
```

## 🎨 Customization

### Change OpenAI Model
Edit `backend/server.js`:
```javascript
model: "gpt-4o-mini"  // Change to "gpt-4" or "gpt-3.5-turbo"
```

### Adjust AI Temperature
```javascript
temperature: 0.7  // Lower = more focused, Higher = more creative
```

### Modify Frontend Theme
Edit `frontend/src/App.jsx` Tailwind classes or add custom CSS.

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find and kill process using port
lsof -ti:5173 | xargs kill -9  # Frontend
lsof -ti:3001 | xargs kill -9  # Backend
lsof -ti:5432 | xargs kill -9  # Database
```

### Database Connection Issues
```bash
# Check if database is healthy
docker-compose ps

# View database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

### OpenAI API Errors
- Verify your API key in `.env`
- Check API key has credits: https://platform.openai.com/usage
- View backend logs: `docker-compose logs backend`

### Frontend Can't Connect to Backend
- Ensure backend is running: `curl http://localhost:3001/api/health`
- Check `VITE_API_URL` in docker-compose.yml
- Clear browser cache and refresh

## 📦 Production Deployment

### Build for Production
```bash
# Build optimized images
docker-compose -f docker-compose.prod.yml build

# Run in production mode
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables for Production
Create `.env.production`:
```bash
OPENAI_API_KEY=sk-prod-key
DATABASE_URL=postgresql://user:pass@db:5432/rematerial_db
NODE_ENV=production
VITE_API_URL=https://your-domain.com
```

## 🔐 Security Notes

- **Never commit `.env`** to version control
- Use environment-specific API keys
- Enable CORS restrictions in production
- Use HTTPS in production
- Implement rate limiting on API endpoints
- Add authentication for production use

## 📈 Future Enhancements

- [ ] User authentication and project saving
- [ ] Export recommendations as PDF/JSON
- [ ] Integration with Citiverse Digital Twin
- [ ] Material comparison tool
- [ ] Cost calculator
- [ ] Carbon footprint visualization
- [ ] Material availability calendar
- [ ] Supplier directory
- [ ] Admin panel for material management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use for your projects!

## 💬 Support

For issues or questions:
- Check the troubleshooting section
- Review Docker logs
- Open an issue on GitHub

---

Built with ❤️ for sustainable urban development in Rotterdam
```

---

## 🚀 Usage Instructions

### Step-by-Step Setup:

1. **Create the project directory structure** and copy all files as shown above

2. **Add your OpenAI API key:**
   ```bash
   echo "OPENAI_API_KEY=sk-your-key-here" > .env
   ```

3. **Start everything:**
   ```bash
   docker-compose up --build
   ```

4. **Open your browser:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001/api/health

5. **Try example queries:**
   - "I need material for wall insulation"
   - "I'm designing a cycling station"
   - "What can I use for a green roof?"

### Key Features:

✅ **Complete Docker setup** - Everything runs with one command  
✅ **PostgreSQL database** - Pre-populated with 10 materials  
✅ **OpenAI integration** - Real AI-powered recommendations  
✅ **Fallback system** - Works even without OpenAI  
✅ **Hot reload** - Changes reflect immediately during development  
✅ **Health checks** - Automatic service monitoring  
✅ **Production ready** - Can be deployed as-is

The application will use OpenAI's GPT-4o-mini model to provide intelligent, context-aware material recommendations based on your queries!