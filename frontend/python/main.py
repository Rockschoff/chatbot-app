
file_id = 'file-v6lhxqJo0EgJEiA0h5wutDeD'
from openai import OpenAI
import json
client = OpenAI(api_key=api_key)


content = client.files.retrieve(file_id)
print(content)