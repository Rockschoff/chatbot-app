asst_id = 'asst_pFKlsLZhGpgbQGS2heqaojsX'
vector_store_id = "vs_D1fKWaJJGI6QKCJRVIx5ekZE"
api_key = 'sk-proj-WUmVKyExE0ldlamujMT1T3BlbkFJUHsm9JbEZyJu0IjmW8Ps'

from openai import OpenAI
import json
client = OpenAI(api_key=api_key)
print(1)
vector_store_files = client.beta.vector_stores.files.list(
  vector_store_id=vector_store_id,
  limit=100
)
print(vector_store_files)
print(2)
ans=[]
for file in vector_store_files.data:
    print("||")
    file_data = client.files.retrieve(file.id)
    ans.append({"file_name" : file_data.filename , "file_id" : file.id})

print(ans)
json_data = json.dumps(ans, indent=4)

with open('data.json', 'w') as file:
    file.write(json_data)
