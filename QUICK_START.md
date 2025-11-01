# safeHER - Quick Start Guide

## 🚀 Your App is Connected!

Your safeHER app is now configured to use **your own Supabase database**:
- **Project URL**: https://bjqdwnnjqxpmrnuhbszs.supabase.co
- **Status**: ✅ Configured and ready

## ⚠️ IMPORTANT: Database Setup Required

Your database needs to be set up with tables and data. **This is a one-time setup.**

### Step 1: Set Up Your Database (5 minutes)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/bjqdwnnjqxpmrnuhbszs

2. **Open SQL Editor**
   - Click **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Run Setup Script**
   - Open the file `SUPABASE_SETUP.md` in this project
   - Copy the entire SQL script (starts with `CREATE TABLE...`)
   - Paste it into the SQL Editor
   - Click **Run** (or press Ctrl+Enter)

4. **Verify Success**
   - You should see "Setup complete!" at the bottom
   - You should see 6 tables created
   - You should see 10 safe zones added

### Step 2: Start the App

```bash
# The dev server will pick up the new database configuration
# Just refresh your browser if it's already running
```

## 📱 Features Available

Once database is set up, you can use:

### ✅ Core Features
- **SOS Alert** - One-tap emergency button
- **Live Location Sharing** - Share location with contacts
- **Emergency Contacts** - Add, edit, manage contacts
- **Fake Call** - Simulate incoming call
- **Profile Management** - Update profile and picture

### ✅ Safe Routing (New!)
- **Route Planning** - Find safest routes between locations
- **Location Search** - Autocomplete address search
- **Safety Scoring** - Routes scored 0-100 for safety
- **Unsafe Zones** - Visual warnings for dangerous areas
- **Multiple Routes** - Compare up to 3 alternative routes
- **Safe Zones Map** - View police stations, hospitals, safe houses

### ✅ Community Features
- **Report Incidents** - Submit safety reports
- **View Reports** - See community-reported incidents
- **Safe Zones** - Find nearby help centers

## 🔑 API Keys Configured

Both API keys are already set up in your `.env` file:

✅ **Supabase** (Your own database)
- URL: https://bjqdwnnjqxpmrnuhbszs.supabase.co
- Anon Key: Configured

✅ **OpenRouteService** (For routing)
- API Key: Configured
- Limit: 2,000 requests/day (free tier)

## 📖 Documentation Files

- **SUPABASE_SETUP.md** - Database setup instructions (SQL script)
- **ROUTING_SETUP.md** - Safe routing feature documentation
- **README.md** - Main project documentation

## 🆘 Troubleshooting

### "relation does not exist" error
→ Run the database setup SQL script from SUPABASE_SETUP.md

### Can't sign up or sign in
→ Make sure database setup is complete

### Routes not calculating
→ Check that OpenRouteService API key is valid (it's already set)

### No safe zones showing on map
→ Run the seed data part of the SQL script

## 🎯 Next Steps

1. ✅ Database is connected to your Supabase account
2. ⏳ Run the SQL setup script (one-time, 2 minutes)
3. ✅ Start using the app!

## 📊 Your Data

All data is stored in **your own Supabase account**:
- User profiles and authentication
- Emergency contacts
- SOS alerts and location shares
- Community reports
- Safe zones

You have full control and can view/manage everything in your Supabase dashboard.

## 🌟 Demo Account

After running the SQL setup:
1. Create a new account (Sign Up)
2. Add some emergency contacts
3. Try the Safe Routing feature
4. Test the SOS button
5. Share your location

Everything will be stored in your database!
