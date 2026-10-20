
const SUPABASE_URL = "https://odvlfsasfwaqrmqmgbab.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fdC87mXLOxU1ra-6SeQJIw_vlx32pV8";

window.tbSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);
