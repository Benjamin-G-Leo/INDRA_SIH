#Kafka mock_bus
import queue
import time
import json

# Simulated Kafka Event Bus Topic
topic_queue = queue.Queue()

class MockKafkaProducer:
    def __init__(self, topic):
        self.topic = topic

    def send(self, payload):
        print(f"\n[KAFKA PRODUCER] Publishing event to topic '{self.topic}'...")
        topic_queue.put(payload)
        print(f"[KAFKA PRODUCER] Event pushed successfully.")

class MockKafkaConsumer:
    def __init__(self, topic):
        self.topic = topic

    def consume_all(self):
        records = []
        while not topic_queue.empty():
            records.append(topic_queue.get())
        return records