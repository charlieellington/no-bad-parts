#!/usr/bin/env python3
"""Simple test to verify Daily connection"""

import os
import asyncio
from dotenv import load_dotenv
from loguru import logger

# Load environment variables
load_dotenv()

async def test_basic_pipeline():
    """Test the most basic pipeline setup"""
    
    logger.info("Testing basic pipeline setup...")
    
    # Import inside async function to ensure event loop exists
    from pipecat.pipeline.pipeline import Pipeline
    from pipecat.pipeline.task import PipelineTask
    from pipecat.transports.services.daily import DailyTransport, DailyParams
    
    try:
        # Create the simplest possible transport
        transport = DailyTransport(
            room_url=os.getenv("DAILY_ROOM_URL"),
            token=os.getenv("DAILY_TOKEN", None),  # Token is required param
            bot_name="test-bot",
            params=DailyParams()
        )
        
        # Create minimal pipeline
        pipeline = Pipeline([
            transport.input(),
            transport.output()
        ])
        
        # Create task
        task = PipelineTask(pipeline)
        
        # Set up event handlers
        @transport.event_handler("on_joined")
        async def on_joined(transport, data):
            logger.info("✅ Successfully joined Daily room!")
            # Wait 5 seconds then leave
            await asyncio.sleep(5)
            logger.info("Leaving room...")
            await task.cancel()
        
        @transport.event_handler("on_error")
        async def on_error(transport, error):
            logger.error(f"Transport error: {error}")
            await task.cancel()
        
        # Run the pipeline
        logger.info("Starting pipeline...")
        await task.run()
        logger.info("Pipeline finished")
        
    except Exception as e:
        logger.error(f"Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Configure logging
    logger.remove()
    logger.add(
        sink=lambda msg: print(msg, end=""),
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{message}</cyan>",
        level="INFO"
    )
    
    # Run the test
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        loop.run_until_complete(test_basic_pipeline())
    except KeyboardInterrupt:
        logger.info("Test interrupted")
    finally:
        loop.close() 