from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
# Allow all domains/origins
CORS(app)

# Set the path to the folder where you want to check for files
FOLDER_PATH = 'path/to/your/folder'

@app.route('/check-file', methods=['GET'])
def check_file():
    filename = request.args.get('filename')
    if not filename:
        return jsonify({'error': 'Filename parameter is missing'}), 400

    file_path = os.path.join(FOLDER_PATH, filename)
    if os.path.isfile(file_path):
        return jsonify({'exists': True, 'message': 'File exists'}), 200
    else:
        return jsonify({'exists': False, 'message': 'File does not exist'}), 404

if __name__ == '__main__':
    app.run(debug=True)
