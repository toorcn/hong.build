export interface ResourceLink {
  title: string
  url: string
  description: string
  category: 'learn' | 'git' | 'hackathons' | 'pitch' | 'stack' | 'ai-tools'
}

export const resources: ResourceLink[] = [
  {
    title: 'The Odin Project',
    url: 'https://www.theodinproject.com/',
    description: 'Learn web development by building real projects. Free, comprehensive, and project-based.',
    category: 'learn',
  },
  {
    title: 'Roadmap.sh',
    url: 'https://roadmap.sh/',
    description: 'Visual roadmaps for every tech skill. See what to learn, in what order, and why.',
    category: 'learn',
  },
  {
    title: 'Git & GitHub Roadmap',
    url: 'https://roadmap.sh/git-github',
    description: 'Step-by-step guide to understanding Git version control and GitHub collaboration.',
    category: 'git',
  },
  {
    title: 'Git Guide',
    url: 'https://rogerdudler.github.io/git-guide/',
    description: 'A simple, practical guide to Git basics. Just the commands you actually need.',
    category: 'git',
  },
  {
    title: 'Luma (Kuala Lumpur)',
    url: 'https://luma.com/kuala-lumpur',
    description: 'Find tech events and hackathons happening in KL.',
    category: 'hackathons',
  },
  {
    title: 'Pitch Reference',
    url: 'https://youtube.com/shorts/6fHoN6MR6MI?si=XknrGqiNkNUdlAcv',
    description: 'A quick reference for how to sound confident and natural when pitching.',
    category: 'pitch',
  },
]

export interface StackItem {
  name: string
  description: string
  /** The tool's home, linked from its name. */
  url?: string
  /** Where to go next: docs, a getting-started page, the page that gets you a key. */
  links?: { label: string; url: string }[]
}

export const techStack: Record<string, { title: string; items: StackItem[] }> = {
  frontend: {
    title: 'Frontend',
    items: [
      { name: 'React', url: 'https://react.dev', description: 'The standard for building web apps. Used by hundreds of millions. Good enough for anything.', links: [{ label: 'Learn React', url: 'https://react.dev/learn' }] },
      { name: 'Next.js', url: 'https://nextjs.org', description: 'React with routing, API routes and deployment built in. Pick it when you want a full web app in one project instead of wiring pieces together.', links: [{ label: 'Get started', url: 'https://nextjs.org/learn' }] },
      { name: 'React Native', url: 'https://reactnative.dev', description: 'For mobile app builders. Write React, ship to iOS and Android from one codebase. Use Expo so you can test on your own phone in minutes, with no Xcode or Android Studio setup.', links: [{ label: 'Expo: first app', url: 'https://docs.expo.dev/get-started/set-up-your-environment/' }] },
      { name: 'PWA (add-on)', description: 'Not sure you can ship a native app in 24 hours? Make your Next.js site a PWA instead: it installs from the browser to the phone home screen, works offline, and needs no App Store review. Judges can open it from a QR code, and you only maintain one codebase.', links: [{ label: 'Next.js PWA guide', url: 'https://nextjs.org/docs/app/guides/progressive-web-apps' }, { label: 'What is a PWA', url: 'https://web.dev/learn/pwa' }] },
      { name: 'Tailwind CSS', url: 'https://tailwindcss.com', description: 'Style library that lets you write CSS in plain English. No separate CSS files needed.', links: [{ label: 'Docs', url: 'https://tailwindcss.com/docs' }] },
    ],
  },
  backend: {
    title: 'Backend',
    items: [
      { name: 'Express.js', url: 'https://expressjs.com', description: 'Simple, minimal Node.js backend. The default choice.', links: [{ label: 'Hello world', url: 'https://expressjs.com/en/starter/hello-world.html' }] },
      { name: 'FastAPI', url: 'https://fastapi.tiangolo.com', description: 'Python backend framework. Fast and straightforward.', links: [{ label: 'Tutorial', url: 'https://fastapi.tiangolo.com/tutorial/' }] },
    ],
  },
  database: {
    title: 'Database',
    items: [
      { name: 'Supabase', url: 'https://supabase.com', description: 'Easiest for most people. Free tier, instant setup, PostgreSQL-based.', links: [{ label: 'Quickstarts', url: 'https://supabase.com/docs/guides/getting-started' }] },
      { name: 'Convex', url: 'https://convex.dev', description: 'Modern real-time database. Great for hackathon demos.', links: [{ label: 'Quickstart', url: 'https://docs.convex.dev/quickstart/react' }] },
      { name: 'Neon', url: 'https://neon.tech', description: 'Serverless PostgreSQL. Modern and developer-friendly.', links: [{ label: 'Get started', url: 'https://neon.tech/docs/get-started-with-neon/signing-up' }] },
    ],
  },
  deployment: {
    title: 'Deployment',
    items: [
      { name: 'Vercel', url: 'https://vercel.com', description: 'One command deploy. Free. The fastest way to make your app accessible to anyone.', links: [{ label: 'Deploy a Next.js app', url: 'https://vercel.com/docs/frameworks/nextjs' }] },
      { name: 'Cloudflare', url: 'https://www.cloudflare.com/developer-platform/', description: 'Generous free tier: static sites and a large amount of serverless traffic cost nothing, with a free database (D1) and file storage (R2) alongside. Deploy with one wrangler command, and your demo stays fast for judges anywhere. This site runs on it.', links: [{ label: 'Deploy static assets', url: 'https://developers.cloudflare.com/workers/static-assets/' }, { label: 'D1 database', url: 'https://developers.cloudflare.com/d1/' }, { label: 'R2 storage', url: 'https://developers.cloudflare.com/r2/' }] },
    ],
  },
  ai: {
    title: 'AI / APIs',
    items: [
      { name: 'Gemini API', url: 'https://ai.google.dev/gemini-api/docs', description: 'Free tier with generous limits. Use for AI features in your project.', links: [{ label: 'Get a free key', url: 'https://aistudio.google.com/apikey' }] },
      { name: 'ILMU', url: 'https://console.ilmu.ai', description: 'A Malaysian-built model API, with keys and usage on its own console at console.ilmu.ai. Worth trying when your project serves Malaysian users or needs Bahasa Malaysia.', links: [{ label: 'Open the console', url: 'https://console.ilmu.ai' }] },
      { name: 'OpenRouter free models', url: 'https://openrouter.ai/models?q=free', description: 'One API key for many models, and plenty of them are free. Filter for the free ones to build and demo at no cost. They are rate-limited, so keep a second model ready as a backup before you go on stage.', links: [{ label: 'Browse free models', url: 'https://openrouter.ai/models?q=free' }, { label: 'Quickstart', url: 'https://openrouter.ai/docs/quickstart' }] },
    ],
  },
}

export const aiTools: { name: string; description: string; url: string; tag?: string }[] = [
  { name: 'Google AI Studio', description: 'Access Gemini models directly. Free, generous limits, and the fastest way to experiment with AI.', url: 'https://aistudio.google.com' },
  { name: 'Antigravity', description: 'AI-powered app builder. Go from idea to deployed app in minutes.', url: 'https://antigravity.com' },
  { name: 'Codex', description: 'OpenAI\'s coding agent. Describe what you want, it writes the code.', url: 'https://openai.com/codex' },
  { name: 'Cursor', description: 'AI code editor. Write code with AI assistance built in.', url: 'https://cursor.sh' },
  { name: 'Claude Code', description: 'A coding agent that lives in your terminal. It reads your whole project, edits files and runs commands while you describe what you want.', url: 'https://claude.com/product/claude-code', tag: 'beyond the editor' },
  { name: 'Devin', description: 'An autonomous AI software engineer that works in the cloud. Hand it a task, let it run on its own, and review what it comes back with.', url: 'https://devin.ai', tag: 'beyond the editor' },
  { name: 'OpenCode', description: 'An open-source coding agent for the terminal that works with many model providers, so you can point it at a free model while you learn.', url: 'https://opencode.ai', tag: 'beyond the editor' },
]

export const communityLinks = {
  aiHackerdorm: {
    title: 'AI Hackerdorm',
    description: 'Malaysia\'s first Student AI Builder community. 700+ members across 19 universities, with 4 university chapters. Emphasis on peer sharing, builder culture, and leading students at tech and AI events in KL and Southeast Asia.',
    url: 'https://chat.whatsapp.com/C0wtRulIyxiCJgrrRHMC2I',
    stats: '700+ members across 19 universities, 4 university chapters',
  },
  linkedin: {
    title: 'Hong Bing on LinkedIn',
    description: 'Follow for hackathon insights, AI builder content, and tech community updates.',
    url: 'https://linkedin.com/in/hong-bing',
  },
  feedback: {
    title: 'Share Your Feedback',
    description: 'Help improve future talks. Only 3 questions, would be so grateful to hear from you.',
    url: 'https://forms.gle/RnbQCBBzzDY4isDi7',
  },
}
