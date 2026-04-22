import paho.mqtt.client as mqtt
from pymongo import MongoClient
import certifi
import json
from datetime import datetime

# -------- MQTT CONFIG --------
BROKER = "broker.hivemq.com"
TOPIC = "iotbda/sensors"

# -------- MONGODB CONFIG --------
#mongo_client = MongoClient("mongodb://localhost:27017/")
#db = mongo_client["iotbda_database"]
#collection = db["sensor_reading_collection"]

mongo_client = MongoClient(
    "mongodb+srv://lihiniullandupitiya_db_user:c4Hgyyee7dbt22my@cluster0.khlfwda.mongodb.net/?retryWrites=true&w=majority",
    tlsCAFile=certifi.where()
)

db = mongo_client["iotbda_database"]
collection = db["sensor_data"]

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
            # environment
            "temperature": data.get("temperature"),
            "humidity": data.get("humidity"),
            "light": data.get("light"),

            # soil sensor data
            "soil1_raw": data.get("soil1_raw"),
            "soil1_pct": data.get("soil1_pct"),

            "soil2_raw": data.get("soil2_raw"),
            "soil2_pct": data.get("soil2_pct"),

            "soil3_raw": data.get("soil3_raw"),
            "soil3_pct": data.get("soil3_pct"),

            # plant metadata
            "plant1_type": "money_plant",
            "plant2_type": "snake_plant",
            "plant3_type": "cactus",

            # data quality
            "is_valid": (
                data.get("temperature") is not None and
                data.get("humidity") is not None and
                data.get("light") is not None and
                data.get("soil1_raw") is not None and
                data.get("soil1_pct") is not None and
                data.get("soil2_raw") is not None and
                data.get("soil2_pct") is not None and
                data.get("soil3_raw") is not None and
                data.get("soil3_pct") is not None
            ),

            # time
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