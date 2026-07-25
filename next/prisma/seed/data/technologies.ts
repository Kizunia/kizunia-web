// prisma/seed/data/technologies.ts
// Comprehensive tech stack covering web, mobile, AI/ML, blockchain, DevOps, etc.

export const technologies = [
  // Frontend
  { name: "React", slug: "react", description: "JavaScript library for building UIs" },
  { name: "Next.js", slug: "nextjs", description: "React framework for production" },
  { name: "Vue.js", slug: "vuejs", description: "Progressive JavaScript framework" },
  { name: "Angular", slug: "angular", description: "Platform for building mobile & desktop web apps" },
  { name: "Svelte", slug: "svelte", description: "Cybernetically enhanced web apps" },
  { name: "Tailwind CSS", slug: "tailwindcss", description: "Utility-first CSS framework" },

  // Mobile
  { name: "Flutter", slug: "flutter", description: "Google's UI toolkit for cross-platform apps" },
  { name: "React Native", slug: "react-native", description: "Build native apps with React" },
  { name: "Swift", slug: "swift", description: "Apple's programming language for iOS/macOS" },
  { name: "Kotlin", slug: "kotlin", description: "Modern language for Android development" },

  // Backend
  { name: "Node.js", slug: "nodejs", description: "JavaScript runtime built on V8" },
  { name: "Python", slug: "python", description: "General-purpose programming language" },
  { name: "Go", slug: "golang", description: "Statically typed, compiled language by Google" },
  { name: "Rust", slug: "rust", description: "Systems programming language focused on safety" },
  { name: "Java", slug: "java", description: "Enterprise-grade programming language" },
  { name: "Django", slug: "django", description: "High-level Python web framework" },
  { name: "FastAPI", slug: "fastapi", description: "Modern, fast Python web framework" },
  { name: "Express.js", slug: "expressjs", description: "Minimal Node.js web framework" },

  // AI/ML
  { name: "TensorFlow", slug: "tensorflow", description: "End-to-end ML platform" },
  { name: "PyTorch", slug: "pytorch", description: "ML framework for research and production" },
  { name: "LangChain", slug: "langchain", description: "Framework for LLM-powered applications" },
  { name: "Hugging Face", slug: "huggingface", description: "ML model hub and tooling" },
  { name: "OpenAI API", slug: "openai-api", description: "GPT and AI model APIs" },

  // Blockchain / Web3
  { name: "Solidity", slug: "solidity", description: "Smart contract language for Ethereum" },
  { name: "Ethereum", slug: "ethereum", description: "Decentralized blockchain platform" },
  { name: "Solana", slug: "solana", description: "High-performance blockchain" },
  { name: "IPFS", slug: "ipfs", description: "Peer-to-peer distributed file system" },

  // Databases
  { name: "PostgreSQL", slug: "postgresql", description: "Advanced open-source relational database" },
  { name: "MongoDB", slug: "mongodb", description: "NoSQL document database" },
  { name: "Redis", slug: "redis", description: "In-memory data store" },
  { name: "Supabase", slug: "supabase", description: "Open-source Firebase alternative" },
  { name: "Firebase", slug: "firebase", description: "Google's app development platform" },

  // DevOps / Cloud
  { name: "Docker", slug: "docker", description: "Container platform for building and shipping apps" },
  { name: "Kubernetes", slug: "kubernetes", description: "Container orchestration platform" },
  { name: "AWS", slug: "aws", description: "Amazon Web Services cloud platform" },
  { name: "Google Cloud", slug: "gcp", description: "Google's cloud computing platform" },
  { name: "Terraform", slug: "terraform", description: "Infrastructure as code tool" },
  { name: "GitHub Actions", slug: "github-actions", description: "CI/CD platform by GitHub" },

  // Other
  { name: "GraphQL", slug: "graphql", description: "Query language for APIs" },
  { name: "WebAssembly", slug: "webassembly", description: "Binary instruction format for the web" },
  { name: "Figma", slug: "figma", description: "Collaborative design tool" },
  { name: "Arduino", slug: "arduino", description: "Open-source electronics platform" },
  { name: "Raspberry Pi", slug: "raspberry-pi", description: "Single-board computer for IoT" },
] as const;
