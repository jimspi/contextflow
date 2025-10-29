import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Debug() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/check-config')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error checking config:', err);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Head>
        <title>ContextFlow - Configuration Debug</title>
      </Head>
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Configuration Debug</h1>
          <p className="text-zinc-400 mb-8">Check your Supabase configuration status</p>

          {loading ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
              <p className="text-zinc-400">Loading configuration...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status Card */}
              <div className={`border-2 rounded-lg p-6 ${
                config?.configured
                  ? 'bg-green-900/20 border-green-500'
                  : 'bg-red-900/20 border-red-500'
              }`}>
                <h2 className="text-2xl font-bold mb-2">
                  {config?.configured ? '✅ Configuration OK' : '❌ Configuration Missing'}
                </h2>
                <p className="text-lg">
                  {config?.message}
                </p>
              </div>

              {/* Details Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Environment Variables</h3>

                <div className="space-y-4">
                  {/* NEXT_PUBLIC_SUPABASE_URL */}
                  <div className="border-l-2 border-blue-500 pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm bg-zinc-800 px-2 py-1 rounded">
                        NEXT_PUBLIC_SUPABASE_URL
                      </code>
                      {config?.details?.NEXT_PUBLIC_SUPABASE_URL?.present ? (
                        <span className="text-green-400 text-sm">✓ Present</span>
                      ) : (
                        <span className="text-red-400 text-sm">✗ Missing</span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-400 font-mono">
                      {config?.details?.NEXT_PUBLIC_SUPABASE_URL?.preview}
                    </p>
                  </div>

                  {/* NEXT_PUBLIC_SUPABASE_ANON_KEY */}
                  <div className="border-l-2 border-purple-500 pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm bg-zinc-800 px-2 py-1 rounded">
                        NEXT_PUBLIC_SUPABASE_ANON_KEY
                      </code>
                      {config?.details?.NEXT_PUBLIC_SUPABASE_ANON_KEY?.present ? (
                        <span className="text-green-400 text-sm">✓ Present</span>
                      ) : (
                        <span className="text-red-400 text-sm">✗ Missing</span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-400 font-mono">
                      {config?.details?.NEXT_PUBLIC_SUPABASE_ANON_KEY?.preview}
                    </p>
                  </div>
                </div>
              </div>

              {/* Troubleshooting Card */}
              {!config?.configured && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4">🔧 How to Fix</h3>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-yellow-400 mb-2">For Local Development:</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-300">
                        <li>Create a file named <code className="bg-zinc-800 px-1 rounded">.env.local</code> in your project root</li>
                        <li>Add your Supabase credentials:
                          <pre className="bg-zinc-800 p-3 rounded mt-2 text-xs overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here`}
                          </pre>
                        </li>
                        <li>Restart your development server: <code className="bg-zinc-800 px-1 rounded">npm run dev</code></li>
                      </ol>
                    </div>

                    <div>
                      <h4 className="font-semibold text-yellow-400 mb-2">For Vercel Deployment:</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-300">
                        <li>Go to your Vercel dashboard</li>
                        <li>Click on your project → Settings → Environment Variables</li>
                        <li>Add both variables for all environments (Production, Preview, Development)</li>
                        <li>Redeploy your application</li>
                      </ol>
                    </div>

                    <div className="bg-blue-900/20 border border-blue-800 rounded p-4 mt-4">
                      <p className="text-sm text-blue-300">
                        <strong>Need your Supabase credentials?</strong><br/>
                        Go to your Supabase project → Settings → API
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Instructions */}
              {config?.configured && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4">✨ Next Steps</h3>
                  <p className="text-zinc-300 mb-4">
                    Your Supabase configuration is correct! You can now:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm text-zinc-300">
                    <li>Go back to <a href="/" className="text-blue-400 hover:underline">the home page</a></li>
                    <li>Sign up for a new account</li>
                    <li>Start adding contexts and they will be saved to your database</li>
                  </ul>
                </div>
              )}

              {/* Back Button */}
              <div className="text-center">
                <a
                  href="/"
                  className="inline-block bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-zinc-200 transition-colors"
                >
                  ← Back to Home
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
