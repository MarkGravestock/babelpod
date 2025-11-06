// Demo podcast data for testing without CORS issues
// This uses publicly accessible audio files

export const DEMO_PODCAST = {
  title: "Coffee Break Spanish - Demo",
  description: "Learn Spanish with Coffee Break Spanish! This demo includes sample episodes to test the translation feature.",
  image: "https://images.unsplash.com/photo-1583468982228-19f19164aee2?w=400&h=400&fit=crop",
  episodes: [
    {
      id: "demo-episode-1",
      title: "Greetings and Introductions",
      description: "Learn how to greet people and introduce yourself in Spanish. Perfect for beginners!",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      duration: "5:00",
      pubDate: "2024-11-01",
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=400&fit=crop"
    },
    {
      id: "demo-episode-2",
      title: "Ordering Food at a Restaurant",
      description: "Learn essential vocabulary and phrases for ordering food in Spanish restaurants.",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      duration: "7:30",
      pubDate: "2024-11-05",
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop"
    },
    {
      id: "demo-episode-3",
      title: "Asking for Directions",
      description: "Navigate Spanish-speaking cities with confidence! Learn how to ask for and give directions.",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      duration: "6:15",
      pubDate: "2024-11-10",
      image: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=400&fit=crop"
    }
  ]
};

// Function to load demo podcast
export function loadDemoPodcast() {
  return Promise.resolve(DEMO_PODCAST);
}
