'use client';

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float } from '@react-three/drei';
import { NetworkNode } from './network-node';
import { NetworkEdge } from './network-edge';
import type { RiskLevel } from '@/lib/types';
import * as THREE from 'three';

interface NetworkData {
  id: string;
  type: 'user' | 'merchant' | 'transaction';
  riskLevel: RiskLevel;
  position: [number, number, number];
  label: string;
  amount?: number;
  riskScore?: number;
  connections: string[];
}

// Generate sample network data
function generateNetworkData(): NetworkData[] {
  const users: NetworkData[] = [];
  const merchants: NetworkData[] = [];
  const transactions: NetworkData[] = [];

  // Generate users in a sphere pattern
  for (let i = 0; i < 20; i++) {
    const theta = (i / 20) * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = 6 + Math.random() * 2;
    
    const riskRandom = Math.random();
    const riskLevel: RiskLevel = riskRandom > 0.85 ? 'Fraud' : riskRandom > 0.7 ? 'Suspicious' : 'Safe';
    
    users.push({
      id: `user-${i}`,
      type: 'user',
      riskLevel,
      position: [
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta),
      ],
      label: `USR-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      riskScore: riskLevel === 'Fraud' ? 80 + Math.random() * 20 : riskLevel === 'Suspicious' ? 50 + Math.random() * 30 : Math.random() * 50,
      connections: [],
    });
  }

  // Generate merchants in inner ring
  const merchantNames = ['Amazon', 'Walmart', 'Target', 'Unknown', 'Foreign ATM', 'Wire Transfer'];
  for (let i = 0; i < 6; i++) {
    const theta = (i / 6) * Math.PI * 2;
    const isHighRisk = merchantNames[i].includes('Unknown') || merchantNames[i].includes('Foreign') || merchantNames[i].includes('Wire');
    
    merchants.push({
      id: `merchant-${i}`,
      type: 'merchant',
      riskLevel: isHighRisk ? 'Suspicious' : 'Safe',
      position: [
        3 * Math.cos(theta),
        0,
        3 * Math.sin(theta),
      ],
      label: merchantNames[i],
      connections: [],
    });
  }

  // Generate transactions connecting users to merchants
  for (let i = 0; i < 30; i++) {
    const userIndex = Math.floor(Math.random() * users.length);
    const merchantIndex = Math.floor(Math.random() * merchants.length);
    const user = users[userIndex];
    const merchant = merchants[merchantIndex];
    
    const midPoint: [number, number, number] = [
      (user.position[0] + merchant.position[0]) / 2 + (Math.random() - 0.5) * 2,
      (user.position[1] + merchant.position[1]) / 2 + (Math.random() - 0.5) * 2,
      (user.position[2] + merchant.position[2]) / 2 + (Math.random() - 0.5) * 2,
    ];
    
    const riskLevel = user.riskLevel === 'Fraud' || merchant.riskLevel === 'Fraud' 
      ? 'Fraud' 
      : user.riskLevel === 'Suspicious' || merchant.riskLevel === 'Suspicious'
      ? 'Suspicious'
      : 'Safe';
    
    const txnId = `txn-${i}`;
    transactions.push({
      id: txnId,
      type: 'transaction',
      riskLevel,
      position: midPoint,
      label: `TXN-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      amount: Math.floor(Math.random() * 5000) + 50,
      riskScore: riskLevel === 'Fraud' ? 80 + Math.random() * 20 : riskLevel === 'Suspicious' ? 50 + Math.random() * 30 : Math.random() * 50,
      connections: [user.id, merchant.id],
    });
    
    user.connections.push(txnId);
    merchant.connections.push(txnId);
  }

  return [...users, ...merchants, ...transactions];
}

function AnimatedParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const positions = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#22c55e"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

function Scene() {
  const networkData = useMemo(() => generateNetworkData(), []);
  const nodeMap = useMemo(() => {
    const map = new Map<string, NetworkData>();
    networkData.forEach((node) => map.set(node.id, node));
    return map;
  }, [networkData]);

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#22c55e" />
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#ef4444" />

      {/* Render edges first */}
      {networkData.map((node) =>
        node.connections.map((connectionId) => {
          const connectedNode = nodeMap.get(connectionId);
          if (!connectedNode) return null;
          return (
            <NetworkEdge
              key={`${node.id}-${connectionId}`}
              start={node.position}
              end={connectedNode.position}
              riskLevel={node.riskLevel === 'Fraud' || connectedNode.riskLevel === 'Fraud' ? 'Fraud' : 
                         node.riskLevel === 'Suspicious' || connectedNode.riskLevel === 'Suspicious' ? 'Suspicious' : 'Safe'}
            />
          );
        })
      )}

      {/* Render nodes */}
      {networkData.map((node) => (
        <Float key={node.id} speed={1} rotationIntensity={0} floatIntensity={0.5}>
          <NetworkNode
            position={node.position}
            riskLevel={node.riskLevel}
            label={node.label}
            type={node.type}
            amount={node.amount}
            riskScore={node.riskScore}
          />
        </Float>
      ))}

      <AnimatedParticles />
      <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />
      <OrbitControls
        enableZoom
        enablePan
        enableRotate
        zoomSpeed={0.5}
        panSpeed={0.5}
        rotateSpeed={0.5}
        minDistance={5}
        maxDistance={30}
      />
    </>
  );
}

export function FraudNetworkScene() {
  return (
    <div className="w-full h-[calc(100vh-8rem)] rounded-xl overflow-hidden border border-border bg-background">
      <Canvas
        camera={{ position: [12, 8, 12], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#0a0a0f']} />
        <fog attach="fog" args={['#0a0a0f', 15, 40]} />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
