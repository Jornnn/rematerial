-- The database 'rematerial_db' is already created by POSTGRES_DB
-- Create materials table with expanded inventory from demolition sites
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    source TEXT NOT NULL,
    source_building VARCHAR(255),
    demolition_date DATE,
    category VARCHAR(100) NOT NULL,
    co2_reduction INTEGER NOT NULL,
    recyclability INTEGER NOT NULL,
    local_availability VARCHAR(50) NOT NULL,
    location VARCHAR(255) NOT NULL,
    cost_index VARCHAR(50) NOT NULL,
    quantity_available INTEGER,
    condition VARCHAR(50),
    applications TEXT[] NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create building projects table
CREATE TABLE IF NOT EXISTS building_projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    project_type VARCHAR(100) NOT NULL,
    budget_category VARCHAR(50),
    target_co2_reduction INTEGER,
    start_date DATE,
    estimated_completion DATE,
    required_materials TEXT[] NOT NULL,
    square_meters INTEGER,
    sustainability_goal TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user preferences table for material selections
CREATE TABLE IF NOT EXISTS material_preferences (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES building_projects(id) ON DELETE CASCADE,
    material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    preference_score INTEGER DEFAULT 0,
    selected BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, material_id)
);

-- Insert expanded materials database from demolition sites
INSERT INTO materials (name, source, source_building, demolition_date, category, co2_reduction, recyclability, local_availability, location, cost_index, quantity_available, condition, applications, description) VALUES
-- Reclaimed Structural Materials from Industrial Demolition
('Reclaimed Steel Beams', 'Rotterdam Industrial Port Authority warehouse', 'Port Authority Building 1A', '2023-06-15', 'Structural', 85, 98, 'High', 'Rotterdam Port Area', 'Low', 450, 'Excellent', ARRAY['frames', 'structure', 'beams', 'cycling station', 'bridge'], 'Heavy-duty structural I-beams from 1970s warehouse, fully certified and tested'),
('Reclaimed Steel Columns', 'Defunct manufacturing plant', 'Tata Steel Subsidiary Plant', '2023-05-20', 'Structural', 82, 97, 'High', 'IJmuiden', 'Low', 280, 'Excellent', ARRAY['structure', 'high-rise', 'industrial'], 'Load-bearing columns with original certifications and load ratings'),
('Reclaimed Steel Roofing Trusses', 'Historic textile factory', 'Amsterdam Textile Mill', '2023-08-10', 'Structural', 80, 96, 'Medium', 'Amsterdam', 'Medium', 320, 'Good', ARRAY['roof', 'structure', 'spans'], 'Engineered trusses suitable for large span roofs and industrial buildings'),

-- Reclaimed Brick from Heritage Buildings
('Reclaimed Red Brick', 'Historic Amsterdam townhouse', 'Canal House 1650s', '2023-03-12', 'Masonry', 88, 95, 'High', 'Rotterdam architectural salvage', 'High', 50000, 'Excellent', ARRAY['walls', 'facade', 'exterior', 'interior', 'restoration'], 'Authentic 17th-century Dutch bricks from demolished canal house'),
('Reclaimed Yellow Brick', 'Victorian office building', 'Victorian Office Block 1890s', '2023-04-08', 'Masonry', 85, 94, 'High', 'Rotterdam architectural salvage', 'High', 35000, 'Excellent', ARRAY['walls', 'facade', 'decorative', 'exterior'], 'High-quality Victorian-era bricks from decommissioned office block'),
('Reclaimed Clinker Brick', 'Industrial factory complex', 'Philips Factory Eindhoven', '2023-07-22', 'Masonry', 82, 93, 'Medium', 'Eindhoven', 'High', 25000, 'Good', ARRAY['facade', 'exterior', 'design', 'walls'], 'Heavy-duty clinker bricks ideal for contemporary facade designs'),
('Reclaimed Lime Mortar Bricks', 'Medieval building demolition', 'Historic Castle Remains', '2023-02-14', 'Masonry', 90, 92, 'Low', 'Maastricht heritage sites', 'High', 12000, 'Fair', ARRAY['restoration', 'walls', 'heritage'], 'Period bricks laid with original lime mortar for restoration work'),

-- Reclaimed Timber
('Reclaimed Oak Flooring', 'Grand manor house renovation', 'Nobleman Manor 1800s', '2023-09-05', 'Finishing', 87, 96, 'Medium', 'Friesland region', 'High', 180, 'Excellent', ARRAY['flooring', 'interior', 'walls', 'decorative'], 'Original 200+ year old oak floorboards, fully restored and graded'),
('Reclaimed Pine Beams', 'Rustic farmhouse demolition', 'Rural Farm Building', '2023-08-18', 'Structural', 84, 94, 'Medium', 'North Brabant', 'Medium', 220, 'Good', ARRAY['beams', 'structure', 'interior', 'walls'], 'Large cross-section pine beams from 19th-century farmhouse'),
('Reclaimed Hardwood Parquet', 'Luxury apartment complex', 'Historic Palace Apartments', '2023-06-30', 'Finishing', 86, 95, 'High', 'Rotterdam city center', 'High', 450, 'Excellent', ARRAY['flooring', 'interior', 'decorative'], 'Original parquet flooring from early 20th-century luxury residences'),
('Reclaimed Lumber Mix', 'Mixed demolition salvage', 'Multiple buildings warehouse', '2023-10-01', 'Finishing', 79, 91, 'High', 'Rotterdam processing center', 'Low', 5000, 'Fair', ARRAY['paneling', 'interior', 'insulation', 'structural'], 'Mixed dimension reclaimed timber suitable for various applications'),

-- Reclaimed Glass & Windows
('Reclaimed Stained Glass', 'Church restoration project', 'Historic Chapel 1920s', '2023-05-12', 'Finishing', 75, 100, 'Low', 'Delft', 'High', 45, 'Excellent', ARRAY['windows', 'decorative', 'interior', 'facade'], 'Authentic stained glass panels from historic chapel windows'),
('Reclaimed Cast Iron Windows', 'Victorian era building', 'Victorian Warehouse', '2023-07-08', 'Finishing', 80, 98, 'Medium', 'Amsterdam', 'High', 120, 'Good', ARRAY['windows', 'facade', 'restoration', 'exterior'], 'Ornamental cast-iron window frames from 1880s construction'),
('Reclaimed Double Glazing', 'Office building renovation', 'Modern Office 1980s', '2023-09-25', 'Finishing', 72, 85, 'High', 'Rotterdam industrial area', 'Low', 280, 'Good', ARRAY['windows', 'facade', 'insulation', 'exterior'], 'Energy-efficient double-glazed units removed from refurbished office'),

-- Reclaimed Stone
('Reclaimed Granite Blocks', 'Civic center demolition', 'City Hall Renovation Site', '2023-04-20', 'Foundation', 88, 99, 'Medium', 'Rotterdam civic area', 'High', 150, 'Excellent', ARRAY['foundation', 'paving', 'facade', 'exterior'], 'Large granite ashlar blocks from early 20th-century public building'),
('Reclaimed Limestone', 'Historic building remnants', 'Heritage Site Clearing', '2023-03-18', 'Masonry', 86, 97, 'Low', 'Limburg region', 'High', 200, 'Excellent', ARRAY['walls', 'facade', 'restoration', 'exterior'], 'Original limestone blocks suitable for heritage restoration work'),
('Reclaimed Slate Tiles', 'Roof refurbishment project', 'Historic Building Roofing', '2023-08-22', 'Finishing', 91, 99, 'Low', 'Wales origin (imported)', 'High', 320, 'Excellent', ARRAY['roof', 'exterior', 'decorative', 'paving'], 'Premium slate roofing tiles from Victorian-era buildings'),

-- Reclaimed Metal & Fixtures
('Reclaimed Copper Roofing', 'Building metal salvage', 'Heritage Metal Repository', '2023-06-05', 'Finishing', 93, 99, 'Low', 'Rotterdam salvage center', 'High', 85, 'Excellent', ARRAY['roof', 'exterior', 'decorative', 'facade'], 'Patinated copper sheet from historic building roofing systems'),
('Reclaimed Cast Iron Radiators', 'Historic property clearance', 'Victorian Heating Systems', '2023-07-15', 'Mechanical', 70, 96, 'Medium', 'Rotterdam antique dealers', 'Medium', 45, 'Good', ARRAY['heating', 'interior', 'decorative', 'restoration'], 'Ornamental cast-iron radiators from turn-of-century buildings'),
('Reclaimed Brass Door Fixtures', 'Hotel renovation salvage', 'Luxury Hotel Fittings', '2023-09-08', 'Finishing', 65, 100, 'High', 'Rotterdam city center', 'High', 150, 'Excellent', ARRAY['doors', 'interior', 'decorative', 'fixtures'], 'High-quality brass hardware and door fixtures from luxury properties'),

-- Reclaimed Concrete & Aggregates
('Reclaimed Concrete Chunks', 'Large demolition site', 'Multi-story Building Demolition', '2023-10-12', 'Foundation', 48, 92, 'High', 'Rotterdam demolition sites', 'Low', 12000, 'Fair', ARRAY['foundation', 'base', 'ground', 'fill'], 'Crushed and sorted concrete from major structural demolition'),
('Reclaimed Concrete Pavers', 'Urban plaza renovation', 'Civic Plaza Refurbishment', '2023-08-30', 'Foundation', 52, 88, 'High', 'Rotterdam public works', 'Low', 800, 'Good', ARRAY['paving', 'ground', 'landscape', 'exterior'], 'Salvaged concrete pavers from public infrastructure projects'),

-- Composite & Modern Reclaimed Materials
('Reclaimed Aluminum Frames', 'Commercial building refurb', 'Modern Commercial Complex', '2023-09-18', 'Structural', 75, 95, 'High', 'Rotterdam industrial zone', 'Low', 320, 'Excellent', ARRAY['frames', 'structure', 'windows', 'facade'], 'Aluminum structural frames from modern office building renovation'),
('Reclaimed Insulation Batts', 'Residential demolition', 'Historic House Removal', '2023-10-05', 'Insulation', 40, 30, 'High', 'Rotterdam residential areas', 'Low', 450, 'Fair', ARRAY['insulation', 'walls', 'interior'], 'Salvaged fiberglass insulation batts for reuse in new construction'),

-- Contemporary Sustainable Materials (supplementing reclaimed)
('Cross-Laminated Timber (CLT)', 'Sustainably harvested local forests', NULL, NULL, 'Structural', 85, 80, 'Medium', 'Zuid-Holland region', 'High', 500, 'New', ARRAY['roof', 'walls', 'floors', 'structure'], 'Engineered wood product with excellent structural properties'),
('Hempcrete Blocks', 'Industrial hemp + lime binder', NULL, NULL, 'Insulation', 92, 78, 'Medium', 'North Brabant suppliers', 'Medium', 1200, 'New', ARRAY['insulation', 'walls', 'interior'], 'Carbon-negative bio-composite with thermal properties'),
('Mycelium Insulation', 'Fungal growth on agricultural waste', NULL, NULL, 'Insulation', 95, 100, 'Low', 'Pilot production', 'High', 300, 'New', ARRAY['insulation', 'interior', 'soundproofing'], 'Innovative bio-grown fully biodegradable insulation'),
('Recycled Glass Aggregate', 'Post-consumer glass waste', NULL, NULL, 'Finishing', 58, 100, 'High', 'Rotterdam waste processing', 'Low', 5000, 'New', ARRAY['concrete', 'decorative', 'paving'], 'Crushed recycled glass for concrete and paving');

-- Insert building projects
INSERT INTO building_projects (name, location, description, project_type, budget_category, target_co2_reduction, start_date, estimated_completion, required_materials, square_meters, sustainability_goal) VALUES
('Circular Housing Development - Zuidpark', 'Rotterdam Zuidpark district', 'Sustainable residential complex with 45 units designed with circular material principles', 'Residential', 'Medium', 70, '2024-01-15', '2025-12-31', ARRAY['walls', 'flooring', 'structure', 'windows', 'insulation'], 4500, 'Achieve 70% reclaimed/sustainable materials in construction'),
('Heritage-Inspired Office Complex', 'Rotterdam city center extension', 'Modern office building incorporating reclaimed materials from nearby historic sites', 'Commercial', 'High', 65, '2024-02-01', '2026-03-31', ARRAY['facade', 'structure', 'interior', 'flooring', 'windows'], 8000, 'Blend modern functionality with historical material preservation'),
('Adaptive Reuse: Cultural Center Conversion', 'Rotterdam historic district', 'Converting abandoned textile factory into vibrant cultural and exhibition space', 'Cultural', 'Medium', 80, '2024-03-15', '2025-09-30', ARRAY['structure', 'interior', 'flooring', 'walls', 'roof'], 3200, 'Maximize reuse of existing structures and original materials'),
('Green School Complex - Zero Emissions Build', 'Rotterdam suburbs', 'Educational facility designed as living example of sustainable construction', 'Educational', 'Medium', 75, '2024-04-01', '2025-12-15', ARRAY['structure', 'walls', 'flooring', 'insulation', 'windows', 'roof'], 5000, 'Net-zero carbon construction with full material transparency'),
('Waterfront Mixed-Use Development', 'Rotterdam Maas Harbor', 'Residential and commercial waterfront project using salvaged maritime and industrial materials', 'Mixed-Use', 'High', 72, '2024-05-15', '2026-06-30', ARRAY['structure', 'facade', 'paving', 'interior', 'windows', 'roof'], 12000, 'Create showcase circular economy project for European standards'),
('Affordable Housing Initiative - Circular Homes', 'Rotterdam city neighborhoods', 'High-volume affordable housing using maximized reclaimed and recycled materials', 'Residential', 'Low', 68, '2024-06-01', '2026-01-31', ARRAY['structure', 'walls', 'flooring', 'doors', 'insulation'], 15000, 'Demonstrate cost-effective sustainable housing at scale');

-- Create indexes
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_materials_applications ON materials USING GIN(applications);
CREATE INDEX idx_materials_location ON materials(location);
CREATE INDEX idx_materials_condition ON materials(condition);
CREATE INDEX idx_projects_type ON building_projects(project_type);
CREATE INDEX idx_preferences_project ON material_preferences(project_id);
CREATE INDEX idx_preferences_material ON material_preferences(material_id);
CREATE INDEX idx_preferences_selected ON material_preferences(selected);

-- Add latitude and longitude columns to building_projects table
ALTER TABLE building_projects 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Update existing projects with Rotterdam coordinates
UPDATE building_projects 
SET latitude = 51.9145, longitude = 4.4800 
WHERE name = 'Circular Housing Development - Zuidpark';

UPDATE building_projects 
SET latitude = 51.9225, longitude = 4.4792 
WHERE name = 'Heritage-Inspired Office Complex';

UPDATE building_projects 
SET latitude = 51.9189, longitude = 4.4785 
WHERE name = 'Adaptive Reuse: Cultural Center Conversion';

UPDATE building_projects 
SET latitude = 51.9050, longitude = 4.5200 
WHERE name = 'Green School Complex - Zero Emissions Build';

UPDATE building_projects 
SET latitude = 51.9175, longitude = 4.4900 
WHERE name = 'Waterfront Mixed-Use Development';

UPDATE building_projects 
SET latitude = 51.9280, longitude = 4.4650 
WHERE name = 'Affordable Housing Initiative - Circular Homes';

-- Create index on coordinates for future spatial queries
CREATE INDEX IF NOT EXISTS idx_projects_coordinates 
ON building_projects(latitude, longitude);