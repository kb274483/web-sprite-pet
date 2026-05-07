export function readNumberAttribute(
  element: HTMLElement,
  name: string,
  fallback: number
):number {
  const value = element.getAttribute(name)
  if(value === null) return fallback
  
  const numberValue = Number(value)
  if(!Number.isFinite(numberValue)) return fallback

  return numberValue
}