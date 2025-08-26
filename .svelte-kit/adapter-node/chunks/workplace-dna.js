function generateWorkplaceDNA(scores) {
  const { collaboration, formality, wellness } = scores;
  const technology = scores.technology ?? scores.tech ?? 0;
  const traits = [];
  if (collaboration >= 7) traits.push("Collaborative");
  else if (collaboration >= 4) traits.push("Balanced");
  else traits.push("Independent");
  if (formality >= 7) traits.push("Structured");
  else if (formality >= 4) traits.push("Flexible");
  else traits.push("Casual");
  if (technology >= 7) traits.push("Digital-First");
  else if (technology >= 4) traits.push("Tech-Enabled");
  else traits.push("Traditional");
  if (wellness >= 7) traits.push("Wellness-Focused");
  else if (wellness >= 4) traits.push("Balance-Aware");
  else traits.push("Performance-Driven");
  return traits.join(" · ");
}
export {
  generateWorkplaceDNA as g
};
