# ==============================================================================
# EduGester Backend Configuration
# ==============================================================================

import os

DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./edugester.db')
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'edugester_jwt_secret_key_super_secure_9923')
JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', '1440')) // 24 hours
