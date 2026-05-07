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
  if (!Number.isFinite(numberValue)) {
    console.warn(
      `Attribute "${name}" received invalid number "${value}". ` +
      `Falling back to ${fallback}.`
    )
    return fallback
  }
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
  if(!allowedValues.includes(value as T)) {
    console.error(
      `Attribute "${name}" received unsupported value "${value}". ` +
      `Expected one of: ${allowedValues.join(', ')}. Falling back to "${fallback}".`
    )
    return fallback
  }

  return value as T
}
