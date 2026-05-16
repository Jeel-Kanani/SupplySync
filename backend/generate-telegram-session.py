#!/usr/bin/env python3
"""
Telegram Session Generator for GramJS
This script generates a session string you can use in your .env file
"""

import sys
import asyncio
from telethon import TelegramClient
from telethon.sessions import StringSession

async def generate_session():
    api_id = input("Enter TELEGRAM_API_ID: ").strip()
    api_hash = input("Enter TELEGRAM_API_HASH: ").strip()
    phone = input("Enter your Telegram phone (+country code): ").strip()
    
    if not api_id or not api_hash or not phone:
        print("❌ Missing credentials!")
        return
    
    try:
        api_id = int(api_id)
    except ValueError:
        print("❌ API_ID must be a number!")
        return
    
    print("\n⏳ Connecting to Telegram...\n")
    
    # Create client with empty session first time
    client = TelegramClient(StringSession(), api_id, api_hash)
    
    try:
        # Connect and request code
        await client.connect()
        
        # Send code request
        result = await client.send_code_request(phone)
        print(f"✅ Code sent to your Telegram app!")
        print(f"   (check your Telegram for the 5-digit code)\n")
        
        # Get code from user
        code = input("Enter the verification CODE (5 digits): ").strip()
        
        if not code:
            print("❌ Code cannot be empty!")
            await client.disconnect()
            return
        
        # Sign in with code
        try:
            await client.sign_in(phone, code)
        except Exception as e:
            # May need 2FA password
            if "password" in str(e).lower():
                password = input("Enter your 2FA password: ").strip()
                await client.sign_in(password=password)
            else:
                raise
        
        # Get the session string
        session_str = client.session.save()
        
        print("\n" + "="*50)
        print("✅ SESSION GENERATED SUCCESSFULLY!\n")
        print("="*50)
        print("\nCOPY THIS ENTIRE STRING:\n")
        print(session_str)
        print("\n" + "="*50)
        print("\nThen paste in your .env file as:\n")
        print(f"TELEGRAM_SESSION={session_str}")
        print("\n" + "="*50)
        
        await client.disconnect()
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        try:
            await client.disconnect()
        except:
            pass

if __name__ == "__main__":
    asyncio.run(generate_session())
