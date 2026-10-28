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

export const techStack = {
  frontend: {
    title: 'Frontend',
    items: [
      { name: 'React', description: 'The standard for building web apps. Used by hundreds of millions. Good enough for anything.' },
      { name: 'Tailwind CSS', description: 'Style library that lets you write CSS in plain English. No separate CSS files needed.' },
    ],
  },
  backend: {
    title: 'Backend',
    items: [
      { name: 'Express.js', description: 'Simple, minimal Node.js backend. The default choice.' },
      { name: 'FastAPI', description: 'Python backend framework. Fast and straightforward.' },
    ],
  },
  database: {
    title: 'Database',
    items: [
      { name: 'Supabase', description: 'Easiest for most people. Free tier, instant setup, PostgreSQL-based.' },
      { name: 'Convex', description: 'Modern real-time database. Great for hackathon demos.' },
      { name: 'Neon', description: 'Serverless PostgreSQL. Modern and developer-friendly.' },
    ],
  },
  deployment: {
    title: 'Deployment',
    items: [
      { name: 'Vercel', description: 'One command deploy. Free. The fastest way to make your app accessible to anyone.' },
    ],
  },
  ai: {
    title: 'AI / APIs',
    items: [
      { name: 'Gemini API', description: 'Free tier with generous limits. Use for AI features in your project.' },
    ],
  },
}

export const aiTools = [
  { name: 'Google AI Studio', description: 'Access Gemini models directly. Free, generous limits, and the fastest way to experiment with AI.', url: 'https://aistudio.google.com' },
  { name: 'Antigravity', description: 'AI-powered app builder. Go from idea to deployed app in minutes.', url: 'https://antigravity.com' },
  { name: 'Codex', description: 'OpenAI\'s coding agent. Describe what you want, it writes the code.', url: 'https://openai.com/codex' },
  { name: 'Cursor', description: 'AI code editor. Write code with AI assistance built in.', url: 'https://cursor.sh' },
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
