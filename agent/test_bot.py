#!/usr/bin/env python3
"""Minimal test bot to verify Daily connection with Pipecat 0.0.70.dev47"""

import os
import asyncio
from dotenv import load_dotenv
from loguru import logger

# Load environment variables
load_dotenv()

async def test_daily_connection():
    """Test basic Daily room connection without full pipeline"""
    
    logger.info("Testing Daily connection...")
    
    try:
        # Import Daily-specific modules
        from daily import Daily
        
        # Create Daily client
        daily_client = Daily()
        
        # Join the room
        room_url = os.getenv("DAILY_ROOM_URL")
        logger.info(f"Attempting to join: {room_url}")
        
        # For public rooms, we don't need a token
        daily_client.join(
            url=room_url,
            client_settings={
                "userName": "ai-coach-test",
                "subscribeToAllTracks": True
            }
        )
        
        logger.info("✅ Successfully joined Daily room!")
        
        # Wait a bit to verify connection
        await asyncio.sleep(5)
        
        # Leave the room
        daily_client.leave()
        logger.info("Left Daily room")
        
    except Exception as e:
        logger.error(f"❌ Failed to connect: {e}")
        raise

if __name__ == "__main__":
    # Configure logging
    logger.remove()
    logger.add(
        sink=lambda msg: print(msg, end=""),
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{message}</cyan>",
        level="INFO"
    )
    
    # Run the test
    asyncio.run(test_daily_connection()) 