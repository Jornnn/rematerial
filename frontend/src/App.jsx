import React, { useState, useRef, useEffect } from 'react';
import { Send, Leaf, MapPin, TrendingDown, Recycle, Building2, ChevronDown, Heart, Check, Moon, Sun, Map as MapIcon } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const App = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [stats, setStats] = useState(null);
  const [projectStats, setProjectStats] = useState(null);
  const [preferences, setPreferences] = useState([]);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [mapInitialized, setMapInitialized] = useState(false);
  const messagesEndRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (selectedProject) {
      setMessages([
        {
          role: 'assistant',
          content: `Great! You've selected "${selectedProject.name}". This ${selectedProject.project_type.toLowerCase()} project in ${selectedProject.location} requires sustainable materials for: ${selectedProject.required_materials.join(', ')}. Tell me more about your priorities, or I can recommend materials right away.`,
          materials: [],
          type: 'info'
        }
      ]);
    } else {
      setMessages([
        {
          role: 'assistant',
          content: 'Hello! I\'m your AI advisor for sustainable building materials from demolition sites. Select a building project to get started with AI-powered material recommendations.',
          materials: [],
          type: 'intro'
        }
      ]);
    }
  }, [selectedProject]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadProjectPreferences = async (projectId) => {
    try {
      const res = await fetch(`${API_URL}/api/preferences/${projectId}`);
      const data = await res.json();
      setPreferences(data);
    } catch (err) {
      console.error('Failed to load preferences:', err);
    }
  };

  const loadProjectStats = async (projectId) => {
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/stats`);
      const data = await res.json();
      setProjectStats(data);
    } catch (err) {
      console.error('Failed to load project stats:', err);
    }
  };

  const loadSelectedMaterials = async (projectId) => {
    try {
      const res = await fetch(`${API_URL}/api/projects/${projectId}/selected-materials`);
      const data = await res.json();
      setSelectedMaterials(data);
    } catch (err) {
      console.error('Failed to load selected materials:', err);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const projectsRes = await fetch(`${API_URL}/api/projects`);
        const projectsData = await projectsRes.json();
        setProjects(projectsData);

        const statsRes = await fetch(`${API_URL}/api/stats`);
        const statsData = await statsRes.json();
        setStats(statsData);

        if (projectsData.length > 0) {
          const first = projectsData[0];
          setSelectedProject(first);
          await Promise.all([
            loadProjectPreferences(first.id),
            loadProjectStats(first.id),
            loadSelectedMaterials(first.id)
          ]);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };

    loadInitialData();
  }, []);

// Load Leaflet library
  useEffect(() => {
    if (!window.L) {
      // Load Leaflet CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // Load Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        console.log('Leaflet loaded successfully');
      };
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'map' && mapRef.current && projects.length > 0) {
      console.log('Map tab activated, checking map state...');
      console.log('Map instance exists:', !!mapInstanceRef.current);
      console.log('Map container:', mapRef.current);
      console.log('Container has leaflet class:', mapRef.current.classList.contains('leaflet-container'));
      
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        // Check if the container is actually a Leaflet map
        const isLeafletContainer = mapRef.current.classList.contains('leaflet-container');
        
        if (!mapInstanceRef.current || !isLeafletContainer) {
          console.log('Need to initialize map (instance exists:', !!mapInstanceRef.current, ', is leaflet container:', isLeafletContainer, ')');
          
          // Clean up old instance if it exists but container is gone
          if (mapInstanceRef.current) {
            try {
              mapInstanceRef.current.remove();
            } catch (e) {
              console.log('Error removing old map:', e);
            }
            mapInstanceRef.current = null;
          }
          
          setMapInitialized(false);
          initializeMap();
        } else {
          console.log('Map exists, refreshing...');
          // If map exists, just refresh it
          try {
            mapInstanceRef.current.invalidateSize();
            updateMarkers();
            console.log('Map refreshed successfully');
          } catch (error) {
            console.error('Error refreshing map:', error);
            // If refresh fails, try reinitializing
            mapInstanceRef.current = null;
            setMapInitialized(false);
            initializeMap();
          }
        }
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [activeTab, projects]);

  const initializeMap = () => {
    if (!window.L) {
      console.log('Leaflet not loaded yet, retrying...');
      setTimeout(() => initializeMap(), 200);
      return;
    }
    
    if (mapInstanceRef.current) {
      console.log('Map already initialized');
      return;
    }
    
    if (!mapRef.current) {
      console.log('Map ref not available');
      return;
    }

    try {
      console.log('Initializing map...');
      const rotterdamCenter = [51.9225, 4.47917];
      const map = window.L.map(mapRef.current, {
        center: rotterdamCenter,
        zoom: 12
      });
      
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapInitialized(true);
      console.log('Map initialized successfully');
      
      setTimeout(() => {
        map.invalidateSize();
        addMarkers();
      }, 100);

      window.selectProjectFromMap = (projectId) => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
          handleProjectSelect(project);
          setActiveTab('chat');
        }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const addMarkers = () => {
    if (!mapInstanceRef.current || !window.L) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    projects.forEach(project => {
      if (project.latitude && project.longitude) {
        const isSelected = selectedProject?.id === project.id;
        
        const marker = window.L.marker([project.latitude, project.longitude], {
          icon: window.L.divIcon({
            className: 'custom-marker',
            html: `<div style="
              background-color: ${isSelected ? '#16a34a' : '#3b82f6'};
              width: 32px;
              height: 32px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-center;
              color: white;
              font-weight: bold;
              font-size: 16px;
            ">${project.name.charAt(0)}</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })
        }).addTo(mapInstanceRef.current);

        marker.bindPopup(`
          <div style="min-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 8px; color: #16a34a;">${project.name}</h3>
            <p style="font-size: 14px; color: #666; margin-bottom: 4px;"><strong>Type:</strong> ${project.project_type}</p>
            <p style="font-size: 14px; color: #666; margin-bottom: 4px;"><strong>Location:</strong> ${project.location}</p>
            <p style="font-size: 14px; color: #666; margin-bottom: 4px;"><strong>Area:</strong> ${project.square_meters} m²</p>
            <p style="font-size: 14px; color: #666;"><strong>CO₂ Target:</strong> ${project.target_co2_reduction}%</p>
            ${!isSelected ? `<button onclick="window.selectProjectFromMap(${project.id})" style="
              margin-top: 8px;
              background-color: #16a34a;
              color: white;
              border: none;
              padding: 6px 12px;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
              width: 100%;
            ">Select Project</button>` : '<p style="margin-top: 8px; color: #16a34a; font-weight: 600;">✓ Currently Selected</p>'}
          </div>
        `);

        markersRef.current.push(marker);
      }
    });
  };

  const updateMarkers = () => {
    if (!mapInstanceRef.current || !window.L) return;
    addMarkers();
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    loadProjectPreferences(project.id);
    loadProjectStats(project.id);
    loadSelectedMaterials(project.id);
    setShowProjectDropdown(false);
    if (activeTab !== 'chat') {
      setActiveTab('chat');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedProject) return;

    const userMessage = { role: 'user', content: input, materials: [] };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(`${API_URL}/api/recommend-for-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId: selectedProject.id, 
          specificQuery: currentInput 
        }),
      });

      const data = await response.json();

      const assistantMessage = {
        role: 'assistant',
        content: data.message,
        reasoning: data.reasoning,
        materials: data.materials,
        type: 'recommendation'
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      loadProjectPreferences(selectedProject.id);
      loadProjectStats(selectedProject.id);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        materials: []
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const updatePreference = async (materialId, score, selected) => {
    try {
      await fetch(`${API_URL}/api/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject.id,
          materialId,
          preference_score: score,
          selected
        })
      });
      loadProjectPreferences(selectedProject.id);
      loadProjectStats(selectedProject.id);
      loadSelectedMaterials(selectedProject.id);
    } catch (error) {
      console.error('Error updating preference:', error);
    }
  };

  if (!selectedProject) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-green-50 via-blue-50 to-teal-50'}`}>
        <div className="text-center">
          <Leaf className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>ReMaterial</h1>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-green-50 via-blue-50 to-teal-50'}`}>
        <header className={`border-b transition-colors duration-300 ${darkMode ? 'bg-gray-800 border-gray-700 shadow-xl' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 p-2 rounded-lg">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>ReMaterial</h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>AI Advisor for Circular Urban Materials</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 border border-gray-600 hover:bg-gray-600' 
                      : 'bg-green-50 border border-green-300 hover:bg-green-100'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-green-600" />
                  <span className={`text-sm font-semibold max-w-xs truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedProject.name}
                  </span>
                  <ChevronDown className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                </button>

                {showProjectDropdown && (
                  <div className={`absolute top-full right-0 mt-2 w-80 rounded-lg shadow-2xl z-50 transition-colors duration-300 ${
                    darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                  }`}>
                    {projects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => handleProjectSelect(project)}
                        className={`w-full text-left px-4 py-3 border-b transition-colors ${
                          selectedProject.id === project.id 
                            ? darkMode ? 'bg-green-900 border-green-700' : 'bg-green-100'
                            : darkMode ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-green-50 border-gray-100'
                        }`}
                      >
                        <div className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {project.name}
                        </div>
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {project.location}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-center mb-6">
            <div className={`flex gap-4 rounded-xl p-1 ${darkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  activeTab === 'chat'
                    ? 'bg-green-600 text-white'
                    : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'map'
                    ? 'bg-green-600 text-white'
                    : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MapIcon className="w-4 h-4" />
                Map
              </button>
              <button
                onClick={() => setActiveTab('selected')}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  activeTab === 'selected'
                    ? 'bg-green-600 text-white'
                    : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Selected Materials
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className={`rounded-xl p-5 transition-colors duration-300 ${darkMode ? 'bg-gray-800 shadow-lg' : 'bg-white shadow-md'}`}>
              <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>Project Details</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Type</p>
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedProject.project_type}</p>
                </div>
                <div>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Target CO₂ Reduction</p>
                  <p className="font-semibold text-green-600">{selectedProject.target_co2_reduction}%</p>
                </div>
                <div>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Area</p>
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedProject.square_meters} m²</p>
                </div>
              </div>
            </div>

            {projectStats && (
              <div className={`rounded-xl p-5 transition-colors duration-300 ${darkMode ? 'bg-gray-800 shadow-lg' : 'bg-white shadow-md'}`}>
                <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Selection Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Recommendations</span>
                    <span className={`font-bold text-xl ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                      {projectStats.totalRecommendations}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Selected</span>
                    <span className={`font-bold text-xl ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {projectStats.selectedMaterials}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg CO₂</span>
                    <span className={`font-bold text-xl ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                      {projectStats.averageCo2Reduction}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {stats && (
              <div className={`rounded-xl p-5 transition-colors duration-300 ${darkMode ? 'bg-gray-800 shadow-lg' : 'bg-white shadow-md'}`}>
                <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Material Inventory</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total</span>
                    <span className={`font-bold text-xl ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{stats.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>From Demolition</span>
                    <span className={`font-bold text-xl ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{stats.reclaimed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Local</span>
                    <span className={`font-bold text-xl ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{stats.locallyAvailable}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center">
            {activeTab === 'map' && (
              <div className={`w-full max-w-6xl rounded-2xl shadow-xl overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="p-6">
                  <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Building Projects in Rotterdam
                  </h2>
                  <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Click on a marker to see project details and select it for material recommendations.
                  </p>
                </div>
                
                <div ref={mapRef} style={{ height: '600px', width: '100%' }} className="rounded-b-2xl" />
                
                <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: '#16a34a',
                        border: '2px solid white',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
                      }}></div>
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Selected Project</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: '#3b82f6',
                        border: '2px solid white',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
                      }}></div>
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Available Projects</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div
                className={`w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col transition-colors duration-300 ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}
                style={{ height: 'calc(100vh - 400px)', minHeight: '500px' }}
              >
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-md rounded-2xl px-6 py-4 transition-colors duration-300 ${
                          msg.role === 'user'
                            ? 'bg-green-600 text-white'
                            : darkMode
                              ? 'bg-gray-700 text-gray-100'
                              : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-base leading-relaxed">{msg.content}</p>
                        {msg.reasoning && (
                          <p
                            className={`text-sm italic mt-2 ${
                              msg.role === 'user'
                                ? 'opacity-80'
                                : darkMode
                                  ? 'text-gray-400'
                                  : 'text-gray-600'
                            }`}
                          >
                            {msg.reasoning}
                          </p>
                        )}

                        {msg.materials && msg.materials.length > 0 && (
                          <div className="mt-6 space-y-4">
                            {msg.materials.map((material) => {
                              const pref = preferences.find(p => p.material_id === material.id);
                              return (
                                <div
                                  key={material.id}
                                  className={`rounded-xl p-4 transition-colors duration-300 ${
                                    msg.role === 'user'
                                      ? 'bg-green-500 text-white'
                                      : darkMode
                                        ? 'bg-gray-600 text-white'
                                        : 'bg-white text-gray-900'
                                  }`}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <h4 className="font-bold text-base">{material.name}</h4>
                                      <p className="text-xs opacity-75">{material.source}</p>
                                      {material.source_building && (
                                        <p className="text-xs font-semibold mt-1">
                                          📦 From: {material.source_building}
                                        </p>
                                      )}
                                    </div>
                                    <span
                                      className={`text-xs px-2 py-1 rounded-full ${
                                        msg.role === 'user'
                                          ? 'bg-green-400 text-green-900'
                                          : darkMode
                                            ? 'bg-gray-500 text-gray-100'
                                            : 'bg-green-100 text-green-800'
                                      }`}
                                    >
                                      {material.category}
                                    </span>
                                  </div>

                                  <p className="text-sm mb-3 opacity-90">{material.description}</p>

                                  <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="flex items-center gap-2 text-xs">
                                      <TrendingDown className="w-4 h-4" />
                                      <div>
                                        <p className="opacity-75">CO₂</p>
                                        <p className="font-semibold">{material.co2_reduction}%</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      <Recycle className="w-4 h-4" />
                                      <div>
                                        <p className="opacity-75">Recycle</p>
                                        <p className="font-semibold">{material.recyclability}%</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between text-xs mb-3 pb-3 border-b border-opacity-30 border-current">
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-3 h-3" />
                                      <span>{material.location}</span>
                                    </div>
                                    <span
                                      className={`px-2 py-1 rounded-full text-xs ${
                                        material.local_availability === 'High'
                                          ? msg.role === 'user'
                                            ? 'bg-green-400 text-green-900'
                                            : darkMode
                                              ? 'bg-green-900 text-green-200'
                                              : 'bg-green-100 text-green-800'
                                          : material.local_availability === 'Medium'
                                            ? msg.role === 'user'
                                              ? 'bg-yellow-400 text-yellow-900'
                                              : darkMode
                                                ? 'bg-yellow-900 text-yellow-200'
                                                : 'bg-yellow-100 text-yellow-800'
                                            : msg.role === 'user'
                                              ? 'bg-orange-400 text-orange-900'
                                              : darkMode
                                                ? 'bg-orange-900 text-orange-200'
                                                : 'bg-orange-100 text-orange-800'
                                      }`}
                                    >
                                      {material.local_availability} availability
                                    </span>
                                  </div>

                                  {material.quantity_available && (
                                    <div className="text-xs mb-3 pb-3 border-b border-opacity-30 border-current">
                                      📊 Available:{' '}
                                      <span className="font-semibold">{material.quantity_available}</span> units
                                    </div>
                                  )}

                                  <div className="flex gap-2 pt-3 border-t border-opacity-30 border-current">
                                    <button
                                      onClick={() => updatePreference(material.id, 5, !pref?.selected)}
                                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                                        pref?.selected 
                                          ? msg.role === 'user' ? 'bg-green-500 text-white' : darkMode ? 'bg-green-500' : 'bg-green-600 text-white'
                                          : msg.role === 'user' ? 'bg-green-400 hover:bg-green-300' : darkMode ? 'bg-gray-500 hover:bg-green-400' : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                                      }`}
                                    >
                                      <Check className="w-4 h-4" />
                                      {pref?.selected ? 'Selected' : 'Select'}
                                    </button>
                                    <button
                                      onClick={() => updatePreference(material.id, (pref?.preference_score || 0) + 1, pref?.selected)}
                                      className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                                        msg.role === 'user' 
                                          ? 'bg-green-500 hover:bg-green-400' 
                                          : darkMode ? 'bg-red-900 hover:bg-red-800' : 'bg-red-100 text-red-600 hover:bg-red-200'
                                      }`}
                                    >
                                      <Heart className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className={`rounded-2xl px-6 py-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <div className="flex gap-2">
                          <div className={`w-2 h-2 rounded-full animate-bounce ${darkMode ? 'bg-gray-400' : 'bg-gray-400'}`}></div>
                          <div className={`w-2 h-2 rounded-full animate-bounce ${darkMode ? 'bg-gray-400' : 'bg-gray-400'}`} style={{ animationDelay: '0.1s' }}></div>
                          <div className={`w-2 h-2 rounded-full animate-bounce ${darkMode ? 'bg-gray-400' : 'bg-gray-400'}`} style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <div className={`border-t transition-colors duration-300 p-6 ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask about materials for this project..."
                      disabled={!selectedProject}
                      className={`flex-1 px-5 py-3 rounded-xl text-base transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-50 ${
                        darkMode
                          ? 'bg-gray-700 text-white placeholder-gray-400 border border-gray-600'
                          : 'bg-gray-100 text-gray-900 placeholder-gray-500 border border-gray-300'
                      }`}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || !selectedProject}
                      className="bg-green-600 text-white p-3 rounded-xl hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-300"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'selected' && (
              <div className={`w-full max-w-4xl rounded-2xl shadow-xl p-8 transition-colors duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Selected Materials
                </h2>

                {selectedMaterials.length === 0 ? (
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    No materials selected yet. Use the Chat tab to explore and select materials.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {selectedMaterials.map((material) => (
                      <div
                        key={material.id}
                        className={`p-4 rounded-xl flex flex-col gap-3 ${
                          darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-base">{material.name}</p>
                            <p className="text-xs opacity-75">{material.source}</p>
                            {material.source_building && (
                              <p className="text-xs font-semibold mt-1">
                                📦 From: {material.source_building}
                              </p>
                            )}
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              darkMode ? 'bg-gray-600 text-gray-100' : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {material.category}
                          </span>
                        </div>

                        <p className="text-sm opacity-90">{material.description}</p>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="w-4 h-4" />
                            <div>
                              <p className="opacity-75">CO₂</p>
                              <p className="font-semibold">{material.co2_reduction}%</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Recycle className="w-4 h-4" />
                            <div>
                              <p className="opacity-75">Recycle</p>
                              <p className="font-semibold">{material.recyclability}%</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            <span>{material.location}</span>
                          </div>
                          {typeof material.preference_score === 'number' && (
                            <span className="opacity-75">
                              Preference score: <span className="font-semibold">{material.preference_score}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() =>
                              updatePreference(material.id, material.preference_score || 0, false)
                            }
                            className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 text-sm font-semibold"
                          >
                            Unselect
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default App;