// backend/src/routes/comparison.routes.js
const express = require('express');
const router = express.Router();
const Property = require('../models/Property');

// Session-based comparison storage
// In production, consider using Redis or a database for persistence

// Get current comparison list from session
router.get('/', (req, res) => {
  try {
    const comparisonList = req.session.comparisonList || [];
    
    res.json({
      success: true,
      data: {
        properties: comparisonList,
        count: comparisonList.length,
        maxItems: 3
      }
    });
  } catch (error) {
    console.error('Error fetching comparison list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comparison list'
    });
  }
});

// Add property to comparison
router.post('/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    // Initialize session comparison list if not exists
    if (!req.session.comparisonList) {
      req.session.comparisonList = [];
    }
    
    // Check if already in comparison
    const existingIndex = req.session.comparisonList.findIndex(
      p => p._id.toString() === propertyId
    );
    
    if (existingIndex !== -1) {
      return res.status(400).json({
        success: false,
        error: 'Property already in comparison list'
      });
    }
    
    // Check max items limit
    if (req.session.comparisonList.length >= 3) {
      return res.status(400).json({
        success: false,
        error: 'Maximum comparison items reached (3)'
      });
    }
    
    // Fetch property details
    const property = await Property.findById(propertyId)
      .select('title location price bedrooms bathrooms area type image description owner');
    
    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }
    
    // Add to comparison list
    req.session.comparisonList.push(property);
    
    res.json({
      success: true,
      data: {
        properties: req.session.comparisonList,
        count: req.session.comparisonList.length,
        message: 'Property added to comparison'
      }
    });
  } catch (error) {
    console.error('Error adding to comparison:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add property to comparison'
    });
  }
});

// Remove property from comparison
router.delete('/:propertyId', (req, res) => {
  try {
    const { propertyId } = req.params;
    
    if (!req.session.comparisonList) {
      req.session.comparisonList = [];
    }
    
    // Remove property from list
    const initialLength = req.session.comparisonList.length;
    req.session.comparisonList = req.session.comparisonList.filter(
      p => p._id.toString() !== propertyId
    );
    
    if (req.session.comparisonList.length === initialLength) {
      return res.status(404).json({
        success: false,
        error: 'Property not found in comparison list'
      });
    }
    
    res.json({
      success: true,
      data: {
        properties: req.session.comparisonList,
        count: req.session.comparisonList.length,
        message: 'Property removed from comparison'
      }
    });
  } catch (error) {
    console.error('Error removing from comparison:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove property from comparison'
    });
  }
});

// Clear comparison list
router.delete('/', (req, res) => {
  try {
    req.session.comparisonList = [];
    
    res.json({
      success: true,
      data: {
        properties: [],
        count: 0,
        message: 'Comparison list cleared'
      }
    });
  } catch (error) {
    console.error('Error clearing comparison list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear comparison list'
    });
  }
});

// Get detailed comparison data for selected properties
router.post('/details', async (req, res) => {
  try {
    const { propertyIds } = req.body;
    
    if (!propertyIds || !Array.isArray(propertyIds)) {
      return res.status(400).json({
        success: false,
        error: 'Property IDs array is required'
      });
    }
    
    if (propertyIds.length > 3) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 3 properties allowed for comparison'
      });
    }
    
    // Fetch detailed property information
    const properties = await Property.find({
      _id: { $in: propertyIds }
    }).populate('owner', 'fullName email phone role profileImage');
    
    // Format comparison data
    const comparisonData = {
      properties: properties,
      features: {
        price: properties.map(p => p.price),
        bedrooms: properties.map(p => p.bedrooms),
        bathrooms: properties.map(p => p.bathrooms),
        area: properties.map(p => p.area),
        type: properties.map(p => p.type),
        location: properties.map(p => p.location)
      },
      count: properties.length
    };
    
    res.json({
      success: true,
      data: comparisonData
    });
  } catch (error) {
    console.error('Error fetching comparison details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comparison details'
    });
  }
});

// Generate shareable URL for comparison
router.post('/share', async (req, res) => {
  try {
    const { propertyIds } = req.body;
    
    if (!propertyIds || typeof propertyIds !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Property IDs are required as a comma-separated string'
      });
    }
    
    // Generate a short code for the comparison
    const shortCode = generateShortCode();
    
    // Store the comparison in session or database
    // In production, you'd want to store this in a database
    if (!global.sharedComparisons) {
      global.sharedComparisons = {};
    }
    
    global.sharedComparisons[shortCode] = {
      propertyIds: propertyIds.split(','),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
    
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const shortUrl = `${baseUrl}/compare/${shortCode}`;
    
    res.json({
      success: true,
      data: {
        shortUrl,
        shortCode,
        expiresIn: '7 days'
      }
    });
  } catch (error) {
    console.error('Error generating share URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate share URL'
    });
  }
});

// Get shared comparison by code
router.get('/shared/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!global.sharedComparisons || !global.sharedComparisons[code]) {
      return res.status(404).json({
        success: false,
        error: 'Shared comparison not found or expired'
      });
    }
    
    const sharedComparison = global.sharedComparisons[code];
    
    // Check if expired
    if (new Date() > new Date(sharedComparison.expiresAt)) {
      delete global.sharedComparisons[code];
      return res.status(404).json({
        success: false,
        error: 'Shared comparison has expired'
      });
    }
    
    // Fetch properties
    const properties = await Property.find({
      _id: { $in: sharedComparison.propertyIds }
    });
    
    res.json({
      success: true,
      data: {
        properties,
        createdAt: sharedComparison.createdAt,
        expiresAt: sharedComparison.expiresAt
      }
    });
  } catch (error) {
    console.error('Error fetching shared comparison:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shared comparison'
    });
  }
});

// Helper function to generate short code
function generateShortCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

module.exports = router;