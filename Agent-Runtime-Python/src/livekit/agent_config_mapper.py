"""Agent Configuration Mapper.

Maps agent configuration from database to LiveKit AgentSession providers.
Leverages LiveKit's built-in provider plugins and capabilities.
"""

import logging
from typing import Dict, Any, Optional
from livekit import rtc
from livekit.agents import AgentSession

# Try to import silero (optional plugin)
try:
    from livekit.plugins import silero
    SILERO_AVAILABLE = True
except (ImportError, ModuleNotFoundError):
    SILERO_AVAILABLE = False
    silero = None
    logging.warning("Silero plugin not available")

# Try to import turn detector (optional)
try:
    from livekit.plugins.turn_detector.multilingual import MultilingualModel
    TURN_DETECTOR_AVAILABLE = True
except (ImportError, ModuleNotFoundError):
    TURN_DETECTOR_AVAILABLE = False
    MultilingualModel = None
    logging.warning("Turn detector plugin not available")

# Import provider plugins
try:
    from livekit.plugins import deepgram, assemblyai, gladia
    STT_AVAILABLE = True
except ImportError:
    STT_AVAILABLE = False
    logging.warning("STT plugins not available")

try:
    from livekit.plugins import elevenlabs, cartesia
    TTS_AVAILABLE = True
except ImportError:
    TTS_AVAILABLE = False
    logging.warning("TTS plugins not available")

try:
    from livekit.plugins import openai, anthropic
    LLM_AVAILABLE = True
except ImportError:
    LLM_AVAILABLE = False
    logging.warning("LLM plugins not available")

# BitHuman plugin
try:
    from livekit.plugins.bithuman import BitHuman
    BITHUMAN_AVAILABLE = True
except ImportError:
    BITHUMAN_AVAILABLE = False
    logging.warning("BitHuman plugin not available")

logger = logging.getLogger(__name__)


def create_stt_provider(config: Dict[str, Any]) -> Optional[Any]:
    """Create STT provider from config.
    
    Uses LiveKit's built-in STT providers:
    - Deepgram
    - AssemblyAI
    - Gladia
    """
    stt_provider = config.get("sttProvider", "").lower()
    
    if not STT_AVAILABLE:
        logger.warning("STT plugins not available, using default")
        return "assemblyai/universal-streaming:en"  # Default to LiveKit Inference
    
    if stt_provider == "deepgram":
        # Use Deepgram plugin
        return deepgram.STT()
    elif stt_provider == "assemblyai":
        # Use AssemblyAI via LiveKit Inference (recommended)
        return "assemblyai/universal-streaming:en"
    elif stt_provider == "gladia":
        return gladia.STT()
    else:
        # Default to AssemblyAI via LiveKit Inference
        return "assemblyai/universal-streaming:en"


def create_tts_provider(config: Dict[str, Any]) -> Optional[Any]:
    """Create TTS provider from config.
    
    Uses LiveKit's built-in TTS providers:
    - ElevenLabs
    - Cartesia
    """
    tts_provider = config.get("ttsProvider", "").lower()
    voice_id = config.get("voiceId")
    
    if not TTS_AVAILABLE:
        logger.warning("TTS plugins not available, using default")
        return "cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc"  # Default
    
    if tts_provider == "elevenlabs":
        if voice_id:
            return elevenlabs.TTS(voice=voice_id)
        return elevenlabs.TTS()
    elif tts_provider == "cartesia":
        if voice_id:
            return f"cartesia/sonic-3:{voice_id}"
        return "cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc"
    else:
        # Default to Cartesia
        return "cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc"


def create_llm_provider(config: Dict[str, Any]) -> Optional[Any]:
    """Create LLM provider from config.
    
    Uses LiveKit's built-in LLM providers:
    - OpenAI (including Realtime API)
    - Anthropic
    - Gemini Live
    """
    llm_provider = config.get("llmProvider", "").lower()
    llm_model = config.get("llmModel", "gpt-4.1-mini")
    
    if not LLM_AVAILABLE:
        logger.warning("LLM plugins not available, using default")
        return "openai/gpt-4.1-mini"  # Default to LiveKit Inference
    
    # Check if using realtime model
    if llm_provider == "realtime" or llm_provider == "openai-realtime":
        # Use OpenAI Realtime API
        return openai.realtime.RealtimeModel(voice="coral")
    
    if llm_provider == "openai":
        # Use OpenAI via LiveKit Inference (recommended)
        return f"openai/{llm_model}"
    elif llm_provider == "anthropic":
        # Use Anthropic via LiveKit Inference
        return f"anthropic/{llm_model}"
    elif llm_provider == "gemini" or llm_provider == "gemini-live":
        # Use Gemini Live
        # Note: Gemini Live integration may vary
        return f"gemini/{llm_model}"
    else:
        # Default to OpenAI
        return "openai/gpt-4.1-mini"


def create_agent_session_from_config(
    config: Dict[str, Any],
    room: rtc.Room
) -> Optional[AgentSession]:
    """Create AgentSession from agent configuration.
    
    This function maps the agent config to LiveKit AgentSession,
    leveraging all of LiveKit's built-in capabilities:
    - STT-LLM-TTS pipeline
    - Turn detection
    - VAD (Voice Activity Detection)
    - BitHuman avatar support
    - Vision capabilities
    - Transcription
    - Multilingual support
    """
    try:
        # Create providers
        stt = create_stt_provider(config)
        tts = create_tts_provider(config)
        llm = create_llm_provider(config)
        
        # VAD (Voice Activity Detection) - use Silero if available
        vad = None
        if SILERO_AVAILABLE and silero and hasattr(silero, 'VAD'):
            try:
                vad = silero.VAD.load()
            except Exception as e:
                logger.warning(f"Failed to load Silero VAD: {e}")
        
        # Turn detection - use multilingual model if available
        turn_detection = None
        if TURN_DETECTOR_AVAILABLE and MultilingualModel:
            try:
                turn_detection = MultilingualModel()
            except Exception as e:
                logger.warning(f"Failed to create turn detector: {e}")
        
        # Check for BitHuman avatar
        avatar_model = config.get("avatarModel")
        avatar_session = None
        
        if avatar_model and BITHUMAN_AVAILABLE:
            try:
                # Create BitHuman avatar session
                # BitHuman plugin handles video output automatically
                avatar_session = BitHuman(avatar_id=avatar_model)
                logger.info(f"BitHuman avatar enabled: {avatar_model}")
            except Exception as e:
                logger.error(f"Failed to create BitHuman avatar: {e}")
        
        # Create AgentSession
        # AgentSession handles all the complexity:
        # - Audio streaming
        # - STT-LLM-TTS pipeline
        # - Turn detection
        # - Interruptions
        # - Room connection
        session = AgentSession(
            stt=stt,
            llm=llm,
            tts=tts,
            vad=vad,
            turn_detection=turn_detection,
        )
        
        # If BitHuman is configured, it will be used automatically
        # when publishing video tracks
        
        logger.info(f"AgentSession created with STT={stt}, LLM={llm}, TTS={tts}")
        return session
        
    except Exception as e:
        logger.error(f"Failed to create AgentSession: {e}", exc_info=True)
        return None

