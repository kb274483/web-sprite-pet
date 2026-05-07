type NumberMinAndMax = {
  min?: number
  max?: number
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

export function readStringAttribute<T extends string>(
  element: HTMLElement,
  name: string,
  fallback: T,
  allowedValues: readonly T[],
): T {
  const value = element.getAttribute(name)
  if(value === null) return fallback
  if(!allowedValues.includes(value as T)) return fallback

  return value as T
}
