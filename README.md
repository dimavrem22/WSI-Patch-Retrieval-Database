# WSI Patch Retrieval Database - Simple Viewer

This repository provides a simple version of the Whole Slide Image (WSI) Patch Retrieval Viewer. Follow the steps below to set up and run the retrieval server and viewer.

## Prerequisites
Ensure you have the following installed:
- [Conda](https://docs.conda.io/en/latest/miniconda.html)
- [Python 3.x](https://www.python.org/downloads/)
- [Node.js & npm](https://nodejs.org/)

## Installation

### 1. Clone the Repository
```sh
git clone https://github.com/dimavrem22/WSI-Patch-Retrieval-Database.git
cd WSI-Patch-Retrieval-Database
```

### 2. Setup the Retrieval Server
```sh
cd retrival_server
touch `.env`
conda env create -f environment.yaml
```
#### `./retrival_server/.env` File Setup
```txt
OPTIONAL: LOCATION WHERE YOU WANT THE WSI DATABASE TO BE STORED
APPLICATION_DATA_LOCATION="<DB_PATH>"
```


### 3. Setup the Frontend Viewer
```sh
cd viewer
touch `.env`
echo 'VITE_SERVER_URL="http://localhost:8000"' > .env
npm install
```

#### `./viewer/.env` File Setup
```
# ADDRESS ON WHICH THE BACKEND SERVER IS RUNNING
VITE_SERVER_URL="http://localhost:8000"

# OPTIONAL: IF YOU WANT TO MANUALLY SET THE DEFAULT FILE BROWSER PATH
VITE_DEFAULT_FILE_BROWSER_PATH="<DEFAULT_PATH>"
```

Ensure you specify the correct port in which you intend to run your backend server!

## Running the Application

### Start the Retrieval Server
```sh
cd retrival_server
conda activate wsi-server
python -m uvicorn simple:app --host 0.0.0.0 --port 8000 --reload
```

### Start the Frontend Viewer
```sh
cd viewer
npm run dev
```

## Usage
- The backend server runs on `http://0.0.0.0:8000/`
- The frontend viewer runs on `http://localhost:5173/`


