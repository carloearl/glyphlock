import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Blocks, Hash, Shield, CheckCircle2, Copy, FileCheck, Lock, AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion, useInView } from "framer-motion";
import { toast } from "sonner";
export default function Blockchain() {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true, amount: 0.4 });
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.3 });

  const [user, setUser] = useState(null);
  const [inputText, setInputText] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          const userData = await base44.auth.me();
          setUser(userData);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    })();
  }, []);
  const [hashes, setHashes] = useState({});
  const [merkleTree, setMerkleTree] = useState(null);
  const [blockData, setBlockData] = useState({
    index: 0,
    timestamp: "",
    data: "",
    previousHash: "",
    nonce: 0,
    hash: "",
    difficulty: 2
  });
  const [isMining, setIsMining] = useState(false);
  const [verificationData, setVerificationData] = useState({
    original: "",
    hash: "",
    result: null
  });

  // Generate multiple hash algorithms
  const generateHashes = async () => {
    if (!inputText) return;

    const encoder = new TextEncoder();
    const data = encoder.encode(inputText);

    const results = {};

    // SHA-256
    const hash256Buffer = await crypto.subtle.digest('SHA-256', data);
    const hash256Array = Array.from(new Uint8Array(hash256Buffer));
    results.sha256 = hash256Array.map(b => b.toString(16).padStart(2, '0')).join('');

    // SHA-512
    const hash512Buffer = await crypto.subtle.digest('SHA-512', data);
    const hash512Array = Array.from(new Uint8Array(hash512Buffer));
    results.sha512 = hash512Array.map(b => b.toString(16).padStart(2, '0')).join('');

    // SHA-1 (for comparison, not recommended for security)
    const hash1Buffer = await crypto.subtle.digest('SHA-1', data);
    const hash1Array = Array.from(new Uint8Array(hash1Buffer));
    results.sha1 = hash1Array.map(b => b.toString(16).padStart(2, '0')).join('');

    // Generate timestamp
    results.timestamp = new Date().toISOString();
    results.length = inputText.length;

    setHashes(results);

    // LOG TO LEDGER
    if (user) {
      try {
        await base44.entities.BlockchainActivity.create({
          user_email: user.email,
          operation_type: "hash_generation",
          input_data: inputText.substring(0, 100),
          input_hash: results.sha256,
          output_hash: results.sha256,
          algorithm: "SHA-256/SHA-512/SHA-1",
          metadata: { sha256: results.sha256, sha512: results.sha512, sha1: results.sha1 }
        });
      } catch (err) {
        console.error("Failed to log blockchain activity:", err);
      }
    }
  };

  // Merkle Tree Generation
  const generateMerkleTree = async () => {
    if (!inputText) return;

    const transactions = inputText.split('\n').filter(t => t.trim());
    if (transactions.length === 0) return;

    const leaves = await Promise.all(
      transactions.map(async (tx) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(tx);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      })
    );

    let currentLevel = leaves;
    const tree = [currentLevel];

    while (currentLevel.length > 1) {
      const nextLevel = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1] || left;
        const combined = left + right;
        const encoder = new TextEncoder();
        const data = encoder.encode(combined);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        nextLevel.push(hash);
      }
      currentLevel = nextLevel;
      tree.push(currentLevel);
    }

    const merkleRoot = currentLevel[0];

    setMerkleTree({
      root: merkleRoot,
      leaves: leaves,
      tree: tree,
      transactionCount: transactions.length
    });

    // LOG TO LEDGER
    if (user) {
      try {
        const encoder = new TextEncoder();
        const inputBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(inputText));
        const inputHashArray = Array.from(new Uint8Array(inputBuffer));
        const inputHash = inputHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        await base44.entities.BlockchainActivity.create({
          user_email: user.email,
          operation_type: "merkle_tree",
          input_data: inputText.substring(0, 100),
          input_hash: inputHash,
          output_hash: merkleRoot,
          algorithm: "SHA-256 Merkle",
          metadata: { transactionCount: transactions.length, treeDepth: tree.length }
        });
      } catch (err) {
        console.error("Failed to log merkle tree activity:", err);
      }
    }
  };

  // Block Mining Simulation
  const mineBlock = async () => {
    if (!blockData.data) return;

    setIsMining(true);
    const difficulty = blockData.difficulty;
    const target = '0'.repeat(difficulty);
    let nonce = 0;
    let hash = '';
    const timestamp = new Date().toISOString();

    const calculateHash = async (index, timestamp, data, previousHash, nonce) => {
      const blockString = `${index}${timestamp}${data}${previousHash}${nonce}`;
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(blockString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    // Simulate mining with delay for visualization
    const mine = async () => {
      for (let i = 0; i < 1000000; i++) { // Increased iterations for more realistic mining simulation
        hash = await calculateHash(
          blockData.index,
          timestamp,
          blockData.data,
          blockData.previousHash || '0'.repeat(64),
          nonce
        );

        if (hash.startsWith(target)) {
          break;
        }
        nonce++;
        if (i % 1000 === 0) { // Yield control to prevent UI freeze on high iterations
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      setBlockData({
        ...blockData,
        timestamp,
        nonce,
        hash
      });
      setIsMining(false);

      // LOG TO LEDGER
      if (user) {
        try {
          const blockString = `${blockData.index}${timestamp}${blockData.data}${blockData.previousHash || '0'.repeat(64)}`;
          const encoder = new TextEncoder();
          const inputBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(blockString));
          const inputHashArray = Array.from(new Uint8Array(inputBuffer));
          const inputHash = inputHashArray.map(b => b.toString(16).padStart(2, '0')).join('');

          await base44.entities.BlockchainActivity.create({
            user_email: user.email,
            operation_type: "block_mining",
            input_data: blockData.data.substring(0, 100),
            input_hash: inputHash,
            output_hash: hash,
            algorithm: "SHA-256 PoW",
            metadata: { nonce, difficulty: blockData.difficulty, blockIndex: blockData.index }
          });
        } catch (err) {
          console.error("Failed to log block mining activity:", err);
        }
      }
    };

    await mine();
  };

  // Verify Hash Integrity
  const verifyHash = async () => {
    if (!verificationData.original || !verificationData.hash) return;

    const encoder = new TextEncoder();
    const data = encoder.encode(verificationData.original);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const calculatedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const isValid = calculatedHash === verificationData.hash.toLowerCase();

    setVerificationData({
      ...verificationData,
      result: {
        valid: isValid,
        calculatedHash: calculatedHash,
        providedHash: verificationData.hash.toLowerCase()
      }
    });

    // LOG TO LEDGER
    if (user) {
      try {
        await base44.entities.BlockchainActivity.create({
          user_email: user.email,
          operation_type: "hash_verification",
          input_data: verificationData.original.substring(0, 100),
          input_hash: calculatedHash,
          output_hash: verificationData.hash.toLowerCase(),
          algorithm: "SHA-256 Verify",
          metadata: { isValid, providedHash: verificationData.hash.toLowerCase() }
        });
      } catch (err) {
        console.error("Failed to log verification activity:", err);
      }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
      <div className="min-h-screen bg-black text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div ref={heroRef} className="text-center mb-12">
              <motion.div 
                initial={{ opacity: 0, scale: 0.7 }}
                animate={heroInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.9, type: "spring", stiffness: 120 }}
                className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mx-auto mb-6"
              >
                <Blocks className="w-8 h-8 text-white" />
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, x: -100 }}
                animate={heroInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 1.1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl md:text-5xl font-bold mb-4"
              >
                <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Blockchain</span> Security Suite
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: 100 }}
                animate={heroInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 1.1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="text-xl text-white mb-2"
              >
                Enterprise-grade cryptographic verification and blockchain tools
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-center gap-2 text-sm text-blue-400"
              >
                <Shield className="w-4 h-4" />
                <span>SHA-256/512, Merkle Trees, Block Mining & Integrity Verification</span>
              </motion.div>
            </div>

            <Tabs defaultValue="hash" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 bg-gray-900 p-2">
                <TabsTrigger value="hash" className="text-white data-[state=active]:text-blue-400 min-h-[52px] flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2">
                  <Hash className="w-5 h-5 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm">Hashing</span>
                </TabsTrigger>
                <TabsTrigger value="merkle" className="text-white data-[state=active]:text-blue-400 min-h-[52px] flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2">
                  <Blocks className="w-5 h-5 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm">Merkle</span>
                </TabsTrigger>
                <TabsTrigger value="mining" className="text-white data-[state=active]:text-blue-400 min-h-[52px] flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2">
                  <Lock className="w-5 h-5 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm">Mining</span>
                </TabsTrigger>
                <TabsTrigger value="verify" className="text-white data-[state=active]:text-blue-400 min-h-[52px] flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2">
                  <CheckCircle2 className="w-5 h-5 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm">Verify</span>
                </TabsTrigger>
              </TabsList>

              {/* Cryptographic Hashing */}
              <TabsContent value="hash">
                <div className="flex flex-col gap-6 md:grid md:grid-cols-2">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white">Generate Cryptographic Hash</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label htmlFor="input" className="text-white">Input Text or Data</Label>
                        <Textarea
                          id="input"
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder="Enter text to hash..."
                          className="bg-gray-800 border-gray-700 text-white"
                          rows={5}
                        />
                      </div>

                      <Button
                        onClick={generateHashes}
                        disabled={!inputText}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                      >
                        <Hash className="w-4 h-4 mr-2" />
                        Generate Hashes
                      </Button>

                      {hashes.sha256 && (
                        <Alert className="bg-green-500/10 border-green-500/30">
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                          <AlertDescription className="text-white">
                            <strong>Hashes generated successfully</strong>
                            <div className="text-xs text-gray-400 mt-1">
                              {hashes.timestamp} • {hashes.length} characters
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    {hashes.sha256 && (
                      <>
                        <Card className="bg-gray-900 border-gray-800">
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">SHA-256</Badge>
                                <span className="text-xs text-gray-400">256-bit</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(hashes.sha256)}
                                className="text-white hover:text-blue-400"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-sm font-mono break-all text-white bg-gray-800 p-3 rounded">{hashes.sha256}</p>
                          </CardContent>
                        </Card>

                        <Card className="bg-gray-900 border-gray-800">
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">SHA-512</Badge>
                                <span className="text-xs text-gray-400">512-bit</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(hashes.sha512)}
                                className="text-white hover:text-blue-400"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-sm font-mono break-all text-white bg-gray-800 p-3 rounded">{hashes.sha512}</p>
                          </CardContent>
                        </Card>

                        <Card className="bg-gray-900 border-gray-800">
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">SHA-1</Badge>
                                <span className="text-xs text-gray-400">160-bit (Legacy)</span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(hashes.sha1)}
                                className="text-white hover:text-blue-400"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-sm font-mono break-all text-white bg-gray-800 p-3 rounded">{hashes.sha1}</p>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Merkle Tree */}
              <TabsContent value="merkle">
                <div className="flex flex-col gap-6 md:grid md:grid-cols-2">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white">Generate Merkle Tree</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label htmlFor="transactions" className="text-white">Transactions (one per line)</Label>
                        <Textarea
                          id="transactions"
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder="Transaction 1&#10;Transaction 2&#10;Transaction 3&#10;Transaction 4"
                          className="bg-gray-800 border-gray-700 text-white"
                          rows={8}
                        />
                      </div>

                      <Button
                        onClick={generateMerkleTree}
                        disabled={!inputText}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                      >
                        <Blocks className="w-4 h-4 mr-2" />
                        Build Merkle Tree
                      </Button>

                      {merkleTree && (
                        <Alert className="bg-blue-500/10 border-blue-500/30">
                          <FileCheck className="h-4 w-4 text-blue-400" />
                          <AlertDescription className="text-white">
                            <strong>Merkle tree generated</strong>
                            <div className="text-xs text-gray-400 mt-1">
                              {merkleTree.transactionCount} transactions • {merkleTree.tree.length} levels
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  {merkleTree && (
                    <div className="space-y-4">
                      <Card className="bg-gray-900 border-gray-800">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-white">Merkle Root</CardTitle>
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                              Verified
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-gray-800 p-4 rounded-lg">
                            <p className="text-sm font-mono break-all text-white">{merkleTree.root}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(merkleTree.root)}
                            className="w-full mt-2 text-white hover:text-blue-400"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Root Hash
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-900 border-gray-800">
                        <CardHeader>
                          <CardTitle className="text-white">Tree Structure</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {merkleTree.tree.slice().reverse().map((level, idx) => (
                            <div key={idx}>
                              <div className="text-xs text-gray-400 mb-1">
                                Level {merkleTree.tree.length - idx - 1} ({level.length} {level.length === 1 ? 'node' : 'nodes'})
                              </div>
                              <div className="space-y-1">
                                {level.map((hash, hashIdx) => (
                                  <div key={hashIdx} className="bg-gray-800 p-2 rounded text-xs font-mono break-all text-white">
                                    {hash.substring(0, 16)}...{hash.substring(hash.length - 16)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Block Mining */}
              <TabsContent value="mining">
                <div className="flex flex-col gap-6 md:grid md:grid-cols-2">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white">Mine Block</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label className="text-white">Block Index</Label>
                        <Input
                          type="number"
                          value={blockData.index}
                          onChange={(e) => setBlockData({...blockData, index: parseInt(e.target.value) || 0})}
                          className="bg-gray-800 border-gray-700 text-white"
                        />
                      </div>

                      <div>
                        <Label className="text-white">Block Data</Label>
                        <Textarea
                          value={blockData.data}
                          onChange={(e) => setBlockData({...blockData, data: e.target.value})}
                          placeholder="Enter block data..."
                          className="bg-gray-800 border-gray-700 text-white"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label className="text-white">Previous Block Hash</Label>
                        <Input
                          value={blockData.previousHash}
                          onChange={(e) => setBlockData({...blockData, previousHash: e.target.value})}
                          placeholder="0000000000000000000000000000000000000000000000000000000000000000"
                          className="bg-gray-800 border-gray-700 text-white font-mono text-xs"
                        />
                      </div>

                      <div>
                        <Label className="text-white">Difficulty (leading zeros)</Label>
                        <div className="flex items-center gap-4">
                          <Input
                            type="range"
                            min="1"
                            max="5"
                            value={blockData.difficulty}
                            onChange={(e) => setBlockData({...blockData, difficulty: parseInt(e.target.value)})}
                            className="flex-1"
                          />
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                            {blockData.difficulty}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Higher difficulty = more computational work
                        </p>
                      </div>

                      <Button
                        onClick={mineBlock}
                        disabled={!blockData.data || isMining}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                      >
                        {isMining ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Mining Block...
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Mine Block
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {blockData.hash && (
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-white">Mined Block</CardTitle>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Valid
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-sm text-gray-400">Block Hash</Label>
                          <div className="bg-gray-800 p-3 rounded-lg mt-1">
                            <p className="text-sm font-mono break-all text-white">{blockData.hash}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-gray-400">Nonce</Label>
                            <div className="bg-gray-800 p-3 rounded-lg mt-1">
                              <p className="text-lg font-bold text-white">{blockData.nonce.toLocaleString()}</p>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm text-gray-400">Difficulty</Label>
                            <div className="bg-gray-800 p-3 rounded-lg mt-1">
                              <p className="text-lg font-bold text-white">{blockData.difficulty}</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm text-gray-400">Timestamp</Label>
                          <div className="bg-gray-800 p-3 rounded-lg mt-1">
                            <p className="text-sm text-white">{blockData.timestamp}</p>
                          </div>
                        </div>

                        <Alert className="bg-blue-500/10 border-blue-500/30">
                          <Shield className="h-4 w-4 text-blue-400" />
                          <AlertDescription className="text-white text-xs">
                            This block has been mined with proof-of-work. The hash starts with {blockData.difficulty} zero{blockData.difficulty > 1 ? 's' : ''}, making it cryptographically valid.
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Verification */}
              <TabsContent value="verify">
                <div className="flex flex-col gap-6 md:grid md:grid-cols-2">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white">Verify Hash Integrity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <Label className="text-white">Original Data</Label>
                        <Textarea
                          value={verificationData.original}
                          onChange={(e) => setVerificationData({...verificationData, original: e.target.value, result: null})}
                          placeholder="Enter the original data..."
                          className="bg-gray-800 border-gray-700 text-white"
                          rows={5}
                        />
                      </div>

                      <div>
                        <Label className="text-white">Hash to Verify (SHA-256)</Label>
                        <Input
                          value={verificationData.hash}
                          onChange={(e) => setVerificationData({...verificationData, hash: e.target.value, result: null})}
                          placeholder="Enter hash to verify..."
                          className="bg-gray-800 border-gray-700 text-white font-mono text-xs"
                        />
                      </div>

                      <Button
                        onClick={verifyHash}
                        disabled={!verificationData.original || !verificationData.hash}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Verify Hash
                      </Button>
                    </CardContent>
                  </Card>

                  {verificationData.result && (
                    <Card className={`border-2 ${verificationData.result.valid ? 'bg-green-500/5 border-green-500/30' : 'bg-red-500/5 border-red-500/30'}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-white">Verification Result</CardTitle>
                          {verificationData.result.valid ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Valid
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Invalid
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Alert className={verificationData.result.valid ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}>
                          <AlertDescription className="text-white">
                            {verificationData.result.valid ? (
                              <>
                                <strong>✓ Hash is valid</strong>
                                <p className="text-xs text-gray-400 mt-1">
                                  The provided hash matches the calculated hash. Data integrity confirmed.
                                </p>
                              </>
                            ) : (
                              <>
                                <strong>✗ Hash mismatch detected</strong>
                                <p className="text-xs text-gray-400 mt-1">
                                  The provided hash does not match. Data may have been tampered with.
                                </p>
                              </>
                            )}
                          </AlertDescription>
                        </Alert>

                        <div>
                          <Label className="text-sm text-gray-400">Calculated Hash</Label>
                          <div className="bg-gray-800 p-3 rounded-lg mt-1">
                            <p className="text-xs font-mono break-all text-white">{verificationData.result.calculatedHash}</p>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm text-gray-400">Provided Hash</Label>
                          <div className="bg-gray-800 p-3 rounded-lg mt-1">
                            <p className="text-xs font-mono break-all text-white">{verificationData.result.providedHash}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Features Grid */}
            <div ref={featuresRef} className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Shield, title: "Immutable", desc: "Tamper-proof verification" },
                { icon: Hash, title: "Cryptographic", desc: "Industry-standard algorithms" },
                { icon: CheckCircle2, title: "Verified", desc: "Mathematically proven" },
                { icon: Blocks, title: "Merkle Trees", desc: "Efficient data structures" }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={featuresInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                  transition={{ duration: 0.9, delay: 0.1 + (idx * 0.1), type: "spring", stiffness: 100 }}
                >
                  <Card className="bg-gray-900 border-gray-800 text-center">
                    <CardContent className="pt-6">
                      <item.icon className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                      <h3 className="font-bold mb-2 text-white">{item.title}</h3>
                      <p className="text-sm text-white">{item.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
  );
}