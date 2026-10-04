# ==============================================================================
# EduGester Redis Live Room State & Presence Engine
# ==============================================================================

import json
import time

class MemoryRedisFallback:
    """In-memory Redis fallback if Redis service is offline or not installed."""
    def __init__(self):
        self.hashes = {}
        self.sets = {}
        self.kv = {}

    def hset(self, key, mapping):
        if key not in self.hashes:
            self.hashes[key] = {}
        self.hashes[key].update(mapping)

    def hgetall(self, key):
        return self.hashes.get(key, {})

    def sadd(self, key, value):
        if key not in self.sets:
            self.sets[key] = set()
        self.sets[key].add(value)

    def srem(self, key, value):
        if key in self.sets:
            this_set = self.sets[key]
            if value in this_set:
                this_set.remove(value)

    def smembers(self, key):
        return self.sets.get(key, set())

    def scard(self, key):
        return len(self.sets.get(key, set()))

    def set(self, key, value):
        self.kv[key] = value

    def get(self, key):
        return self.kv.get(key)

class RedisClientManager:
    def __init__(self):
        self.client = MemoryRedisFallback()
        self.is_connected = True

    def set_live_room_state(self, class_code: str, state_dict: dict):
        key = f"classroom:{class_code.upper()}:state"
        mapping = {
            "model_id": state_dict.get("model_id", "heart"),
            "rotation": json.dumps(state_dict.get("rotation", {"x":0,"y":0,"z":0})),
            "position": json.dumps(state_dict.get("position", {"x":0,"y":0,"z":0})),
            "scale": json.dumps(state_dict.get("scale", {"x":1,"y":1,"z":1})),
            "animation": state_dict.get("animation", "playing"),
            "highlighted_part": state_dict.get("highlighted_part") or "",
            "lesson": state_dict.get("lesson", "Interactive Lesson"),
            "version": str(state_dict.get("version", 1)),
            "updated_at": str(int(time.time() * 1000))
        }
        self.client.hset(key, mapping)

    def get_live_room_state(self, class_code: str):
        key = f"classroom:{class_code.upper()}:state"
        raw = self.client.hgetall(key)
        if not raw:
            return None
        return {
            "model_id": raw.get("model_id", "heart"),
            "rotation": json.loads(raw.get("rotation", '{"x":0,"y":0,"z":0}')),
            "position": json.loads(raw.get("position", '{"x":0,"y":0,"z":0}')),
            "scale": json.loads(raw.get("scale", '{"x":1,"y":1,"z":1}')),
            "animation": raw.get("animation", "playing"),
            "highlighted_part": raw.get("highlighted_part") or None,
            "lesson": raw.get("lesson", ""),
            "version": int(raw.get("version", 1)),
            "updated_at": int(raw.get("updated_at", 0))
        }

    def add_student_presence(self, class_code: str, student_id: str):
        key = f"classroom:{class_code.upper()}:students"
        self.client.sadd(key, student_id)
        return self.client.scard(key)

    def remove_student_presence(self, class_code: str, student_id: str):
        key = f"classroom:{class_code.upper()}:students"
        self.client.srem(key, student_id)
        return self.client.scard(key)

    def get_student_count(self, class_code: str):
        key = f"classroom:{class_code.upper()}:students"
        return self.client.scard(key)

redis_manager = RedisClientManager()
