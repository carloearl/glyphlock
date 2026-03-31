import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function CardReaderPanel({ onCardRead, activeVenue }) {
  const venueId = activeVenue?.id || activeVenue?.venue_id;

  const { data: deviceConfig } = useQuery({
    queryKey: ['hw-card-terminal', venueId],
    queryFn: async () => {
      if (!venueId) return null;
      const records = await base44.entities.VenueHardware.filter({ venue_id: venueId, device_type: 'card_terminal' });
      return records.find(r => r.is_active !== false) || null;
    },
    enabled: !!venueId,
  });
  const [reading, setReading] = useState(false);
  const [lastCard, setLastCard] = useState(null);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualData, setManualData] = useState({ number: "", exp: "", cvv: "", name: "" });

  const handleSwipe = async () => {
    setReading(true);
    
    // Simulate card swipe via Adesso reader
    setTimeout(() => {
      const mockCard = {
        last_six: "123456",
        exp: "12/28",
        name: "JOHN DOE",
        type: "VISA",
        approval_code: `APV-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
      };
      
      setLastCard(mockCard);
      setReading(false);
      toast.success("Card read successfully");
      
      if (onCardRead) {
        onCardRead(mockCard);
      }
    }, 1800);
  };

  const handleManualSubmit = () => {
    if (!manualData.number || !manualData.exp) {
      toast.error("Card number and expiration required");
      return;
    }
    
    const card = {
      last_six: manualData.number.slice(-6),
      exp: manualData.exp,
      name: manualData.name || "CARDHOLDER",
      type: "MANUAL",
      approval_code: `MAN-${Math.random().toString(36).substr(2, 8).toUpperCase()}`
    };
    
    setLastCard(card);
    setManualEntry(false);
    toast.success("Card entered manually");
    
    if (onCardRead) {
      onCardRead(card);
    }
  };

  return (
    <Card className="bg-gray-900/60 border-blue-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-blue-400 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            {deviceConfig?.device_label || 'Card Reader'}
          </CardTitle>
          {deviceConfig?.is_sandbox && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 text-[10px]">Sandbox</Badge>
          )}
          {venueId && !deviceConfig && (
            <Badge className="bg-gray-700 text-gray-400 border-gray-600 text-[10px]">Not Configured</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {lastCard ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-green-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              Card Captured
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-gray-500">Card Type</div>
                <div className="text-white font-mono">{lastCard.type}</div>
              </div>
              <div>
                <div className="text-gray-500">Last 6 Digits</div>
                <div className="text-white font-mono">{lastCard.last_six}</div>
              </div>
              <div>
                <div className="text-gray-500">Expiration</div>
                <div className="text-white font-mono">{lastCard.exp}</div>
              </div>
              <div>
                <div className="text-gray-500">Name</div>
                <div className="text-white font-mono text-[10px]">{lastCard.name}</div>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setLastCard(null)}
              className="w-full text-xs border-gray-700 text-gray-400"
            >
              Clear & Read New Card
            </Button>
          </div>
        ) : manualEntry ? (
          <div className="space-y-2">
            <Input 
              placeholder="Card Number" 
              value={manualData.number}
              onChange={(e) => setManualData({...manualData, number: e.target.value.replace(/\D/g, '')})}
              maxLength={16}
              className="bg-gray-800 border-gray-700 font-mono"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input 
                placeholder="MM/YY" 
                value={manualData.exp}
                onChange={(e) => setManualData({...manualData, exp: e.target.value})}
                maxLength={5}
                className="bg-gray-800 border-gray-700 font-mono"
              />
              <Input 
                placeholder="CVV" 
                value={manualData.cvv}
                onChange={(e) => setManualData({...manualData, cvv: e.target.value.replace(/\D/g, '')})}
                maxLength={4}
                type="password"
                className="bg-gray-800 border-gray-700 font-mono"
              />
            </div>
            <Input 
              placeholder="Cardholder Name" 
              value={manualData.name}
              onChange={(e) => setManualData({...manualData, name: e.target.value.toUpperCase()})}
              className="bg-gray-800 border-gray-700 font-mono"
            />
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleManualSubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Submit
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setManualEntry(false)}
                className="border-gray-700 text-gray-400"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Button 
              onClick={handleSwipe}
              disabled={reading}
              className="w-full h-16 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 font-bold"
            >
              {reading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Reading Card...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Swipe or Insert Card
                </>
              )}
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={() => setManualEntry(true)}
              className="w-full text-xs border-gray-700 text-gray-400"
            >
              Manual Entry (Fallback)
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}