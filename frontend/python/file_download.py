import firebase_admin
from firebase_admin import credentials, storage
import os
from tqdm import tqdm

# Initialize Firebase Admin SDK
cred = credentials.Certificate('../../backend/serviceAccountKey.json')
firebase_admin.initialize_app(cred, {
    'storageBucket': 'auth-trial-ef98a.appspot.com'
})

bucket = storage.bucket()

# Create local directory to save files
local_directory = 'files'
os.makedirs(local_directory, exist_ok=True)

# List all files in the root directory of the storage bucket
blobs = list(bucket.list_blobs())

# Filter PDF files in the root directory
pdf_blobs = [blob for blob in blobs if blob.name.endswith('.pdf') and '/' not in blob.name]

# Download each PDF file with a progress bar
for blob in tqdm(pdf_blobs, desc="Downloading PDFs"):
    local_file_path = os.path.join(local_directory, blob.name)
    blob.download_to_filename(local_file_path)

print('Download completed.')

