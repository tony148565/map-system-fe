// src/utils/coordinate.js

// Coordinate Display Rule
// 本系統所有顯示在前端的座標統一使用小數點後4位
// 前端不顯示原始高精度座標
export function formatCoordinate(value, precision = 4) {
  return value.toFixed(Number(precision))
}