import paho.mqtt.client as mqtt
from pymongo import MongoClient
import json
from datetime import datetime

# -------- MQTT CONFIG --------
BROKER = "broker.hivemq.com"
TOPIC = "iotbda/sensors"

# -------- MONGODB CONFIG --------
mongo_client = MongoClient("mongodb://localhost:27017/")
db = mongo_client["iotbda_database"]
collection = db["sensor_readings"]

print("MongoDB Connected")

# -------- MQTT EVENTS --------

def on_connect(client, userdata, flags, rc):

    if rc == 0:
        print("Connected to MQTT Broker")
        client.subscribe(TOPIC)
        print("Subscribed to:", TOPIC)
    else:
        print("Failed to connect, return code", rc)


def on_message(client, userdata, msg):

    try:

        payload = msg.payload.decode()
        print("\nReceived MQTT Message:")
        print(payload)

        # Convert JSON → Python dictionary
        data = json.loads(payload)

        # Create MongoDB document
        document = {

            "temperature": data.get("temperature"),
            "humidity": data.get("humidity"),
            "soil1": data.get("soil1"),
            "soil2": data.get("soil2"),
            "soil3": data.get("soil3"),
            "light": data.get("light"),   # NEW SENSOR FIELD

            "timestamp": datetime.now()
        }

        print("Saving document:", document)

        collection.insert_one(document)

        print("Data saved to MongoDB successfully")

    except Exception as e:

        print("Error processing message:", e)


# -------- MQTT CLIENT --------

client = mqtt.Client()

client.on_connect = on_connect
client.on_message = on_message

print("Connecting to MQTT Broker...")

client.connect(BROKER, 1883)

client.loop_forever()