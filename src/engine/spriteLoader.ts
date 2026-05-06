export async function loadSprite(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject)=>{
    const image = new Image()
    image.src = src

    image.onload = () => {
      resolve(image)
    }
    image.onerror = () => {
      reject(new Error(`Failed to load sprite: ${src}`))
    }
  })
}
