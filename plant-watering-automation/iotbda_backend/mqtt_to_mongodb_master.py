import paho.mqtt.client as mqtt
from pymongo import MongoClient
import certifi
import json
from datetime import datetime

# ==================================================
# MQTT CONFIG
# ==================================================
BROKER = "broker.hivemq.com"
PORT = 1883

SENSOR_TOPIC = "iotbda/sensors"
EVENT_TOPIC = "iotbda/watering_events"

# ==================================================
# MONGODB CONFIG
# ==================================================
mongo_client = MongoClient(
    "mongodb+srv://lihiniullandupitiya_db_user:c4Hgyyee7dbt22my@cluster0.khlfwda.mongodb.net/?retryWrites=true&w=majority",
    tlsCAFile=certifi.where()
)

db = mongo_client["iotbda_database"]

sensor_collection = db["sensor_data"]
event_collection = db["watering_events"]

print("MongoDB Connected Successfully")

# ==================================================
# HELPERS
# ==================================================

def current_time():
    return datetime.now()


# ==================================================
# SAVE SENSOR DATA
# ==================================================
def save_sensor_data(data):
    document = {
        # environment
        "temperature": data.get("temperature"),
        "humidity": data.get("humidity"),
        "light": data.get("light"),

        # soil sensors
        "soil1_raw": data.get("soil1_raw"),
        "soil1_pct": data.get("soil1_pct"),

        "soil2_raw": data.get("soil2_raw"),
        "soil2_pct": data.get("soil2_pct"),

        "soil3_raw": data.get("soil3_raw"),
        "soil3_pct": data.get("soil3_pct"),

        # metadata
        "plant1_type": "money_plant",
        "plant2_type": "snake_plant",
        "plant3_type": "cactus",

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

        "timestamp": current_time()
    }

    sensor_collection.insert_one(document)
    print("Saved sensor_data")


# ==================================================
# SAVE WATERING EVENT
# ==================================================
def save_watering_event(data):
    document = {
        "plant_id": data.get("plant_id"),
        "plant_type": data.get("plant_type"),

        "prediction": data.get("prediction"),
        "soil_before": data.get("soil_before"),
        "soil_after": data.get("soil_after"),

        "duration_sec": data.get("duration_sec"),

        "impact_gain": (
            round(
                float(data.get("soil_after", 0)) -
                float(data.get("soil_before", 0)),
                2
            )
        ),

        "timestamp": current_time()
    }

    event_collection.insert_one(document)
    print("Saved watering_events")


# ==================================================
# MQTT CALLBACKS
# ==================================================
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT Broker")

        client.subscribe(SENSOR_TOPIC)
        client.subscribe(EVENT_TOPIC)

        print("Subscribed to:")
        print("-", SENSOR_TOPIC)
        print("-", EVENT_TOPIC)

    else:
        print("MQTT Connection Failed:", rc)


def on_message(client, userdata, msg):
    try:
        topic = msg.topic
        payload = msg.payload.decode()

        print("\n--------------------------------")
        print("Topic:", topic)
        print("Payload:", payload)

        data = json.loads(payload)

        # route by topic
        if topic == SENSOR_TOPIC:
            save_sensor_data(data)

        elif topic == EVENT_TOPIC:
            save_watering_event(data)

        else:
            print("Unknown topic ignored")

    except Exception as e:
        print("Error processing message:", e)


# ==================================================
# MAIN MQTT CLIENT
# ==================================================
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1)

client.on_connect = on_connect
client.on_message = on_message

print("Connecting to MQTT Broker...")
client.connect(BROKER, PORT)

client.loop_forever()