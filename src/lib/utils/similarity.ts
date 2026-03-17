// Jaccard Similarity for text comparison
export function jaccardSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const set1 = new Set(str1.split(''));
  const set2 = new Set(str2.split(''));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

// Word-based Jaccard (better for titles)
export function wordJaccardSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const words1 = new Set(str1.toLowerCase().split(/\s+/));
  const words2 = new Set(str2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}
