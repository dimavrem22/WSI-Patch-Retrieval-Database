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
conda env create -f environment.yaml
```

### 3. Setup the Frontend Viewer
```sh
cd viewer
npm install
```

## Running the Application

### Start the Retrieval Server
```sh
cd retrival_server
conda activate wsi-server
python -m uvicorn simple:app --host 0.0.0.0 --port 8080 --reload
```

### Start the Frontend Viewer
```sh
cd viewer
npm run dev
```

## Usage
- The backend server runs on `http://0.0.0.0:8080/`
- The frontend viewer runs on `http://localhost:5173/`


