// data/faq.ts
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export const proseFAQ: FAQItem[] = [
  {
    id: "what-is-prose",
    question: "What is Prose?",
    answer:
      "Prose is a community-driven platform where you can join conversations, share ideas, and connect with people who share your interests. Think of it as a collection of communities (called 'pr/' spaces) where each space is dedicated to a specific topic, hobby, or interest.",
  },
  {
    id: "how-to-join",
    question: "How do I join a community?",
    answer:
      "Browse or search for communities that interest you. Click the 'Join' button on any community page. Once joined, you can start posting, commenting, and voting. Some communities may be private and require approval to join.",
  },
  {
    id: "what-is-karma",
    question: "What is karma?",
    answer:
      "Karma reflects how much your contributions mean to the Prose community. You earn karma when your posts and comments get upvoted. It's a rough indicator of your reputation and activity on the platform, but it doesn't unlock special features.",
  },
  {
    id: "how-to-create-post",
    question: "How do I create a post?",
    answer:
      "Click the 'Create Post' button from your home feed or inside any community you've joined. You can share text, images, or links. Choose the right community for your content, write a clear title, and follow each community's rules.",
  },
  {
    id: "can-i-edit-delete",
    question: "Can I edit or delete my posts?",
    answer:
      "Yes, you can edit your posts within 1 hour of creation. After that, posts are locked to preserve discussion integrity. You can delete your posts at any time, which removes them from public view but may retain anonymized data for moderation purposes.",
  },
  {
    id: "what-are-rules",
    question: "What are the platform rules?",
    answer:
      "Be respectful, stay safe, and keep it legal. Don't share personal information, harass others, or post illegal content. Each community also has its own specific rules set by moderators. Violating rules can result in content removal or account suspension.",
  },
];
