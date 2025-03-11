import React from "react";

const FullScreenError: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-red-100">
      <div className="text-center p-6 bg-white shadow-lg rounded-2xl border border-red-300 flex flex-col items-center justify-center w-full max-w-md">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p className="mt-2 text-lg text-gray-700 text-center">
          Cannot establish connection to server!
          Please ensure server is running, then reload.
        </p>
      </div>
    </div>
  );
};

export default FullScreenError;