export interface PlaybookItem {
  id: string
  title: string
  issue: string
  guidance: string[]
  checklist?: string[]
  formula?: string
  isHighlighted?: boolean
}

export const playbookData: PlaybookItem[] = [
  {
    id: 'pb-1',
    title: 'Slide Design & Presentation Structure',
    issue: 'Slides are too dense, text-heavy, or visually fragmented.',
    guidance: [
      'Reduce text blocks and use concise bullets.',
      'Add visual anchors so listeners can track the narrative quickly.',
      'Bold key terms for scannability.',
      'Avoid low-contrast colors (especially yellow-on-light backgrounds). Projectors wash out colors.',
      'Split overloaded slides into sequence slides.',
    ],
    checklist: [
      '1 idea per slide',
      '5 or fewer bullets per slide',
      'High contrast text',
      'Visual hierarchy is obvious in 3 seconds',
      'Maximum 10 slides for 5 minutes',
    ],
  },
  {
    id: 'pb-2',
    title: 'Focus vs Feature Overload',
    issue: 'Teams try to present everything, so nothing stands out.',
    guidance: [
      'Prioritize 1-2 strongest differentiators.',
      'Trim "nice-to-have" features from the live narrative.',
      'Design the story around one core value proposition.',
      'In 1 minute of demo, you can show 2-3 screens. That\'s it.',
    ],
    formula: 'If a feature does not strengthen the main pitch in under 20 seconds, cut it.',
  },
  {
    id: 'pb-3',
    title: 'Benefits Before Technical Detail',
    issue: 'Technical explanations come before user value.',
    guidance: [
      'Lead with impact: what user pain is solved and what outcome improves.',
      'Follow with technical implementation only as proof.',
      'Frame with "benefit first, mechanism second."',
      '"I have an AI chatbot" is a feature. "You get diagnosed faster and skip the waiting line" is the benefit. Always lead with the benefit.',
    ],
    formula: 'Problem -> Benefit/Outcome -> Proof (feature/tech) -> Why this team wins',
  },
  {
    id: 'pb-4',
    title: 'Competitor Analysis Gaps',
    issue: 'Competitor analysis is missing or weak, despite judging requirements.',
    guidance: [
      'Include a direct comparison table.',
      'Show where alternatives fail and where your solution wins.',
      'Use evidence-driven claims (speed, cost, accessibility, UX, accuracy).',
      'Judges want to see you know the landscape, not just your own product.',
    ],
    checklist: [
      'Existing Option column',
      'Limitation column',
      'Your Advantage column',
      'Evidence/Metric column',
    ],
  },
  {
    id: 'pb-5',
    title: 'Demo Strategy & Timing',
    issue: 'Demos overrun or fail due to unstable live dependencies.',
    guidance: [
      'Always prepare a fallback demo path.',
      'Use prerecorded flow where generation/runtime is unpredictable.',
      'Timebox each segment to fit judging windows.',
      'A friend of mine had his entire live demo fail because the organizer clicked wrong things. He pulled out a pre-recorded video from his phone and still placed 2nd/3rd. Always have backup.',
      'If you can\'t get real data, fake data is perfectly fine. You\'re proving a concept.',
    ],
    checklist: [
      '1. Live happy path',
      '2. Cached/preloaded output',
      '3. Prerecorded proof clip',
      '4. Static screenshots + narrative',
    ],
  },
  {
    id: 'pb-6',
    title: 'Target Audience Specificity',
    issue: 'Audience is defined too broadly ("for everyone").',
    guidance: [
      'Define a primary persona clearly. If you target everyone, you target no one.',
      'Be specific on first beachhead segment. Example: "3rd year university students facing financial pressure" not "youth."',
      'Explain why this segment has urgency and adoption potential.',
      'The more specific your target, the easier it is for judges to understand the problem and relate to it.',
    ],
    checklist: [
      'Who exactly?',
      'What pain now?',
      'Why current alternatives fail?',
      'Why this solution is better now?',
    ],
  },
  {
    id: 'pb-7',
    title: '"Think Twice" Ideation',
    issue: 'First ideas are obvious and everyone has the same ones.',
    guidance: [
      'Your first idea is common sense. Your second idea is creative. Always think twice.',
      'Take your first idea, find its weakness, then branch out from there.',
      'Example: Budgeting app (obvious) -> Why don\'t people commit? -> Auto-track via bank notifications (creative).',
      'Do NOT use ChatGPT for ideas. Everyone gets the same output.',
      'Use AI to refine and validate your idea, but the core must come from you.',
    ],
    checklist: [
      'Write down your first idea',
      'Find its biggest weakness',
      'Generate 2-3 alternatives from that weakness',
      'Pick the most unique and defensible one',
    ],
  },
  {
    id: 'pb-8',
    title: 'Rubric-First Building',
    issue: 'Teams build what they want instead of what judges are grading.',
    guidance: [
      'Study the rubric religiously. This is the most important document in any hackathon.',
      'Don\'t just look at the top score. Look at level 4 AND level 5 to understand the threshold.',
      'Every slide should contribute to your rubric score. If it doesn\'t score points, cut it.',
      'Play the game: build for what they\'re grading, not for what you want to build.',
      'If you think the rubric is wrong and you can do better, you\'re building for yourself, not the hackathon.',
    ],
    checklist: [
      'Read rubric before ideation',
      'Check every slide against rubric criteria',
      'Identify level 4 vs 5 threshold',
      'Ask mentors: are we hitting the top scores?',
    ],
  },
  {
    id: 'pb-9',
    title: 'Pitch Timing & Structure',
    issue: 'Teams run out of time or spend too long on the wrong things.',
    guidance: [
      '5 minutes = 3 minutes slides + 2 minutes demo (demo realistically 1-1.5 min).',
      'Maximum 10 slides. More than that and you\'re speed-running.',
      'Allocate time in 30-second to 1-minute chunks per section.',
      'Put solution screenshots at the END of slides as fallback.',
      'High contrast on all slides. Projectors wash out colors.',
    ],
    checklist: [
      'Slides under 3 minutes',
      'Demo under 2 minutes',
      'Max 10 slides total',
      'Solution screenshots as final slide fallback',
      'High contrast for projector visibility',
    ],
  },
  {
    id: 'pb-10',
    title: 'Memorability & Hooks',
    issue: 'Judges see 30+ projects and forget yours instantly.',
    guidance: [
      'Your first 10-30 seconds are critical. Make judges curious or lose them.',
      'Pitch like you\'re explaining a hobby to a friend. Be passionate, be human.',
      'Don\'t read from a script. No one cares about a flat, robotic pitch.',
      'Find a way to stand out. Ask the crowd questions. Create a moment they remember.',
      'Open with a hook: a surprising stat, a provocative question, or a bold claim that makes them want to know more.',
    ],
    checklist: [
      'Opening hook planned (10-30 sec)',
      'Pitch is conversational, not scripted',
      'One memorable moment planned',
      'Energy and passion throughout',
    ],
  },
  {
    id: 'pb-11',
    title: 'Q&A Engineering',
    issue: 'Teams get unexpected questions or waste Q&A time on unimportant topics.',
    guidance: [
      'Prepare 10 questions you think judges will ask.',
      'Open questions in your presentation to make judges curious, then close them.',
      'You can intentionally leave the business side for Q&A so you spend pitch time on your core.',
      'Some judges ask random questions because they don\'t know what to ask. Guide them by opening questions you want them to ask.',
      'Take time on each answer to demonstrate depth.',
    ],
    checklist: [
      '10 anticipated questions prepared',
      'Open questions in slides -> close them',
      'Engineer business/market question for Q&A',
      'Concise but thorough answers',
    ],
  },
]

export const mostFrequentPattern = {
  title: 'Most Frequent Pattern',
  description: 'The most repeated coaching theme across all mentorship sessions:',
  insight: 'Slide simplification + narrative focus reduction.',
  practice: [
    'Simplify visual communication: remove clutter, improve contrast, split overloaded slides.',
    'Narrow to a few high-impact differentiators: cut everything that doesn\'t directly strengthen the pitch.',
  ],
}

export const pitchPolishFramework = [
  'Simplify deck (remove clutter, improve contrast, split overloaded slides)',
  'Cut feature list to top 1-2 differentiators',
  'Reorder narrative to benefit-first flow',
  'Add competitor table with explicit advantages',
  'Run timed demo with fallback options ready',
  'Tighten persona and opening problem statement',
  'Check every slide against the judging rubric',
  'Prepare 10 anticipated Q&A questions with answers',
]
