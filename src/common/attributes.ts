type NumberMinAndMax = {
  min?: number
  max?: number
}

export function readNumberAttribute(
  element: HTMLElement,
  name: string,
  fallback: number,
  options: NumberMinAndMax = {},
): number {
  const value = element.getAttribute(name)
  if (value === null) return fallback
  
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) return fallback
  
  return clamp(numberValue, options.min, options.max)
}

function clamp(value: number, min?: number, max?: number): number {
  if (min !== undefined && value < min) {
    return min
  }
  if (max !== undefined && value > max) {
    return max
  }
  return value
}
