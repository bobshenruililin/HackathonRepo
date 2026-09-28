export const FIXED_QUERIES = [
  {
    id: "hackmit-computer-vision-not-healthcare",
    text: "Find HackMIT projects involving computer vision but not healthcare.",
  },
  {
    id: "physical-world-with-ai",
    text: "Find physical-world projects with an AI component.",
  },
  {
    id: "speech-primary-interaction",
    text: "Find projects using speech as the primary interaction.",
  },
  {
    id: "award-winning-public-code",
    text: "Find award-winning projects with public code.",
  },
  {
    id: "structurally-similar-social-matching",
    text: "Find projects structurally similar to a social matching product.",
  },
  {
    id: "readme-claims-supported-by-repository",
    text: "Find projects where README technology claims are supported by repository evidence.",
  },
] as const;

export type FixedQuery = (typeof FIXED_QUERIES)[number];
export type FixedQueryId = FixedQuery["id"];

const QUERY_IDS = new Set<string>(FIXED_QUERIES.map((query) => query.id));

export function isFixedQueryId(value: string): value is FixedQueryId {
  return QUERY_IDS.has(value);
}
