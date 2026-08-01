"use client";

import { useState, useEffect, useCallback } from "react";
import { GEMINI_MODELS, GeminiModelId } from "@/lib/gemini";

interface QuotaData {
  dayKey: string;       // YYYY-MM-DD
  dailyCount: number;
  minuteTimestamps: number[]; // epoch ms, untuk sliding window 60s
}

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function readStorage(modelId: string): QuotaData {
  try {
    const raw = localStorage.getItem(`gemini_quota_${modelId}`);
    if (!raw) throw new Error();
    return JSON.parse(raw) as QuotaData;
  } catch {
    return { dayKey: getTodayKey(), dailyCount: 0, minuteTimestamps: [] };
  }
}

function writeStorage(modelId: string, data: QuotaData) {
  localStorage.setItem(`gemini_quota_${modelId}`, JSON.stringify(data));
}

function computeState(data: QuotaData, rpmLimit: number, rpdLimit: number) {
  const todayKey = getTodayKey();
  // Reset daily counter if new day
  if (data.dayKey !== todayKey) {
    data = { dayKey: todayKey, dailyCount: 0, minuteTimestamps: [] };
  }

  const now = Date.now();
  // Filter timestamps within last 60s
  const recentMinute = data.minuteTimestamps.filter((ts) => now - ts < 60_000);

  const usedRPM = recentMinute.length;
  const usedRPD = data.dailyCount;
  const remainingRPM = Math.max(0, rpmLimit - usedRPM);
  const remainingRPD = Math.max(0, rpdLimit - usedRPD);

  // Time until oldest timestamp expires from the window
  const oldestInWindow = recentMinute[0];
  const msTilRPMReset = oldestInWindow ? Math.ceil((oldestInWindow + 60_000 - now) / 1000) : 0;

  return {
    usedRPM, usedRPD, remainingRPM, remainingRPD,
    rpmExhausted: remainingRPM === 0,
    rpdExhausted: remainingRPD === 0,
    msTilRPMReset,
    cleanData: { ...data, minuteTimestamps: recentMinute },
  };
}

export function useGeminiQuota(modelId: GeminiModelId) {
  const modelConfig = GEMINI_MODELS.find(m => m.id === modelId) || GEMINI_MODELS[0];
  
  const [state, setState] = useState<{
    remainingRPM: number;
    remainingRPD: number;
    usedRPM: number;
    usedRPD: number;
    rpmExhausted: boolean;
    rpdExhausted: boolean;
    msTilRPMReset: number;
  }>({
    remainingRPM: modelConfig.rpm,
    remainingRPD: modelConfig.rpd,
    usedRPM: 0,
    usedRPD: 0,
    rpmExhausted: false,
    rpdExhausted: false,
    msTilRPMReset: 0,
  });

  const refresh = useCallback(() => {
    const data = readStorage(modelId);
    const s = computeState(data, modelConfig.rpm, modelConfig.rpd);
    writeStorage(modelId, s.cleanData);
    setState({
      remainingRPM: s.remainingRPM,
      remainingRPD: s.remainingRPD,
      usedRPM: s.usedRPM,
      usedRPD: s.usedRPD,
      rpmExhausted: s.rpmExhausted,
      rpdExhausted: s.rpdExhausted,
      msTilRPMReset: s.msTilRPMReset,
    });
  }, [modelId, modelConfig.rpm, modelConfig.rpd]);

  const recordUsage = useCallback(() => {
    const data = readStorage(modelId);
    const s = computeState(data, modelConfig.rpm, modelConfig.rpd);
    const updated: QuotaData = {
      ...s.cleanData,
      dailyCount: s.cleanData.dailyCount + 1,
      minuteTimestamps: [...s.cleanData.minuteTimestamps, Date.now()],
    };
    writeStorage(modelId, updated);
    refresh();
  }, [modelId, modelConfig.rpm, modelConfig.rpd, refresh]);

  useEffect(() => {
    refresh();
    // Refresh every second so countdown ticks live
    const id = setInterval(refresh, 1000);
    return () => clearInterval(id);
  }, [refresh]);

  return {
    ...state,
    RPM_LIMIT: modelConfig.rpm,
    RPD_LIMIT: modelConfig.rpd,
    recordUsage,
  };
}
