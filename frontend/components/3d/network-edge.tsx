'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { RiskLevel } from '@/lib/types';

interface NetworkEdgeProps {
  start: [number, number, number];
  end: [number, number, number];
  riskLevel: RiskLevel;
}

export function NetworkEdge({ start, end, riskLevel }: NetworkEdgeProps) {
  const lineRef = useRef<THREE.Line>(null);

  const colorMap: Record<RiskLevel, string> = {
    Safe: '#22c55e',
    Suspicious: '#eab308',
    Fraud: '#ef4444',
  };

  const points = useMemo(() => {
    return [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  }, [start, end]);

  useFrame((state) => {
    if (lineRef.current && riskLevel === 'Fraud') {
      const material = lineRef.current.material as THREE.LineBasicMaterial;
      material.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
    }
  });

  return (
    <Line
      ref={lineRef}
      points={points}
      color={colorMap[riskLevel]}
      lineWidth={riskLevel === 'Fraud' ? 2 : 1}
      transparent
      opacity={riskLevel === 'Fraud' ? 0.7 : 0.3}
    />
  );
}
