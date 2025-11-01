# Safe Routing Setup Guide

## OpenRouteService API Key

The Safe Routing feature uses OpenRouteService (ORS) for route calculations. Follow these steps to get your API key:

### 1. Sign Up for OpenRouteService

1. Visit [https://openrouteservice.org/](https://openrouteservice.org/)
2. Click on "Sign Up" (top right)
3. Create a free account using your email
4. Verify your email address

### 2. Generate API Key

1. Log in to your OpenRouteService account
2. Go to your Dashboard: [https://openrouteservice.org/dev/#/home](https://openrouteservice.org/dev/#/home)
3. Click on "Request a Token" or navigate to the "Tokens" section
4. Create a new token:
   - Give it a name (e.g., "safeHER App")
   - Select the services you need (at minimum: "Directions")
   - Click "Create Token"
5. Copy your API key

### 3. Add API Key to Project

The API key has already been added to your `.env` file:

```env
VITE_ORS_API_KEY=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjExOTUyZTQ3ODVhZDRhODE4NDJkODNhNDJkNjU0Y2U5IiwiaCI6Im11cm11cjY0In0=
```

The app is ready to use! Just restart your development server if it's already running.

### 4. Free Tier Limits

The free OpenRouteService tier includes:
- **2,000 requests per day**
- **40 requests per minute**
- Access to all routing profiles

This is sufficient for testing and small-scale deployments.

## Features

### Safe Route Finder

The Safe Routing feature provides:

1. **Location Search**
   - Autocomplete suggestions using OpenStreetMap Nominatim API
   - Type-ahead search (min 3 characters)
   - "Use Current Location" button for starting point
   - Manual text entry for locations
   - Displays full address in suggestions

2. **Route Calculation**
   - Multiple route alternatives (up to 3)
   - Walking profile optimized for pedestrians
   - Real-time route calculation

3. **Safety Scoring**
   - Calculates proximity to unsafe zones
   - Scores routes from 0-100 (higher is safer)
   - Color-coded routes:
     - **Green**: Safest route (80-100 score)
     - **Gray**: Alternative routes
     - **Red**: Unsafe routes (<40 score)

4. **Unsafe Zones**
   - Mock unsafe zones displayed as colored circles
   - Severity levels: Low (yellow), Medium (orange), High (red)
   - Click zones for details

5. **Route Modes**
   - **Safest Route**: Prioritizes safety score
   - **Shortest Route**: Prioritizes distance

6. **Route Information**
   - Distance in kilometers/meters
   - Estimated walking time
   - Safety score and rating

7. **Map Features**
   - OpenStreetMap base layer
   - Start (green) and end (red) markers
   - Safe zones (police, hospitals, safe houses)
   - Unsafe zone overlays
   - Interactive route comparison

## How Safety Scoring Works

The safety score algorithm:

1. Analyzes each point along the route
2. Calculates distance to all unsafe zones
3. Applies severity weights:
   - High severity: 3x impact
   - Medium severity: 2x impact
   - Low severity: 1x impact
4. Considers proximity factor (closer = more dangerous)
5. Normalizes to 0-100 scale

## Customization

### Adding Real Unsafe Zones

Replace the mock data in `src/services/routing.ts` with real data from your database:

```typescript
// Fetch from database instead of using UNSAFE_ZONES constant
const { data } = await supabase
  .from('community_reports')
  .select('*')
  .eq('severity', 'high');
```

### Adjusting Route Parameters

In `src/services/routing.ts`, modify the `getRoutes` method:

```typescript
profile: 'foot-walking', // Change to 'driving-car', 'cycling-regular', etc.
alternative_routes: {
  target_count: 3,      // Number of alternatives (1-3)
  weight_factor: 1.4,   // Route diversity (1.4-2.0)
  share_factor: 0.6,    // Shared segments (0.1-0.9)
}
```

## Troubleshooting

### "Failed to fetch routes" Error

1. Check your API key is correct in `.env`
2. Verify you haven't exceeded rate limits
3. Ensure locations are valid and reachable
4. Check browser console for detailed errors

### No Autocomplete Suggestions

1. Type at least 3 characters
2. Ensure you have an internet connection
3. Try more specific location names

### Routes Not Appearing

1. Verify both From and To locations are selected
2. Check that locations are within walking distance
3. Look for error messages in the UI

## Additional Resources

- [OpenRouteService Documentation](https://openrouteservice.org/dev/#/api-docs)
- [ORS Directions API](https://openrouteservice.org/dev/#/api-docs/v2/directions/{profile}/post)
- [Leaflet Documentation](https://leafletjs.com/)
- [React Leaflet Documentation](https://react-leaflet.js.org/)
