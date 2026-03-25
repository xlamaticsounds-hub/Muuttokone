// Import necessary libraries
import { getPosts } from './api';
import { calculatePrice, generateDiscordMessage } from './utils';

// Function to start the bot
async function startBot() {
  try {
    const posts = await getPosts('kulta', 'hopea');
    for (const post of posts) {
      if (!post.weight || !post.carat) continue;
      const spotPrice = calculatePrice(post.weight, post.carat);
      const offer = Math.floor(spotPrice * 0.7);
      const potentialProfit = post.price - offer;

      if (potentialProfit > 50) {
        const discordMessage = generateDiscordMessage(
          post.weight,
          post.carat,
          spotPrice,
          offer,
          potentialProfit,
          post.link
        );
        console.log(discordMessage);
      }
    }
  } catch (error) {
    console.error('Error fetching or processing posts:', error);
  }
}

// Main execution
startBot();