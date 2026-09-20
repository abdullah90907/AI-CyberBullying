/**
 * OmniGuard AI — YouTube Demo Video Configuration
 * 
 * Instructions for adding/changing the YouTube link:
 * 1. Paste your full YouTube URL into `YOUTUBE_DEMO_URL` below:
 *    Example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" or "https://youtu.be/dQw4w9WgXcQ"
 * 2. If left empty (""), the "Watch Demo" button will open a sleek preview modal
 *    guiding viewers that the video link is configured and ready.
 */

export const YOUTUBE_DEMO_CONFIG = {
  // Put your YouTube video URL here:
  url: '', 
  title: 'OmniGuard AI — Full Platform & Moderation Walkthrough',
  subtitle: 'Multimodal AI Detection across Text, Images, and Video',
  badge: 'YouTube Demo',
};

/**
 * Helper to extract YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 */
export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url || !url.trim()) return null;
  const cleanUrl = url.trim();

  // If already an embed URL
  if (cleanUrl.includes('youtube.com/embed/')) {
    return cleanUrl;
  }

  // Regex match for youtube video id
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = cleanUrl.match(regExp);

  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0`;
  }

  return cleanUrl;
}
