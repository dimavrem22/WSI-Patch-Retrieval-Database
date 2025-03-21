import React from "react";

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="animate-spin h-12 w-12 rounded-full border-4 border-gray-300 border-t-blue-500"></div>
    </div>
  );
};

export default LoadingSpinner;
