// coverLetterTemplates.js
// 20 structured cover letter templates for VitaePro
// Each template follows the required structure and is exported as an array.
// To add more templates: copy an existing object, update `id` (use vitaepro_template_XX),
// `name`, `industry`, `careerLevel`, `tone`, and `contentSkeleton` placeholders.

const templates = [
  {
    id: 'vitaepro_template_01',
    name: 'Classic Professional',
    themeId: 'formal-classic',
    description: 'A timeless, conservative layout focused on clear structure and formal tone.',
    industry: ['Corporate / Office', 'Government', 'Education'],
    careerLevel: ['Entry','Mid','Senior'],
    tone: ['Professional','Formal'],
    layoutStyle: 'Two-column header with left contact block',
    imagery: {
      type: 'photo',
      previewImage: 'https://source.unsplash.com/featured/?corporate,office',
      theme: 'Corporate office'
    },
    supportedTags: [
      'Introduction','Why this company','Experience','Skills','Achievements / Awards','Motivation / Why this role','Closing'
    ],
    contentSkeleton: [
      { tag: 'Introduction', placeholder: 'Briefly introduce yourself and state the role you are applying for.' },
      { tag: 'Why this company', placeholder: 'Explain why you are drawn to this company and its mission.' },
      { tag: 'Experience', placeholder: 'Summarise relevant experience with specific responsibilities.' },
      { tag: 'Skills', placeholder: 'Highlight key skills that make you a strong fit for the role.' },
      { tag: 'Achievements / Awards', placeholder: 'Mention a notable achievement or measurable outcome.' },
      { tag: 'Motivation / Why this role', placeholder: 'Describe your motivation and how this role aligns with your goals.' },
      { tag: 'Closing', placeholder: 'Close politely and include a call to action for next steps.' }
    ]
  },

  {
    id: 'vitaepro_template_02',
    name: 'Modern Minimalist',
    themeId: 'modern-centered',
    description: 'Clean, airy layout with generous white space and a modern sans-serif look.',
    industry: ['Technology / IT','Creative / Marketing','Remote / Digital'],
    careerLevel: ['Entry','Mid','Senior'],
    tone: ['Modern','Confident'],
    layoutStyle: 'Single-column centered header, subtle accent bar',
    imagery: {
      type: 'abstract',
      previewImage: 'https://source.unsplash.com/featured/?minimal,design',
      theme: 'Minimal shapes and soft color'
    },
    supportedTags: ['Introduction','Why this company','Experience','Skills','Achievements / Awards','Motivation / Why this role','Closing'],
    contentSkeleton: [
      { tag: 'Introduction', placeholder: 'One-line opener that states your role interest and concise background.' },
      { tag: 'Why this company', placeholder: 'A short note on the company culture or product you admire.' },
      { tag: 'Experience', placeholder: 'A focused example of relevant work or a project outcome.' },
      { tag: 'Skills', placeholder: 'Top 2–3 technical or transferable skills with context.' },
      { tag: 'Achievements / Awards', placeholder: 'Quantified result or award that demonstrates impact.' },
      { tag: 'Motivation / Why this role', placeholder: 'What excites you about this specific position.' },
      { tag: 'Closing', placeholder: 'Polite sign-off and request for interview opportunity.' }
    ]
  },

  {
    id: 'vitaepro_template_03',
    name: 'Executive Impact',
    themeId: 'formal-classic',
    description: 'A premium, executive-focused template emphasising leadership outcomes.',
    industry: ['Corporate / Office','Executive / Leadership','Government'],
    careerLevel: ['Senior','Executive'],
    tone: ['Professional','Bold','Executive'],
    layoutStyle: 'Right-aligned header with executive summary panel',
    imagery: {
      type: 'minimal',
      previewImage: 'https://source.unsplash.com/featured/?executive,leadership',
      theme: 'Executive minimal'
    },
    supportedTags: ['Introduction','Why this company','Experience','Skills','Achievements / Awards','Motivation / Why this role','Closing'],
    contentSkeleton: [
      { tag: 'Introduction', placeholder: 'High-level statement of leadership experience and the role sought.' },
      { tag: 'Why this company', placeholder: 'Strategic reasons you can drive impact at this organisation.' },
      { tag: 'Experience', placeholder: 'Summary of leadership roles, scale managed, and strategic outcomes.' },
      { tag: 'Skills', placeholder: 'C-suite level skills: strategy, stakeholder management, P&L, etc.' },
      { tag: 'Achievements / Awards', placeholder: 'Major transformation or measurable leadership wins.' },
      { tag: 'Motivation / Why this role', placeholder: 'How you will deliver value in the executive remit.' },
      { tag: 'Closing', placeholder: 'Confident close referencing availability for a strategic discussion.' }
    ]
  },

  {
    id: 'vitaepro_template_04',
    name: 'Tech Innovator',
    themeId: 'modern-centered',
    description: 'A contemporary template for engineers and product professionals focused on innovation.',
    industry: ['Technology / IT'],
    careerLevel: ['Entry','Mid','Senior'],
    tone: ['Confident','Modern'],
    layoutStyle: 'Compact header with skill badge area',
    imagery: {
      type: 'photo',
      previewImage: 'https://source.unsplash.com/featured/?technology,developer',
      theme: 'Digital workspace'
    },
    supportedTags: ['Introduction','Why this company','Experience','Skills','Achievements / Awards','Motivation / Why this role','Closing'],
    contentSkeleton: [
      { tag: 'Introduction', placeholder: 'State your role, specialisation, and one-line technical focus.' },
      { tag: 'Why this company', placeholder: 'Product or technical challenge you are excited to work on.' },
      { tag: 'Experience', placeholder: 'Key projects, tech stack used, and your contribution.' },
      { tag: 'Skills', placeholder: 'Core technical skills with level of proficiency.' },
      { tag: 'Achievements / Awards', placeholder: 'Notable project metrics or recognitions.' },
      { tag: 'Motivation / Why this role', placeholder: 'How this role fits your technical growth and impact.' },
      { tag: 'Closing', placeholder: 'Invite for a technical discussion and share contacts.' }
    ]
  },

  {
    id: 'vitaepro_template_05',
    name: 'Healthcare Caring',
    themeId: 'teal-sidebar',
    description: 'Warm, empathetic layout tailored for healthcare and support workers.',
    industry: ['Healthcare & Disability Support','Social Services'],
    careerLevel: ['Entry','Mid','Senior'],
    tone: ['Warm','Professional'],
    layoutStyle: 'Soft header with patient-focused accent',
    imagery: {
      type: 'photo',
      previewImage: 'https://source.unsplash.com/featured/?healthcare,nurse',
      theme: 'Healthcare environment'
    },
    supportedTags: ['Introduction','Why this company','Experience','Skills','Achievements / Awards','Motivation / Why this role','Closing'],
    contentSkeleton: [
      { tag: 'Introduction', placeholder: 'Introduce yourself and your caring philosophy briefly.' },
      { tag: 'Why this company', placeholder: 'Describe why the organisation’s approach to care resonates with you.' },
      { tag: 'Experience', placeholder: 'Relevant clinical or care experience and responsibilities.' },
      { tag: 'Skills', placeholder: 'Clinical skills, communication, and person-centred care strengths.' },
      { tag: 'Achievements / Awards', placeholder: 'Instances of positive patient outcomes or commendations.' },
      { tag: 'Motivation / Why this role', placeholder: 'Why you want to join in this particular support role.' },
      { tag: 'Closing', placeholder: 'Thank the reader and indicate availability for interview.' }
    ]
  },

  {
    id: 'vitaepro_template_06',
    name: 'Trades & Practical',
    themeId: 'standard',
    description: 'Robust, straightforward layout for hands-on trades and construction roles.',
    industry: ['Trades & Construction'],
    careerLevel: ['Entry','Mid','Senior'],
    tone: ['Professional','Direct'],
    layoutStyle: 'Bold headings, skills checklist area',
    imagery: {
      type: 'photo',
      previewImage: 'https://source.unsplash.com/featured/?construction,trades',
      theme: 'Trades / hands-on work'
    },
    supportedTags: ['Introduction','Why this company','Experience','Skills','Achievements / Awards','Motivation / Why this role','Closing'],
    contentSkeleton: [
      { tag: 'Introduction', placeholder: 'State your trade, licence/certifications, and years of experience.' },
      { tag: 'Why this company', placeholder: 'Practical reasons you want to work with this team or contractor.' },
      { tag: 'Experience', placeholder: 'Brief list of relevant jobs, responsibilities and tools used.' },
      { tag: 'Skills', placeholder: 'Key trade skills, safety certifications, and specialties.' },
      { tag: 'Achievements / Awards', placeholder: 'Major projects delivered on time or under budget.' },
      { tag: 'Motivation / Why this role', placeholder: 'Your practical goals and how you’ll contribute day-one.' },
      { tag: 'Closing', placeholder: 'Confirm readiness for site visits and next steps.' }
    ]
  },

  {
    id: 'vitaepro_template_07',
    name: 'Education & Learning',
    themeId: 'sidebar-profile',
    description: 'Structured, approachable template for teachers and education professionals.',
    industry: ['Education'],
    careerLevel: ['Entry','Mid','Senior'],
    tone: ['Warm','Professional'],
    layoutStyle: 'Left sidebar with qualifications summary',
    imagery: {
      type: 'photo',
      previewImage: 'https://source.unsplash.com/featured/?education,teacher',
      theme: 'Classroom / learning'
    },
    supportedTags: ['Introduction','Why this company','Experience','Skills','Achievements / Awards','Motivation / Why this role','Closing'],
    contentSkeleton: [
      { tag: 'Introduction', placeholder: 'Introduce your teaching background and the role you are applying for.' },
      { tag: 'Why this company', placeholder: 'School or program attributes that align with your teaching philosophy.' },
      { tag: 'Experience', placeholder: 'Curriculum experience, year levels taught, and class outcomes.' },
      { tag: 'Skills', placeholder: 'Classroom management, lesson planning and student engagement skills.' },
      { tag: 'Achievements / Awards', placeholder: 'Improvements in student performance or noteworthy programs.' },
      { tag: 'Motivation / Why this role', placeholder: 'Why the role fits your educational aims and strengths.' },
      { tag: 'Closing', placeholder: 'Invitation to discuss teaching approach and availability.' }
    ]
  },

  {
    id: 'vitaepro_template_08',
    name: 'Retail & Hospitality',
    themeId: 'standard',
    description: 'Friendly, customer-focused layout suitable for service industry roles.',
    industry: ['Retail & Hospitality'],
    careerLevel: ['Entry','Mid'],
    tone: ['Warm','Professional'],
    layoutStyle: 'Badge-style header with customer service highlights',
    imagery: {
      type: 'photo',
      previewImage: 'https://source.unsplash.com/featured/?retail,customer-service',
      theme: 'Service and hospitality'
    },
    supportedTags: ['Introduction','Why this company','Experience','Skills','Achievements / Awards','Motivation / Why this role','Closing'],
    contentSkeleton: [
      { tag: 'Introduction', placeholder: 'Quickly state your customer service background and role interest.' },
      { tag: 'Why this company', placeholder: 'Mention service values or guest experience you admire.' },
      { tag: 'Experience', placeholder: 'Relevant roles, shifts, or responsibilities in retail/hospitality.' },
      { tag: 'Skills', placeholder: 'Service, POS systems, teamwork, and problem-solving examples.' },
      { tag: 'Achievements / Awards', placeholder: 'Customer praise, sales targets met, or efficiency improvements.' },
      { tag: 'Motivation / Why this role', placeholder: 'What draws you to this brand or venue.' },
      { tag: 'Closing', placeholder: 'Polite close referencing availability and preferred contact.' }
    ]
  },

  {
    id: 'vitaepro_template_09',
    name: 'Creative Storyteller',
    themeId: 'modern-centered',
    description: 'Expressive layout for marketing, copywriting and creative roles that values narrative.',
    industry: ['Creative / Marketing','Media & Communications'],
    careerLevel: ['Entry','Mid','Senior'],
    tone: ['Warm','Modern','Bold'],
    layoutStyle: 'Visual header with pull-quote area',
    imagery: {
      type: 'photo',
      previewImage: 'https://source.unsplash.com/featured/?creative,marketing',
      theme: 'Creative workspace'
    },
    supportedTags: ['Introduction','Why this company','Experience','Skills','Achievements / Awards','Motivation / Why this role','Closing'],
    contentSkeleton: [
      { tag: 'Introduction', placeholder: 'Open with a concise creative hook and the role you’re pursuing.' },
      { tag: 'Why this company', placeholder: 'Note the brand story or campaign that inspired you.' },
      { tag: 'Experience', placeholder: 'Examples of campaigns, channels, and your specific contribution.' },
      { tag: 'Skills', placeholder: 'Creative skills like copywriting, design tools, or analytics.' },
      { tag: 'Achievements / Awards', placeholder: 'Campaign results, increases in engagement, or awards.' },
      { tag: 'Motivation / Why this role', placeholder: 'How your creative approach aligns with their brand.' },
      { tag: 'Closing', placeholder: 'Express enthusiasm and propose a portfolio review or call.' }
    ]
  },

  {
    id: 'vitaepro_template_10',
    name: 'Non-Profit Advocate',
    themeId: 'letterhead-accent',
    description: 'Purpose-driven layout for government and non-profit roles, emphasising mission alignment.',
    industry: ['Government / Non-Profit','Social Services'],
    careerLevel: ['Entry','Mid','Senior'],
    tone: ['Warm','Professional'],
    layoutStyle: 'Mission banner with values highlights',
    imagery: {
      type: 'photo',
      previewImage: 'https://source.unsplash.com/featured/?nonprofit,community',
      theme: 'Community and civic'
    },
    supportedTags: ['Introduction','Why this company','Experience','Skills','Achievements / Awards','Motivation / Why this role','Closing'],
    contentSkeleton: [
      { tag: 'Introduction', placeholder: 'Connect personally to the organisation’s mission and state the role.' },
      { tag: 'Why this company', placeholder: 'Values or outcomes that attracted you to the organisation.' },
      { tag: 'Experience', placeholder: 'Program delivery, stakeholder work, or community outcomes.' },
      { tag: 'Skills', placeholder: 'Community engagement, grant writing, or policy skills.' },
      { tag: 'Achievements / Awards', placeholder: 'Program metrics or volunteer mobilisation successes.' },
      { tag: 'Motivation / Why this role', placeholder: 'Why this role furthers your mission-driven goals.' },
      { tag: 'Closing', placeholder: 'Offer to discuss ideas for program impact and next steps.' }
    ]
  },

  {
    id: 'vitaepro_template_11',
    name: 'Graduate Launchpad',
    themeId: 'modern-centered',
    description: 'Optimised for entry-level and graduate applicants, highlighting potential and learning attitude.',
    industry: ['Corporate / Office','Technology / IT','Education'],
    careerLevel: ['Entry'],
    tone: ['Warm','Professional'],
    layoutStyle: 'Friendly header with education highlights',
    imagery: {
      type: 'photo',
      previewImage: 'https://source.unsplash.com/featured/?graduate,student',
      theme: 'Learning and potential'
    },
    supportedTags: ['Introduction','Why this company','Experience','Skills','Achievements / Awards','Motivation / Why this role','Closing'],
    contentSkeleton: [
      { tag: 'Introduction', placeholder: 'State your recent qualification and the graduate role you are applying for.' },
      { tag: 'Why this company', placeholder: 'Why you want to start your career with this employer.' },
      { tag: 'Experience', placeholder: 'Relevant internships, projects, or volunteer experience.' },
      { tag: 'Skills', placeholder: 'Transferable skills and technical basics you bring.' },
      { tag: 'Achievements / Awards', placeholder: 'Academic or extracurricular achievements demonstrating initiative.' },
      { tag: 'Motivation / Why this role', placeholder: 'Your learning goals and how the role supports them.' },
      { tag: 'Closing', placeholder: 'Express eagerness to learn and availability for interview.' }
    ]
  },

  {
    id: 'vitaepro_template_12',
    name: 'Product Manager Brief',
    themeId: 'standard',
    description: 'Concise, outcomes-focused template for product and program roles.',
    industry: ['Technology / IT','Corporate / Office'],
    careerLevel: ['Mid','Senior'],
    tone: ['Confident','Professional'],
    layoutStyle: 'Outcome-focused header with KPI highlights',
    imagery: {
      type: 'abstract',
      previewImage: 'https://source.unsplash.com/featured/?product-management,office',
      theme: 'Product and strategy'
    },
    supportedTags: ['Introduction','Why this company','Experience','Skills','Achievements / Awards','Motivation / Why this role','Closing'],
    contentSkeleton: [
      { tag: 'Introduction', placeholder: 'State your PM title and the product area you focus on.' },
      { tag: 'Why this company', placeholder: 'Product reasons you want to join this team.' },
      { tag: 'Experience', placeholder: 'Roadmap leadership, cross-functional achievements and metrics.' },
      { tag: 'Skills', placeholder: 'Product discovery, analytics, stakeholder management strengths.' },
      { tag: 'Achievements / Awards', placeholder: 'Product launches or adoption metrics you led.' },
      { tag: 'Motivation / Why this role', placeholder: 'How you will contribute to product strategy and outcomes.' },
      { tag: 'Closing', placeholder: 'Propose a product discussion and share references or portfolio.' }
    ]
  },

  {
    id: 'vitaepro_template_13',
    name: 'Sales Closer',
    themeId: 'letterhead-accent',
    description: 'High-energy template tailored to sales roles focused on targets and relationships.',
    industry: ['Retail & Hospitality','Corporate / Office'],
    careerLevel: ['Entry','Mid','Senior'],
    tone: ['Bold','Confident'],
    layoutStyle: 'Performance metric band with testimonial area',
    imagery: {
      type: 'photo',
      previewImage: 'https://source.unsplash.com/featured/?sales,business',
      theme: 'Sales floor and client meetings'
    },
    supportedTags: ['Introduction','Why this company','Experience','Skills','Achievements / Awards','Motivation / Why this role','Closing'],
    contentSkeleton: [
      { tag: 'Introduction', placeholder: 'Open with your sales focus and a headline metric if available.' },
      { tag: 'Why this company', placeholder: 'Why this sales role and customer base excites you.' },
      { tag: 'Experience', placeholder: 'Sales territories, products sold, and major clients.' },
      { tag: 'Skills', placeholder: 'Client acquisition, negotiation, CRM and pipeline management.' },
      { tag: 'Achievements / Awards', placeholder: 'Quota attainment or top-performer recognition.' },
      { tag: 'Motivation / Why this role', placeholder: 'How you will drive revenue and build relationships.' },
      { tag: 'Closing', placeholder: 'Request a meeting to discuss targets and approach.' }
    ]
  },

  {
    id: 'vitaepro_template_14',
    name: 'Customer Success Companion',
    themeId: 'standard',
    description: 'Empathetic, results-oriented template for customer success and account management.',
    industry: ['Technology / IT','Corporate / Office','Retail & Hospitality'],
    careerLevel: ['Entry','Mid','Senior'],
    tone: ['Warm','Professional'],
    layoutStyle: 'Client testimonial area and outcomes summary',
    imagery: {
      type: 'photo',
      previewImage: 'https://source.unsplash.com/featured/?customer-success,team',
      theme: 'Customer relationships'
    },
    supportedTags: ['Introduction','Why this company','Experience','Skills','Achievements / Awards','Motivation / Why this role','Closing'],
    contentSkeleton: [
      { tag: 'Introduction', placeholder: 'Mention your customer-facing role and commitment to success.' },
      { tag: 'Why this company', placeholder: 'Why their customers or product inspire you to help them succeed.' },
      { tag: 'Experience', placeholder: 'Client onboarding, retention achievements or support metrics.' },
      { tag: 'Skills', placeholder: 'Relationship building, troubleshooting and escalation management.' },
      { tag: 'Achievements / Awards', placeholder: 'Retention improvements or CSAT outcomes you influenced.' },
      { tag: 'Motivation / Why this role', placeholder: 'How you will help their customers achieve outcomes.' },
      { tag: 'Closing', placeholder: 'Offer to discuss case studies and next steps.' }
    ]
  },

  {
    id: 'vitaepro_template_15',
    name: 'UX Designer Portfolio Note',
    themeId: 'modern-centered',
    description: 'Visual-forward layout for designers that pairs brief commentary with portfolio links.',
    industry: ['Creative / Marketing','Technology / IT'],
    careerLevel: ['Entry','Mid','Senior'],
    tone: ['Modern','Confident'],
    layoutStyle: 'Visual header with portfolio link callout',
    imagery: {
      type: 'photo',
      previewImage: 'https://source.unsplash.com/featured/?ux,design',
      theme: 'Design studio'
    },
    supportedTags: ['Introduction','Why this company','Experience','Skills','Achievements / Awards','Motivation / Why this role','Closing'],
    contentSkeleton: [
      { tag: 'Introduction', placeholder: 'Introduce your design role and link to your portfolio.' },
      { tag: 'Why this company', placeholder: 'Design problems at the company that interest you.' },
      { tag: 'Experience', placeholder: 'Notable projects, process used, and outcomes.' },
      { tag: 'Skills', placeholder: 'Tools, UX methods and cross-functional collaboration strengths.' },
      { tag: 'Achievements / Awards', placeholder: 'Design awards or metrics showing improved UX.' },
      { tag: 'Motivation / Why this role', placeholder: 'How your design practice aligns with their needs.' },
      { tag: 'Closing', placeholder: 'Invite them to view your portfolio and arrange a review.' }
    ]
  },

  {
    id: 'vitaepro_template_16',
    name: 'Operations & Systems',
    themeId: 'standard',
    description: 'Structured, process-oriented template for operations, logistics and program roles.',
    industry: ['Corporate / Office','Government','Logistics & Supply Chain'],
    careerLevel: ['Mid','Senior'],
    tone: ['Professional','Confident'],
    layoutStyle: 'Process timeline band with metrics highlights',
    imagery: {
      type: 'abstract',
      previewImage: 'https://source.unsplash.com/featured/?operations,logistics',
      theme: 'Process and systems'
    },
    supportedTags: ['Introduction','Why this company','Experience','Skills','Achievements / Awards','Motivation / Why this role','Closing'],
    contentSkeleton: [
      { tag: 'Introduction', placeholder: 'State your operations role and focus areas (efficiency, compliance).' },
      { tag: 'Why this company', placeholder: 'Operational challenges you can help solve.' },
      { tag: 'Experience', placeholder: 'Systems you manage and process improvements delivered.' },
      { tag: 'Skills', placeholder: 'Operational KPIs, systems, Lean/Six Sigma or program management.' },
      { tag: 'Achievements / Awards', placeholder: 'Efficiency gains, cost savings or compliance wins.' },
      { tag: 'Motivation / Why this role', placeholder: 'How you will improve operations in this context.' },
      { tag: 'Closing', placeholder: 'Offer to share case studies or metrics in a meeting.' }
    ]
  },

  {
    id: 'vitaepro_template_17',
    name: 'Research & Analysis',
    themeId: 'formal-classic',
    description: 'Academic and evidence-based layout for research, evaluation and data roles.',
    industry: ['Science & Research','Education','Government'],
    careerLevel: ['Entry','Mid','Senior'],
    tone: ['Professional','Analytical'],
    layoutStyle: 'Data highlights and methodology callout',
    imagery: {
      type: 'photo',
      previewImage: 'https://source.unsplash.com/featured/?research,data',
      theme: 'Laboratory and analysis'
    },
    supportedTags: ['Introduction','Why this company','Experience','Skills','Achievements / Awards','Motivation / Why this role','Closing'],
    contentSkeleton: [
      { tag: 'Introduction', placeholder: 'State your research area and the role you are applying for.' },
      { tag: 'Why this company', placeholder: 'Why their research agenda or projects align with you.' },
      { tag: 'Experience', placeholder: 'Methods used, datasets, and your contributions.' },
      { tag: 'Skills', placeholder: 'Statistical software, methodologies and reporting strengths.' },
      { tag: 'Achievements / Awards', placeholder: 'Publications, grants, or impactful findings.' },
      { tag: 'Motivation / Why this role', placeholder: 'How you will advance their research aims.' },
      { tag: 'Closing', placeholder: 'Offer to discuss methodologies and share samples.' }
    ]
  },

  {
    id: 'vitaepro_template_18',
    name: 'Marketing Strategist',
    themeId: 'modern-centered',
    description: 'Strategic, campaign-focused layout for marketing managers and strategists.',
    industry: ['Creative / Marketing','Retail & Hospitality','Technology / IT'],
    careerLevel: ['Mid','Senior'],
    tone: ['Confident','Modern'],
    layoutStyle: 'Campaign banner with KPI snapshot',
    imagery: {
      type: 'photo',
      previewImage: 'https://source.unsplash.com/featured/?marketing,campaign',
      theme: 'Campaign and strategy'
    },
    supportedTags: ['Introduction','Why this company','Experience','Skills','Achievements / Awards','Motivation / Why this role','Closing'],
    contentSkeleton: [
      { tag: 'Introduction', placeholder: 'Introduce your marketing specialism and role interest.' },
      { tag: 'Why this company', placeholder: 'Brand or audience insights that attract you to this role.' },
      { tag: 'Experience', placeholder: 'Campaigns led, channels used, and measurable outcomes.' },
      { tag: 'Skills', placeholder: 'Strategy, analytics, creative leadership or media buying skills.' },
      { tag: 'Achievements / Awards', placeholder: 'Campaign ROI, growth metrics or awards.' },
      { tag: 'Motivation / Why this role', placeholder: 'How you will shape and measure campaign success.' },
      { tag: 'Closing', placeholder: 'Invite them to review case studies and discuss strategy.' }
    ]
  },

  {
    id: 'vitaepro_template_19',
    name: 'Remote Professional',
    themeId: 'modern-centered',
    description: 'A template emphasising remote collaboration, asynchronous working and digital tools.',
    industry: ['Remote / Digital Work','Technology / IT','Creative / Marketing'],
    careerLevel: ['Entry','Mid','Senior'],
    tone: ['Modern','Professional'],
    layoutStyle: 'Compact layout with remote tools icons',
    imagery: {
      type: 'photo',
      previewImage: 'https://source.unsplash.com/featured/?remote,workspace',
      theme: 'Remote / digital work'
    },
    supportedTags: ['Introduction','Why this company','Experience','Skills','Achievements / Awards','Motivation / Why this role','Closing'],
    contentSkeleton: [
      { tag: 'Introduction', placeholder: 'Note your remote experience and time-zone flexibility.' },
      { tag: 'Why this company', placeholder: 'Why their remote culture or tools appeal to you.' },
      { tag: 'Experience', placeholder: 'Distributed team projects, tools used and collaboration examples.' },
      { tag: 'Skills', placeholder: 'Remote teamwork, async communication and tooling proficiency.' },
      { tag: 'Achievements / Awards', placeholder: 'Remote project wins or operational improvements.' },
      { tag: 'Motivation / Why this role', placeholder: 'How you will succeed in a distributed environment.' },
      { tag: 'Closing', placeholder: 'Mention preferred communication channels and availability.' }
    ]
  },

  {
    id: 'vitaepro_template_20',
    name: 'Bold & Confident',
    themeId: 'letterhead-accent',
    description: 'A striking, assertive template for candidates who want to stand out with impact statements.',
    industry: ['Corporate / Office','Creative / Marketing','Technology / IT'],
    careerLevel: ['Mid','Senior','Executive'],
    tone: ['Bold','Confident'],
    layoutStyle: 'Hero headline with impact metrics and bold accent',
    imagery: {
      type: 'abstract',
      previewImage: 'https://source.unsplash.com/featured/?bold,modern',
      theme: 'Bold confident accents'
    },
    supportedTags: ['Introduction','Why this company','Experience','Skills','Achievements / Awards','Motivation / Why this role','Closing'],
    contentSkeleton: [
      { tag: 'Introduction', placeholder: 'Start with a strong professional headline and role intention.' },
      { tag: 'Why this company', placeholder: 'Declare why you are uniquely positioned to accelerate their goals.' },
      { tag: 'Experience', placeholder: 'High-impact examples of work with measurable results.' },
      { tag: 'Skills', placeholder: 'Top differentiating skills presented confidently.' },
      { tag: 'Achievements / Awards', placeholder: 'Bold results and recognitions you want to highlight.' },
      { tag: 'Motivation / Why this role', placeholder: 'Ambitious but realistic plan to add immediate value.' },
      { tag: 'Closing', placeholder: 'Strong call-to-action and next-step request.' }
    ]
  }
];

// Export for use in UI template selector, preview screens and letter generation engine.
module.exports = templates;
