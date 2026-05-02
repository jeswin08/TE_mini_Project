'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Mesh } from 'three';
import type { RiskLevel } from '@/lib/types';

interface NetworkNodeProps {
  position: [number, number, number];
  riskLevel: RiskLevel;
  label: string;
  amount?: number;
  riskScore?: number;
  type: 'user' | 'merchant' | 'transaction';
}

export function NetworkNode({ 
  position, 
  riskLevel, 
  label, 
  amount, 
  riskScore,
  type 
}: NetworkNodeProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const colorMap: Record<RiskLevel, string> = {
    Safe: '#22c55e',
    Suspicious: '#eab308',
    Fraud: '#ef4444',
  };

  const emissiveIntensity = riskLevel === 'Fraud' ? 2 : riskLevel === 'Suspicious' ? 1 : 0.5;
  const size = type === 'user' ? 0.4 : type === 'merchant' ? 0.5 : 0.3;

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.1;
      
      // Pulse effect for fraud nodes
      if (riskLevel === 'Fraud') {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
        meshRef.current.scale.setScalar(scale);
      }
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {type === 'user' ? (
          <sphereGeometry args={[size, 32, 32]} />
        ) : type === 'merchant' ? (
          <boxGeometry args={[size, size, size]} />
        ) : (
          <octahedronGeometry args={[size]} />
        )}
        <meshStandardMaterial
          color={colorMap[riskLevel]}
          emissive={colorMap[riskLevel]}
          emissiveIntensity={hovered ? emissiveIntensity * 1.5 : emissiveIntensity}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      
      {/* Glow effect */}
      <mesh scale={1.3}>
        {type === 'user' ? (
          <sphereGeometry args={[size, 16, 16]} />
        ) : type === 'merchant' ? (
          <boxGeometry args={[size, size, size]} />
        ) : (
          <octahedronGeometry args={[size]} />
        )}
        <meshBasicMaterial
          color={colorMap[riskLevel]}
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* Tooltip on hover */}
      {hovered && (
        <Html center distanceFactor={10}>
          <div className="bg-card/95 backdrop-blur-md border border-border rounded-lg p-3 shadow-xl min-w-[160px] pointer-events-none">
            <p className="font-semibold text-sm text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground capitalize">{type}</p>
            {amount !== undefined && (
              <p className="text-xs mt-1 text-foreground">
                Amount: ${amount.toLocaleString()}
              </p>
            )}
            {riskScore !== undefined && (
              <p className="text-xs mt-1" style={{ color: colorMap[riskLevel] }}>
                Risk Score: {riskScore.toFixed(1)}
              </p>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
