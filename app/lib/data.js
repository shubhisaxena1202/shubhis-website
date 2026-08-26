export const links = {
  email: "shubhisaxena1202@gmail.com",
  github: "https://github.com/shubhisaxena1202",
  medium: "https://medium.com/@shubhiS",
  linkedin: "https://linkedin.com/in/shubhi-saxena",
};

export const articles = [
  {
    title: "Clicks to Conversion: Can LLMs Actually Answer What Shoppers Want?",
    blurb:
      "E-commerce search optimizes for clicks, not purchases. Using LLM-as-teacher distillation to train a fast student model that scores relevance by what shoppers actually buy.",
    date: "Aug 2026",
    image:
      "https://miro.medium.com/v2/resize:fill:800:800/1*xTcRtFjVhO18sQoJ-DtkNA.png",
    url: "https://medium.com/@shubhiS/clicks-to-conversion-can-llms-actually-answer-what-shoppers-want-f7883d75a497",
  },
  {
    title: "You Are Probably Running a 22% Test, Not a 5% One",
    blurb:
      "Why peeking at your A/B test inflates false positives, and how to peek anyway without paying for it.",
    date: "Jul 2026",
    image:
      "https://miro.medium.com/v2/resize:fill:800:800/1*DUuCI61X50vMUhDiHq0YEg.png",
    url: "https://medium.com/@shubhiS/you-are-probably-running-a-22-test-and-not-a-5-one-ceb5a0726bbd",
  },
  {
    title: "Cutting your A/B Test in Half with CUPED (Part 2)",
    blurb:
      "Variance reduction with CUPED and the Lin estimator: how to shrink an underpowered test back down to a usable sample size.",
    date: "Jul 2026",
    image:
      "https://miro.medium.com/v2/resize:fill:800:800/1*TFeejSwO7Vewu1oHmCVjRg.png",
    url: "https://medium.com/@shubhiS/cutting-your-a-b-test-in-half-with-cuped-83dabb8c4ae1",
  },
  {
    title: "CUPED, Explained Through a TikTok Series (Part 1)",
    blurb:
      "Why the standard A/B test breaks down, and the intuition behind CUPED before the math shows up.",
    date: "Jul 2026",
    image:
      "https://miro.medium.com/v2/resize:fill:800:800/1*WaSt6cEwxvoUU85X4jA3jA.png",
    url: "https://medium.com/@shubhiS/cuped-explained-through-tiktok-series-part-1-why-standard-a-b-test-breaks-0460f306f45c",
  },
  {
    title: "I Built a Tool to A/B Test AI Answer Engines",
    blurb:
      "It told me my optimization didn't work, and that was the most useful thing it could have said.",
    date: "Jun 2026",
    image:
      "https://miro.medium.com/v2/resize:fill:800:800/1*wcOcn3Uh46AI9uepn3Thuw.png",
    url: "https://medium.com/@shubhiS/i-built-a-tool-to-a-b-test-ai-answer-engines-it-told-me-my-optimization-didnt-work-f06f49c89230",
  },
];

export const projects = [
  {
    title: "LLM Eval & Experimentation Harness (AEO A/B Testing)",
    blurb:
      "A reusable platform for A/B testing LLM features: define a task, run variants, score outputs with an LLM-as-judge, and get statistical significance plus power analysis on a dashboard. Demoed on Answer Engine Optimization: does AEO-formatted content get recommended more often by a RAG answer engine? Pre-registered design, two-layer statistical testing (z-test and paired t-test), bootstrap confidence intervals, and an honest null result reported alongside the power analysis that explains it.",
    tags: ["Experimentation", "LLM Evals", "Causal Inference", "Python"],
    url: "https://github.com/shubhisaxena1202/AEO_AB_testing",
  },
];

export const experience = [
  {
    role: "Data Scientist",
    org: "Nestlé",
    period: "Current",
    bullets: [
      "Built a proactive anomaly detection system on transactional and logistics data that flagged $3M in at-risk sales before orders were lost, running continuously to give teams actionable signal before the recovery window closed.",
      "Designed demand forecasting architecture across 72,000 SKU–distribution center combinations, reducing forecast error 10–15% by moving from individual to hierarchical models and improving inventory decisions at scale.",
      "Led a paid media attribution experiment using synthetic difference-in-differences with Walmart.com, identifying keyword-level drivers contributing $160K/year in incremental sales lift.",
    ],
  },
];
