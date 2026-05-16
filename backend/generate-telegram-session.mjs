import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) =>
  new Promise((resolve) => rl.question(prompt, resolve));

async function generateSession() {
  console.log("\n=== Telegram Session Generator ===\n");

  const apiId = await question(
    "Enter your TELEGRAM_API_ID (from my.telegram.org): "
  );
  const apiHash = await question(
    "Enter your TELEGRAM_API_HASH (from my.telegram.org): "
  );
  const phoneNumber = await question(
    "Enter your Telegram phone number (with country code, e.g., +919876543210): "
  );

  try {
    console.log("\nConnecting to Telegram...");

    const client = new TelegramClient(
      new StringSession(""),
      Number(apiId),
      apiHash,
      { connectionRetries: 5 }
    );

    await client.start({
      phoneNumber: async () => phoneNumber,
      password: async () => {
        return await question(
          "Enter your 2FA password (or press Enter if you don't have one): "
        );
      },
      onError: (err) => console.error("Error:", err),
    });

    const session = client.session.save();

    console.log("\n✅ Session generated successfully!\n");
    console.log("=== COPY EVERYTHING BELOW ===\n");
    console.log(session);
    console.log("\n=== PASTE INTO .env AS: ===\n");
    console.log(`TELEGRAM_SESSION=${session}`);
    console.log("\n");

    await client.disconnect();
    rl.close();
  } catch (error) {
    console.error("Error:", error.message);
    rl.close();
  }
}

generateSession();
