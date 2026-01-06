import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import OpenAI from 'openai';

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 3001;

// --- 🔧 HARD-CODED CONFIG (for local/mockup use only) ---
const OPENAI_API_KEY = "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";
const DATABASE_URL = "postgresql://data_pkrp_user:JhKMjNMpjWgpMtDohkk9D81BGYuNMJjy@dpg-d5eef3p5pdvs73fbe9t0-a/data_pkrp";
// --------------------------------------------------------

console.log("🧠 Using hardcoded OpenAI API key:", OPENAI_API_KEY ? "✔" : "✗");
console.log("🗄️ Using hardcoded database URL:", DATABASE_URL);

const pool = new Pool({
  connectionString: DATABASE_URL,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('❌ Database connection failed:', err.message);
  else console.log('✅ Database connected at:', res.rows[0].now);
});

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

app.use(cors());
app.use(express.json());

// ==================== HEALTH & BASIC ENDPOINTS ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ReMaterial API is running' });
});

// ==================== MATERIALS ENDPOINTS ====================

app.get('/api/materials', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM materials ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

app.get('/api/materials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM materials WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching material:', error);
    res.status(500).json({ error: 'Failed to fetch material' });
  }
});

// ==================== BUILDING PROJECTS ENDPOINTS ====================

app.get('/api/projects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM building_projects ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM building_projects WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// ==================== AI RECOMMENDATION ENDPOINT ====================

app.post('/api/recommend-for-project', async (req, res) => {
  try {
    const { projectId, specificQuery } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Fetch project details
    const projectResult = await pool.query('SELECT * FROM building_projects WHERE id = $1', [projectId]);
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const project = projectResult.rows[0];

    // Fetch all materials
    const materialsResult = await pool.query('SELECT * FROM materials');
    const materials = materialsResult.rows;

    // Fetch existing preferences for this project
    const preferencesResult = await pool.query(
      'SELECT * FROM material_preferences WHERE project_id = $1',
      [projectId]
    );
    const existingPreferences = preferencesResult.rows;

    const query = specificQuery || `I need materials for: ${project.required_materials.join(', ')}`;

    const prompt = `You are an expert advisor for sustainable circular building materials in the Netherlands.

Project: "${project.name}"
Location: ${project.location}
Type: ${project.project_type}
Target CO2 Reduction: ${project.target_co2_reduction}%
Required Materials Categories: ${project.required_materials.join(', ')}
Sustainability Goal: ${project.sustainability_goal}

User Query: "${query}"

Available Materials Database:
${JSON.stringify(materials, null, 2)}

Based on the project requirements and user query, recommend the top 5-7 most suitable materials. Prioritize:
1. Reclaimed/salvaged materials from demolition sites (highest priority)
2. Relevance to required material categories
3. CO2 reduction potential
4. Local availability in Rotterdam/Netherlands
5. Recyclability
6. Cost efficiency
7. Quantity available for project scale

Return ONLY a valid JSON object (no markdown, no extra text):
{
  "message": "Brief explanation of why these materials are recommended for this specific project",
  "reasoning": "Detailed reasoning about how selections meet project goals",
  "materialIds": [id1, id2, id3, id4, id5]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are a sustainable circular materials expert. Always respond with valid JSON only, no markdown formatting." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const responseText = completion.choices[0].message.content.trim();
    
    let aiResponse;
    try {
      aiResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      aiResponse = fallbackRecommendation(query, materials, project.required_materials);
    }

    // Fetch recommended materials
    const recommendedMaterials = materials.filter(m => 
      aiResponse.materialIds.includes(m.id)
    );

    // Save recommendations as new preferences if not already existing
    for (const materialId of aiResponse.materialIds) {
      const exists = existingPreferences.some(p => p.material_id === materialId);
      if (!exists) {
        await pool.query(
          'INSERT INTO material_preferences (project_id, material_id, preference_score) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [projectId, materialId, 5]
        );
      }
    }

    res.json({
      projectId,
      projectName: project.name,
      message: aiResponse.message,
      reasoning: aiResponse.reasoning || '',
      materials: recommendedMaterials,
      query
    });

  } catch (error) {
    console.error('Error in AI recommendation:', error);
    
    try {
      const { projectId } = req.body;
      const projectResult = await pool.query('SELECT * FROM building_projects WHERE id = $1', [projectId]);
      const project = projectResult.rows[0];
      
      const materialsResult = await pool.query('SELECT * FROM materials');
      const materials = materialsResult.rows;
      
      const fallback = fallbackRecommendation(
        req.body.specificQuery || `materials for ${project.required_materials.join(', ')}`,
        materials,
        project.required_materials
      );
      
      const recommendedMaterials = materials.filter(m => 
        fallback.materialIds.includes(m.id)
      );
      
      res.json({
        projectId,
        projectName: project.name,
        message: fallback.message + " (Using fallback matching)",
        reasoning: "Fallback selection based on keyword matching",
        materials: recommendedMaterials,
        query: req.body.specificQuery || project.required_materials.join(', ')
      });
    } catch (fallbackError) {
      res.status(500).json({ error: 'Failed to generate recommendations' });
    }
  }
});

// ==================== USER PREFERENCES ENDPOINTS ====================

app.get('/api/preferences/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query(
      'SELECT * FROM material_preferences WHERE project_id = $1 ORDER BY preference_score DESC',
      [projectId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

app.post('/api/preferences', async (req, res) => {
  try {
    const { projectId, materialId, preference_score, selected, notes } = req.body;

    if (!projectId || !materialId) {
      return res.status(400).json({ error: 'Project ID and Material ID are required' });
    }

    const result = await pool.query(
      `INSERT INTO material_preferences (project_id, material_id, preference_score, selected, notes)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (project_id, material_id) 
       DO UPDATE SET preference_score = $3, selected = $4, notes = $5
       RETURNING *`,
      [projectId, materialId, preference_score || 0, selected || false, notes || '']
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error saving preference:', error);
    res.status(500).json({ error: 'Failed to save preference' });
  }
});

app.delete('/api/preferences/:preferenceId', async (req, res) => {
  try {
    const { preferenceId } = req.params;
    await pool.query('DELETE FROM material_preferences WHERE id = $1', [preferenceId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting preference:', error);
    res.status(500).json({ error: 'Failed to delete preference' });
  }
});

// Get selected materials for a project
app.get('/api/projects/:projectId/selected-materials', async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await pool.query(
      `SELECT m.*, mp.preference_score, mp.selected, mp.notes
       FROM material_preferences mp
       JOIN materials m ON mp.material_id = m.id
       WHERE mp.project_id = $1 AND mp.selected = true
       ORDER BY mp.preference_score DESC`,
      [projectId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching selected materials:', error);
    res.status(500).json({ error: 'Failed to fetch selected materials' });
  }
});

// ==================== STATS ENDPOINTS ====================

app.get('/api/stats', async (req, res) => {
  try {
    const totalResult = await pool.query('SELECT COUNT(*) as count FROM materials');
    const reclaimedResult = await pool.query(
      "SELECT COUNT(*) as count FROM materials WHERE source_building IS NOT NULL"
    );
    const localResult = await pool.query(
      "SELECT COUNT(*) as count FROM materials WHERE local_availability = 'High'"
    );
    const avgCo2Result = await pool.query(
      'SELECT AVG(co2_reduction) as avg FROM materials'
    );
    const projectsResult = await pool.query('SELECT COUNT(*) as count FROM building_projects');
    
    res.json({
      total: parseInt(totalResult.rows[0].count),
      reclaimed: parseInt(reclaimedResult.rows[0].count),
      locallyAvailable: parseInt(localResult.rows[0].count),
      avgCo2Reduction: Math.round(parseFloat(avgCo2Result.rows[0].avg)),
      activeProjects: parseInt(projectsResult.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get project statistics
app.get('/api/projects/:projectId/stats', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const totalPreferences = await pool.query(
      'SELECT COUNT(*) as count FROM material_preferences WHERE project_id = $1',
      [projectId]
    );
    
    const selectedMaterials = await pool.query(
      'SELECT COUNT(*) as count FROM material_preferences WHERE project_id = $1 AND selected = true',
      [projectId]
    );
    
    const avgCo2 = await pool.query(
      `SELECT AVG(m.co2_reduction) as avg
       FROM material_preferences mp
       JOIN materials m ON mp.material_id = m.id
       WHERE mp.project_id = $1 AND mp.selected = true`,
      [projectId]
    );

    const estimatedCost = await pool.query(
      `SELECT COUNT(*) as count
       FROM material_preferences mp
       JOIN materials m ON mp.material_id = m.id
       WHERE mp.project_id = $1 AND mp.selected = true
       AND m.cost_index IN ('Low', 'Medium', 'High')`,
      [projectId]
    );
    
    res.json({
      totalRecommendations: parseInt(totalPreferences.rows[0].count),
      selectedMaterials: parseInt(selectedMaterials.rows[0].count),
      averageCo2Reduction: avgCo2.rows[0].avg ? Math.round(parseFloat(avgCo2.rows[0].avg)) : 0
    });
  } catch (error) {
    console.error('Error fetching project stats:', error);
    res.status(500).json({ error: 'Failed to fetch project stats' });
  }
});

// ==================== FALLBACK FUNCTION ====================

function fallbackRecommendation(query, materials, requiredCategories) {
  const lowerQuery = query.toLowerCase();
  const keywords = lowerQuery.split(' ');
  
  const scoredMaterials = materials.map(mat => {
    let score = 0;
    
    // Prioritize reclaimed materials
    if (mat.source_building) score += 10;
    
    // Match required categories
    if (requiredCategories && requiredCategories.some(req => 
      mat.category.toLowerCase().includes(req.toLowerCase()))) {
      score += 8;
    }
    
    // Match applications
    mat.applications?.forEach(app => {
      if (keywords.some(kw => app.includes(kw) || kw.includes(app))) {
        score += 3;
      }
    });
    
    // Match category
    if (keywords.some(kw => mat.category.toLowerCase().includes(kw))) {
      score += 2;
    }
    
    // Match name or description
    if (keywords.some(kw => mat.name.toLowerCase().includes(kw) || 
                            mat.description.toLowerCase().includes(kw))) {
      score += 1;
    }
    
    // Local availability bonus
    if (mat.local_availability === 'High') score += 3;
    
    return { ...mat, score };
  });
  
  const topMaterials = scoredMaterials
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 7);
  
  const materialsToUse = topMaterials.length > 0 
    ? topMaterials 
    : scoredMaterials.sort((a, b) => b.co2_reduction - a.co2_reduction).slice(0, 7);
  
  return {
    message: topMaterials.length > 0 
      ? "Based on your project requirements, I recommend these sustainable materials:"
      : "Here are top sustainable materials from our demolition database:",
    materialIds: materialsToUse.map(m => m.id)
  };
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ReMaterial Backend running on port ${PORT}`);
  console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Configured ✔' : 'Missing ✗'}`);
});