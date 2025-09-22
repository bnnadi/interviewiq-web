// Mock data for development and fallback scenarios
export const MOCK_QUESTIONS = [
  "Tell me about a time when you had to lead a team through a challenging project.",
  "How do you handle conflicting priorities and deadlines?",
  "Describe a situation where you had to learn a new technology quickly.",
  "What's your approach to mentoring junior developers?",
  "How do you stay updated with the latest industry trends?"
]

export const MOCK_FEEDBACK = {
  score: {
    clarity: 7,
    confidence: 6
  },
  missingKeywords: ['agile', 'scrum', 'stakeholder management'],
  improvements: [
    'Provide more specific examples with metrics',
    'Include more technical details about the solution',
    'Mention the business impact of your actions'
  ],
  idealAnswer: `I led a cross-functional team of 8 developers through a critical project that was behind schedule. 
  We implemented an agile approach with daily standups and bi-weekly sprints. I identified bottlenecks in our 
  development process and restructured our workflow, which improved our velocity by 40%. We delivered the 
  project on time and under budget, resulting in $500K in cost savings. The key was maintaining clear 
  communication with stakeholders and being adaptable when challenges arose.`
}
