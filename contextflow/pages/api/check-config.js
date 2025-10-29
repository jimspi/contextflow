// API endpoint to check Supabase configuration
export default function handler(req, res) {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const urlValue = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...'
    : 'NOT SET';

  const keyValue = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...'
    : 'NOT SET';

  res.status(200).json({
    configured: hasUrl && hasKey,
    details: {
      NEXT_PUBLIC_SUPABASE_URL: {
        present: hasUrl,
        preview: urlValue
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        present: hasKey,
        preview: keyValue
      }
    },
    message: hasUrl && hasKey
      ? 'Supabase is configured correctly!'
      : 'Supabase environment variables are missing. Please add them to your .env.local file or Vercel environment variables.'
  });
}
