from pathlib import Path
import textwrap

INPUT_FILE = "models/model_quant.tflite"
OUTPUT_FILE = "models/model.h"
VAR_NAME = "plant_model"

def convert_to_c_array(data, var_name):
    hex_data = ", ".join([f"0x{b:02x}" for b in data])
    
    return textwrap.dedent(f"""
    #ifndef MODEL_H
    #define MODEL_H

    const unsigned char {var_name}[] = {{
        {hex_data}
    }};

    const unsigned int {var_name}_len = sizeof({var_name});

    #endif
    """)

# Read tflite file
tflite_bytes = Path(INPUT_FILE).read_bytes()

# Convert
header = convert_to_c_array(tflite_bytes, VAR_NAME)

# Save
Path(OUTPUT_FILE).write_text(header)

print("✅ model.h created successfully!")