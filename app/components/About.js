const skillColors = [
  "bg-violet-50 text-violet-700",
  "bg-teal-50 text-teal-700",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-700",
  "bg-indigo-50 text-indigo-700",
];

export default function About() {
  return (
    <section id="about" className="mx-auto max-w-3xl px-6 py-16">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-teal-600">
        About
      </h2>
      <div className="mt-4 space-y-4 text-base leading-7 text-zinc-700">
        <p>
          Early in my career, I built an anomaly detection model with 80%
          precision and spent six weeks proving it was worth acting on. Not
          because the model was wrong, but because the team needed to
          believe it before they&apos;d change their behavior. Every error
          got labeled, fed back, retrained. Eventually: $3M in recovered
          sales. The trust design was the product.
        </p>
        <p>
          That&apos;s how I approach data science. Not just modeling, but
          building analytical systems that people actually use to make
          decisions.
        </p>
        <p>
          At Nestlé I&apos;ve worked across the stack: demand forecasting at
          72,000 SKU–DC combinations, causal inference for digital commerce
          attribution, anomaly detection on streaming supply chain data,
          customer segmentation tied to revenue outcomes. The common thread
          is systems thinking: how data flows across teams, where
          measurement breaks down, and how to build something that holds up
          at scale.
        </p>
        <p>
          I also write about experimentation methods, causal inference, and
          ML case studies, including CUPED, SUTVA violations, and variance
          reduction, because the gap between &quot;we ran an A/B
          test&quot; and &quot;we can trust the result&quot; is where most
          of the interesting problems live.
        </p>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {[
          "Experimentation & A/B Testing",
          "Causal Inference",
          "Product Analytics",
          "Python & SQL",
          "Machine Learning",
        ].map((skill, i) => (
          <span
            key={skill}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              skillColors[i % skillColors.length]
            }`}
          >
            {skill}
          </span>
        ))}
      </div>
    </section>
  );
}
