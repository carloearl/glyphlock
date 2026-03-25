import React from "react";
import { ShieldOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md px-6">
        <ShieldOff className="w-16 h-16 text-red-400 mx-auto" />
        <div>
          <h1 className="text-3xl font-black text-red-400 mb-2">Access Denied</h1>
          <p className="text-gray-400">
            You do not have permission to access this area.
            Please contact your manager if you believe this is an error.
          </p>
        </div>
        <Button
          onClick={() => window.history.back()}
          variant="outline"
          className="border-red-500/40 text-red-400 hover:bg-red-500/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    </div>
  );
}