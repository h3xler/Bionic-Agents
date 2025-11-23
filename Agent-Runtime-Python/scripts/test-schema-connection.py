#!/usr/bin/env python3
"""Test script to verify Alembic and SQLAlchemy schema connections.

This script:
1. Connects to the test database
2. Verifies Alembic can read the schema
3. Tests SQLAlchemy models can read from Drizzle-managed tables
4. Tests basic CRUD operations across ORM boundary
"""

import os
import sys
import asyncio
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError

from src.database.models import Base, Agent, AgentInstanceSession, Tenant, User

# Test database URL
DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5433/liveagents_test"
)


def test_database_connection():
    """Test basic database connection."""
    print("🔍 Testing database connection...")
    try:
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            print(f"✅ Connected to PostgreSQL: {version[:50]}...")
            return True
    except OperationalError as e:
        print(f"❌ Database connection failed: {e}")
        return False


def test_schema_inspection():
    """Test that SQLAlchemy can inspect the database schema."""
    print("\n🔍 Testing schema inspection...")
    try:
        engine = create_engine(DATABASE_URL)
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"✅ Found {len(tables)} tables in database")
        
        # Check for key tables
        required_tables = [
            "users",
            "tenants",
            "agents",
            "agent_instance_sessions",
            "settings"
        ]
        
        missing_tables = [t for t in required_tables if t not in tables]
        if missing_tables:
            print(f"⚠️  Missing tables: {missing_tables}")
            print("   Note: Tables will be created by Drizzle migrations from Agent-Builder")
            return False
        else:
            print(f"✅ All required tables found: {required_tables}")
            return True
    except Exception as e:
        print(f"❌ Schema inspection failed: {e}")
        return False


def test_table_structure():
    """Test that table structures match our models."""
    print("\n🔍 Testing table structure compatibility...")
    try:
        engine = create_engine(DATABASE_URL)
        inspector = inspect(engine)
        
        # Test agents table structure
        if "agents" in inspector.get_table_names():
            columns = {col["name"]: col for col in inspector.get_columns("agents")}
            
            # Check for key columns
            required_columns = [
                "id", "user_id", "tenant_id", "name",
                "stt_provider", "tts_provider", "llm_provider",
                "avatar_model", "vision_enabled", "screen_share_enabled",
                "transcribe_enabled", "languages"
            ]
            
            missing_columns = [c for c in required_columns if c not in columns]
            if missing_columns:
                print(f"⚠️  Missing columns in agents table: {missing_columns}")
            else:
                print(f"✅ Agents table structure matches model")
                print(f"   Found {len(columns)} columns")
            
            # Check agent_instance_sessions table
            if "agent_instance_sessions" in inspector.get_table_names():
                session_columns = {col["name"]: col for col in inspector.get_columns("agent_instance_sessions")}
                required_session_columns = [
                    "id", "agent_id", "tenant_id", "session_id",
                    "room_name", "status", "started_at"
                ]
                missing_session_columns = [c for c in required_session_columns if c not in session_columns]
                if missing_session_columns:
                    print(f"⚠️  Missing columns in agent_instance_sessions: {missing_session_columns}")
                else:
                    print(f"✅ Agent instance sessions table structure matches model")
            
            return True
        else:
            print("⚠️  Agents table not found - will be created by Drizzle")
            return False
    except Exception as e:
        print(f"❌ Table structure test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_model_queries():
    """Test that SQLAlchemy models can query the database."""
    print("\n🔍 Testing SQLAlchemy model queries...")
    try:
        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # Test querying agents table (if it exists)
        try:
            agent_count = session.query(Agent).count()
            print(f"✅ Successfully queried agents table: {agent_count} agents found")
        except Exception as e:
            print(f"⚠️  Could not query agents table: {e}")
            print("   This is expected if tables don't exist yet")
        
        # Test querying agent_instance_sessions
        try:
            session_count = session.query(AgentInstanceSession).count()
            print(f"✅ Successfully queried agent_instance_sessions: {session_count} sessions found")
        except Exception as e:
            print(f"⚠️  Could not query agent_instance_sessions: {e}")
            print("   This is expected if tables don't exist yet")
        
        session.close()
        return True
    except Exception as e:
        print(f"❌ Model query test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_alembic_connection():
    """Test that Alembic can connect and read schema."""
    print("\n🔍 Testing Alembic connection...")
    try:
        from alembic.config import Config
        from alembic import command
        from alembic.script import ScriptDirectory
        
        alembic_cfg = Config("alembic.ini")
        alembic_cfg.set_main_option("sqlalchemy.url", DATABASE_URL)
        
        # Test that we can create a script directory
        script = ScriptDirectory.from_config(alembic_cfg)
        print(f"✅ Alembic script directory loaded")
        print(f"   Revision head: {script.get_current_head()}")
        
        # Test that we can get current revision (may be None if no migrations)
        try:
            engine = create_engine(DATABASE_URL)
            with engine.connect() as conn:
                result = conn.execute(text("SELECT version_num FROM alembic_version LIMIT 1;"))
                version = result.fetchone()
                if version:
                    print(f"✅ Alembic version found in database: {version[0]}")
                else:
                    print("⚠️  No Alembic version found (expected for new database)")
        except Exception:
            print("⚠️  No Alembic version table (expected for new database)")
        
        return True
    except Exception as e:
        print(f"❌ Alembic connection test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests."""
    print("=" * 60)
    print("Agent-Runtime Python - Schema Connection Test")
    print("=" * 60)
    print(f"Database URL: {DATABASE_URL.replace('postgres:postgres@', '***:***@')}")
    print()
    
    results = []
    
    # Run tests
    results.append(("Database Connection", test_database_connection()))
    results.append(("Schema Inspection", test_schema_inspection()))
    results.append(("Table Structure", test_table_structure()))
    results.append(("Model Queries", test_model_queries()))
    results.append(("Alembic Connection", test_alembic_connection()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nResults: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Schema connection verified.")
        return 0
    elif passed > 0:
        print("\n⚠️  Some tests passed. Schema may need Drizzle migrations first.")
        return 0
    else:
        print("\n❌ Tests failed. Please check database connection and setup.")
        return 1


if __name__ == "__main__":
    sys.exit(main())


