#!/usr/bin/env python3
"""
Quick script to verify environment variables are properly loaded.
Run this from the agent directory: python verify_env.py
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

def check_env():
    """Check if all required environment variables are set."""
    print("🔍 Checking environment variables...\n")
    
    required_vars = {
        "OPENAI_API_KEY": "Required for Whisper STT and GPT-4",
        "DAILY_API_KEY": "Required for Daily bot connection",
        "DAILY_ROOM_URL": "Daily room URL",
        "DAILY_TOKEN": "Optional for development (public rooms)",
        "SYSTEM_PROMPT": "IFS coaching prompt"
    }
    
    all_good = True
    
    for var, description in required_vars.items():
        value = os.getenv(var)
        
        if var == "DAILY_TOKEN" and not value:
            print(f"✓ {var}: Empty (OK for development with public rooms)")
        elif value:
            if var in ["OPENAI_API_KEY", "DAILY_API_KEY"]:
                # Don't print sensitive keys
                print(f"✓ {var}: Set ({len(value)} chars) - {description}")
            elif var == "SYSTEM_PROMPT":
                print(f"✓ {var}: Set ({len(value)} chars) - {description}")
                print(f"  First 50 chars: {value[:50]}...")
            else:
                print(f"✓ {var}: {value} - {description}")
        else:
            print(f"✗ {var}: Missing! - {description}")
            all_good = False
    
    print("\n" + "="*50)
    if all_good:
        print("✅ All environment variables are properly configured!")
        print("   You're ready to proceed with building the Pipecat pipeline.")
    else:
        print("❌ Some environment variables are missing.")
        print("   Please check your .env file.")
    
    return all_good

if __name__ == "__main__":
    check_env() 